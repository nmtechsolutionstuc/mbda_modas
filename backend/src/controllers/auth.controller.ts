import { Request, Response } from 'express'
import { z } from 'zod'
import type { Reseller } from '@prisma/client'
import { prisma } from '../config/prisma'
import { verifyPassword, hashPassword, generateReferralCode, generateStoreSlug, assertCityHasCapacity, createResellerTokens, rotateRefreshToken, revokeRefreshToken } from '../services/auth.service'
import { signAccessToken, verifyRefreshToken } from '../utils/jwt'
import { ok, created, unauthorized, forbidden, notFound, conflict } from '../utils/apiResponse'

// ── Protección brute-force (in-memory) ───────────────────────────────────────
// Registra intentos fallidos por email. Se limpia al reiniciar el servidor.
// Para producción con múltiples instancias, migrar a Redis.

interface AttemptRecord { count: number; firstAt: number; lockedUntil?: number }
const loginAttempts = new Map<string, AttemptRecord>()

const MAX_ATTEMPTS  = 5
const WINDOW_MS     = 15 * 60 * 1000   // ventana de 15 min
const LOCK_MS       = 30 * 60 * 1000   // bloqueo de 30 min

function recordFailedAttempt(email: string): void {
  const now   = Date.now()
  const entry = loginAttempts.get(email)
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    loginAttempts.set(email, { count: 1, firstAt: now })
  } else {
    entry.count += 1
    if (entry.count >= MAX_ATTEMPTS) {
      entry.lockedUntil = now + LOCK_MS
    }
  }
}

function checkLocked(email: string): boolean {
  const entry = loginAttempts.get(email)
  if (!entry?.lockedUntil) return false
  if (Date.now() > entry.lockedUntil) {
    loginAttempts.delete(email)
    return false
  }
  return true
}

function clearAttempts(email: string): void {
  loginAttempts.delete(email)
}

// ── Constantes de cookie ──────────────────────────────────────────────────────

const REFRESH_COOKIE = 'refresh_token'

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    maxAge: 60 * 24 * 60 * 60 * 1000, // 60 días
    path: '/api/v1/auth',
  })
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' })
}

// ── Helper: mapear Reseller a objeto de respuesta ─────────────────────────────

function resellerToPublic(r: Reseller) {
  return {
    id: r.id,
    email: r.email,
    firstName: r.firstName,
    lastName: r.lastName,
    dni: r.dni,
    storeName: r.storeName,
    storeSlug: r.storeSlug,
    storePhoto: r.storePhoto,
    storeBio: r.storeBio,
    whatsapp: r.whatsapp,
    cbu: r.cbu,
    alias: r.alias,
    address: r.address,
    city: r.city,
    postalCode: r.postalCode,
    deliveryMethod: r.deliveryMethod,
    referralCode: r.referralCode,
    isActive: r.isActive,
    onboardingSeenAt: r.onboardingSeenAt,
    storeTheme: r.storeTheme,
    role: 'RESELLER' as const,
  }
}

// ── Schemas de validación ─────────────────────────────────────────────────────

const AdminLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

const ResellerLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

const ResellerRegisterSchema = z.object({
  firstName: z.string().min(1, 'El nombre es requerido').max(100),
  lastName: z.string().min(1, 'El apellido es requerido').max(100),
  dni: z.string().min(6, 'DNI inválido').max(15),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'La contraseña debe tener al menos una letra')
    .regex(/[0-9]/, 'La contraseña debe tener al menos un número'),
  whatsapp: z.string().min(8, 'Número de WhatsApp inválido').max(20),
  storeName: z.string().min(1, 'El nombre de tu tienda es requerido').max(100),
  address: z.string().min(3, 'La dirección es requerida').max(150),
  city: z.string().min(2, 'La ciudad es requerida').max(80),
  postalCode: z.string().min(3, 'El código postal es requerido').max(10),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Debés aceptar los Términos y Condiciones' }) }),
})

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * POST /auth/admin/login
 * Sin refresh token — sesión stateless para el admin.
 */
export async function adminLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = AdminLoginSchema.parse(req.body)

  if (checkLocked(email)) {
    res.status(429).json({
      success: false,
      error: { code: 'ACCOUNT_LOCKED', message: 'Demasiados intentos fallidos. Esperá 30 minutos e intentá de nuevo.' },
    })
    return
  }

  const admin = await prisma.admin.findUnique({ where: { email } })
  if (!admin) { recordFailedAttempt(email); unauthorized(res, 'Credenciales inválidas'); return }

  const valid = await verifyPassword(password, admin.passwordHash)
  if (!valid) { recordFailedAttempt(email); unauthorized(res, 'Credenciales inválidas'); return }

  if (!admin.isActive) { forbidden(res, 'Tu cuenta fue desactivada. Contactá al administrador.'); return }

  clearAttempts(email)
  const accessToken = signAccessToken({ sub: admin.id, email: admin.email, role: admin.role })

  ok(res, {
    accessToken,
    user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  })
}

/**
 * POST /auth/reseller/register
 * Registra un nuevo revendedor con estado PENDING — no inicia sesión sola,
 * queda esperando que el admin la apruebe (evita que se creen cuentas/
 * tiendas sin control).
 */
export async function resellerRegister(req: Request, res: Response): Promise<void> {
  const data = ResellerRegisterSchema.parse(req.body)

  const existing = await prisma.reseller.findUnique({ where: { email: data.email } })
  if (existing) { conflict(res, 'El email ya está registrado'); return }

  try {
    await assertCityHasCapacity(data.city)
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string }
    res.status(err.status ?? 409).json({ success: false, error: { code: 'CONFLICT', message: err.message } })
    return
  }

  const passwordHash = await hashPassword(data.password)
  const referralCode = await generateReferralCode()
  const storeSlug = await generateStoreSlug(data.storeName)

  await prisma.reseller.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      dni: data.dni,
      email: data.email,
      passwordHash,
      whatsapp: data.whatsapp,
      storeName: data.storeName,
      storeSlug,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      referralCode,
      approvalStatus: 'PENDING',
      termsAcceptedAt: new Date(),
    },
  })

  created(res, {
    pending: true,
    message: 'Tu solicitud fue enviada. MBDA va a revisar tu cuenta y te avisamos cuando esté activa.',
  })
}

/**
 * POST /auth/reseller/login
 */
export async function resellerLogin(req: Request, res: Response): Promise<void> {
  const { email, password } = ResellerLoginSchema.parse(req.body)

  if (checkLocked(email)) {
    res.status(429).json({
      success: false,
      error: { code: 'ACCOUNT_LOCKED', message: 'Demasiados intentos fallidos. Esperá 30 minutos e intentá de nuevo.' },
    })
    return
  }

  const reseller = await prisma.reseller.findUnique({ where: { email } })
  if (!reseller) { recordFailedAttempt(email); unauthorized(res, 'Credenciales inválidas'); return }
  if (reseller.approvalStatus === 'PENDING') { forbidden(res, 'Tu cuenta todavía está pendiente de aprobación por MBDA.'); return }
  if (reseller.approvalStatus === 'REJECTED') { forbidden(res, 'Tu solicitud no fue aprobada. Contactá al administrador.'); return }
  if (!reseller.isActive) { forbidden(res, 'Tu cuenta fue desactivada. Contactá al administrador.'); return }

  const valid = await verifyPassword(password, reseller.passwordHash)
  if (!valid) { recordFailedAttempt(email); unauthorized(res, 'Credenciales inválidas'); return }

  clearAttempts(email)
  const { accessToken, refreshToken } = await createResellerTokens(reseller.id, reseller.email)
  setRefreshCookie(res, refreshToken)

  ok(res, { accessToken, user: resellerToPublic(reseller) })
}

/**
 * POST /auth/refresh
 * Lee la httpOnly cookie, rota el refresh token y devuelve un nuevo accessToken.
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  const token: string | undefined = req.cookies[REFRESH_COOKIE]
  if (!token) { unauthorized(res, 'No hay sesión activa'); return }

  let jti: string
  try {
    const payload = verifyRefreshToken(token)
    jti = payload.jti
  } catch {
    clearRefreshCookie(res)
    unauthorized(res, 'Token inválido o expirado')
    return
  }

  try {
    const { accessToken, refreshToken: newRefreshToken } = await rotateRefreshToken(jti)
    setRefreshCookie(res, newRefreshToken)
    ok(res, { accessToken })
  } catch (err: unknown) {
    clearRefreshCookie(res)
    const e = err as { statusCode?: number; message?: string }
    if (e.statusCode === 403) {
      forbidden(res, e.message ?? 'Sin permiso')
    } else {
      unauthorized(res, e.message ?? 'Token inválido o expirado')
    }
  }
}

/**
 * POST /auth/logout
 * Revoca el refresh token y limpia la cookie.
 */
export async function logout(req: Request, res: Response): Promise<void> {
  const token: string | undefined = req.cookies[REFRESH_COOKIE]
  if (token) {
    try {
      const payload = verifyRefreshToken(token)
      await revokeRefreshToken(payload.jti)
    } catch {
      // Token ya expirado o inválido — ignorar, solo limpiar cookie
    }
  }
  clearRefreshCookie(res)
  ok(res, { message: 'Sesión cerrada correctamente' })
}

/**
 * GET /auth/me
 * Devuelve los datos del usuario autenticado (admin o revendedor).
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  const { sub, role } = req.user!

  if (role === 'ADMIN' || role === 'SUBADMIN') {
    const admin = await prisma.admin.findUnique({ where: { id: sub } })
    if (!admin) { notFound(res, 'Admin no encontrado'); return }
    ok(res, { id: admin.id, email: admin.email, name: admin.name, role: admin.role })
    return
  }

  if (role === 'RESELLER') {
    const reseller = await prisma.reseller.findUnique({ where: { id: sub } })
    if (!reseller) { notFound(res, 'Revendedor no encontrado'); return }
    ok(res, resellerToPublic(reseller))
    return
  }

  unauthorized(res)
}
