import { randomUUID } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma'
import { signAccessToken, signRefreshToken } from '../utils/jwt'

// 60 días en ms
const REFRESH_TTL_MS = 60 * 24 * 60 * 60 * 1000

// ── Password ──────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ── Referral code ─────────────────────────────────────────────────────────────

/**
 * Genera un código de referido de 6 caracteres alfanuméricos en mayúscula.
 * Detecta colisiones y reintenta hasta 20 veces.
 */
export async function generateReferralCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let attempts = 0
  while (true) {
    const code = Array.from(
      { length: 6 },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join('')
    const exists = await prisma.reseller.findUnique({ where: { referralCode: code } })
    if (!exists) return code
    if (++attempts > 20) throw new Error('No se pudo generar un referralCode único')
  }
}

// ── Session tokens ────────────────────────────────────────────────────────────

/**
 * Crea un par de tokens (access + refresh) para un revendedor.
 * Persiste el refresh token en la base de datos usando su `jti` como PK.
 */
export async function createResellerTokens(
  resellerId: string,
  email: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const jti = randomUUID()
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)

  const accessToken = signAccessToken({ sub: resellerId, email, role: 'RESELLER' })
  const refreshToken = signRefreshToken({ sub: resellerId, jti })

  await prisma.refreshToken.create({
    data: {
      id: jti,           // jti == DB primary key → lookup por jti en refresh
      token: refreshToken,
      resellerId,
      expiresAt,
    },
  })

  return { accessToken, refreshToken }
}

/**
 * Rota el refresh token: revoca el viejo y crea uno nuevo.
 * Devuelve el nuevo par de tokens o lanza si el token es inválido/revocado.
 */
export async function rotateRefreshToken(
  currentJti: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const dbToken = await prisma.refreshToken.findUnique({
    where: { id: currentJti },
    include: { reseller: { select: { id: true, email: true, isActive: true } } },
  })

  if (!dbToken || dbToken.revoked || dbToken.expiresAt < new Date()) {
    throw Object.assign(new Error('Token inválido o expirado'), { statusCode: 401 })
  }

  if (!dbToken.reseller.isActive) {
    await prisma.refreshToken.update({ where: { id: currentJti }, data: { revoked: true } })
    throw Object.assign(new Error('Cuenta desactivada'), { statusCode: 403 })
  }

  // Revocar el viejo
  await prisma.refreshToken.update({ where: { id: currentJti }, data: { revoked: true } })

  // Crear el nuevo
  return createResellerTokens(dbToken.reseller.id, dbToken.reseller.email)
}

/**
 * Revoca un refresh token por su jti.
 * No lanza si el token no existe (logout idempotente).
 */
export async function revokeRefreshToken(jti: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { id: jti, revoked: false },
    data: { revoked: true },
  })
}
