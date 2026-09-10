import { Request, Response } from 'express'
import { z } from 'zod'
import { ok, created, notFound, badRequest, unauthorized } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { prisma } from '../config/prisma'
import { hashPassword, verifyPassword, generateReferralCode, generateStoreSlug, assertCityHasCapacity } from '../services/auth.service'
import { stripHtml } from '../utils/sanitize'
import { maskCbu } from '../utils/cbu'

const STORE_THEMES = ['ELEGANTE', 'VARONIL', 'NARANJA', 'ROSA', 'MINIMAL'] as const

// ── Campos sensibles de una revendedora: requieren confirmar contraseña de
// admin y quedan registrados en el historial de auditoría ────────────────────
const SENSITIVE_RESELLER_FIELDS = ['cbu', 'alias', 'dni', 'address', 'city', 'postalCode'] as const
type SensitiveResellerField = typeof SENSITIVE_RESELLER_FIELDS[number]

function maskSensitiveField(field: SensitiveResellerField, value: string): string {
  if (field === 'cbu') return maskCbu(value)
  if (field === 'alias') {
    if (!value || value.length <= 4) return '****'
    return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2)
  }
  return value
}

export const listResellers = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    page:     z.coerce.number().int().min(1).default(1),
    limit:    z.coerce.number().int().min(1).max(100).default(20),
    isActive: z.coerce.boolean().optional(),
    approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    search:   z.string().max(100).optional(),
  })
  const q = schema.parse(req.query)
  const where = {
    ...(q.isActive !== undefined && { isActive: q.isActive }),
    ...(q.approvalStatus !== undefined && { approvalStatus: q.approvalStatus }),
    ...(q.search && {
      OR: [
        { firstName: { contains: q.search, mode: 'insensitive' as const } },
        { lastName:  { contains: q.search, mode: 'insensitive' as const } },
        { email:     { contains: q.search, mode: 'insensitive' as const } },
        { storeName: { contains: q.search, mode: 'insensitive' as const } },
      ],
    }),
  }
  const [resellers, total] = await Promise.all([
    prisma.reseller.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, email: true, dni: true,
        storeName: true, storeSlug: true, storePhoto: true, storeBio: true, storeTheme: true,
        whatsapp: true, cbu: true, alias: true, address: true, city: true, postalCode: true,
        referralCode: true, isActive: true, approvalStatus: true, createdAt: true,
        _count: { select: { catalogItems: true, orders: true, commissions: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.reseller.count({ where }),
  ])
  ok(res, { resellers, total, page: q.page, totalPages: Math.ceil(total / q.limit) })
})

export const deactivateReseller = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const reseller = await prisma.reseller.findUnique({ where: { id } })
  if (!reseller) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Revendedor no encontrado' } })
    return
  }
  const updated = await prisma.reseller.update({
    where: { id },
    data: { isActive: !reseller.isActive },
    select: { id: true, isActive: true, storeName: true },
  })
  ok(res, updated)
})

// ── Aprobación de solicitudes de autoregistro ─────────────────────────────────
// El autoregistro (POST /auth/reseller/register) nace PENDING y no puede
// loguearse hasta que el admin la apruebe acá — evita que se creen tiendas
// sin control.

export const approveReseller = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const reseller = await prisma.reseller.findUnique({ where: { id } })
  if (!reseller) { notFound(res, 'Revendedor no encontrado'); return }
  if (reseller.approvalStatus !== 'PENDING') {
    badRequest(res, 'Esta solicitud ya fue procesada.')
    return
  }
  const updated = await prisma.reseller.update({
    where: { id },
    data: { approvalStatus: 'APPROVED' },
    select: { id: true, storeName: true, approvalStatus: true },
  })
  ok(res, updated)
})

export const rejectReseller = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const reseller = await prisma.reseller.findUnique({ where: { id } })
  if (!reseller) { notFound(res, 'Revendedor no encontrado'); return }
  if (reseller.approvalStatus !== 'PENDING') {
    badRequest(res, 'Esta solicitud ya fue procesada.')
    return
  }
  const updated = await prisma.reseller.update({
    where: { id },
    data: { approvalStatus: 'REJECTED' },
    select: { id: true, storeName: true, approvalStatus: true },
  })
  ok(res, updated)
})

// ── Alta manual de revendedor ─────────────────────────────────────────────────

export const createReseller = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    firstName:  z.string().min(1).max(100),
    lastName:   z.string().min(1).max(100),
    dni:        z.string().min(6).max(15).optional(),
    email:      z.string().email(),
    password:   z.string().min(8),
    whatsapp:   z.string().regex(/^\d{10,15}$/, 'Formato inválido de WhatsApp'),
    storeName:  z.string().min(1).max(100),
    storeBio:   z.string().max(200).optional(),
    storeTheme: z.enum(STORE_THEMES).optional(),
    cbu:        z.string().regex(/^\d{22}$/, 'CBU debe tener 22 dígitos').optional(),
    alias:      z.string().min(6).max(30).optional(),
    address:    z.string().max(150).optional(),
    city:       z.string().max(80).optional(),
    postalCode: z.string().max(10).optional(),
  })
  const parsed = schema.parse(req.body)
  // storeName, address/city y storeBio se muestran en la tienda pública y en el
  // panel admin — se limpia cualquier etiqueta HTML antes de guardar.
  const data = {
    ...parsed,
    storeName: stripHtml(parsed.storeName),
    ...(parsed.address !== undefined && { address: stripHtml(parsed.address) }),
    ...(parsed.city !== undefined && { city: stripHtml(parsed.city) }),
    ...(parsed.storeBio !== undefined && { storeBio: stripHtml(parsed.storeBio) }),
  }

  const existing = await prisma.reseller.findUnique({ where: { email: data.email } })
  if (existing) {
    res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'El email ya está registrado' } })
    return
  }

  if (data.city) {
    try {
      await assertCityHasCapacity(data.city)
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string }
      res.status(err.status ?? 409).json({ success: false, error: { code: 'CONFLICT', message: err.message } })
      return
    }
  }

  const passwordHash = await hashPassword(data.password)
  const referralCode = await generateReferralCode()
  const storeSlug = await generateStoreSlug(data.storeName)

  const reseller = await prisma.reseller.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      dni: data.dni,
      email: data.email,
      passwordHash,
      whatsapp: data.whatsapp,
      storeName: data.storeName,
      storeSlug,
      storeBio: data.storeBio,
      storeTheme: data.storeTheme,
      cbu: data.cbu,
      alias: data.alias,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
      referralCode,
      termsAcceptedAt: new Date(),
    },
    select: {
      id: true, firstName: true, lastName: true, email: true, dni: true,
      storeName: true, storeSlug: true, storeBio: true, storeTheme: true, storePhoto: true,
      cbu: true, alias: true, address: true, city: true, postalCode: true,
      whatsapp: true, referralCode: true, isActive: true, approvalStatus: true, createdAt: true,
    },
  })
  created(res, reseller)
})

// ── Edición de revendedor ─────────────────────────────────────────────────────

export const updateReseller = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const schema = z.object({
    firstName:  z.string().min(1).max(100).optional(),
    lastName:   z.string().min(1).max(100).optional(),
    dni:        z.string().min(6).max(15).optional(),
    email:      z.string().email().optional(),
    whatsapp:   z.string().regex(/^\d{10,15}$/, 'Formato inválido de WhatsApp').optional(),
    storeName:  z.string().min(1).max(100).optional(),
    storeBio:   z.string().max(200).optional(),
    storeTheme: z.enum(STORE_THEMES).optional(),
    cbu:        z.string().regex(/^\d{22}$/, 'CBU debe tener 22 dígitos').optional(),
    alias:      z.string().min(6).max(30).optional(),
    address:    z.string().max(150).optional(),
    city:       z.string().max(80).optional(),
    postalCode: z.string().max(10).optional(),
    confirmPassword: z.string().optional(),
  })
  const parsed = schema.parse(req.body)

  const reseller = await prisma.reseller.findUnique({ where: { id } })
  if (!reseller) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Revendedor no encontrado' } })
    return
  }

  // ── Campos sensibles: requieren confirmar la contraseña del admin ─────────
  const touchedSensitive = SENSITIVE_RESELLER_FIELDS.filter(f => parsed[f] !== undefined)
  let admin: { id: string; name: string; passwordHash: string } | null = null

  if (touchedSensitive.length > 0) {
    if (!parsed.confirmPassword) {
      badRequest(res, 'Debés confirmar tu contraseña para modificar CBU, alias, DNI o dirección.')
      return
    }
    admin = await prisma.admin.findUnique({ where: { id: req.user!.sub } })
    if (!admin) { unauthorized(res, 'Admin no encontrado'); return }

    const valid = await verifyPassword(parsed.confirmPassword, admin.passwordHash)
    if (!valid) {
      unauthorized(res, 'Contraseña incorrecta. No se guardaron los cambios.')
      return
    }
  }

  if (parsed.email && parsed.email !== reseller.email) {
    const existing = await prisma.reseller.findUnique({ where: { email: parsed.email } })
    if (existing) {
      res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'El email ya está en uso por otra cuenta' } })
      return
    }
  }

  // storeName, address/city y storeBio se muestran en la tienda pública y en el
  // panel admin — se limpia cualquier etiqueta HTML antes de guardar.
  const { confirmPassword: _cp, ...rest } = parsed
  const data = {
    ...rest,
    ...(parsed.storeName !== undefined && { storeName: stripHtml(parsed.storeName) }),
    ...(parsed.address !== undefined && { address: stripHtml(parsed.address) }),
    ...(parsed.city !== undefined && { city: stripHtml(parsed.city) }),
    ...(parsed.storeBio !== undefined && { storeBio: stripHtml(parsed.storeBio) }),
  }

  if (touchedSensitive.length > 0 && admin) {
    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
          ?? req.socket.remoteAddress
          ?? 'unknown'

    const auditEntries = touchedSensitive.map(field => {
      const oldRaw = (reseller[field] as string | null) ?? ''
      const newRaw = (data[field] as string) ?? ''
      const needsMask = field === 'cbu' || field === 'alias'
      return {
        resellerId: reseller.id,
        resellerName: reseller.storeName,
        adminId: admin!.id,
        adminName: admin!.name,
        field,
        oldValue: needsMask ? maskSensitiveField(field, oldRaw) : (oldRaw || '-'),
        newValue: needsMask ? maskSensitiveField(field, newRaw) : (newRaw || '-'),
        ip,
      }
    })
    await prisma.resellerAuditLog.createMany({ data: auditEntries })
  }

  const updated = await prisma.reseller.update({
    where: { id },
    data,
    select: {
      id: true, firstName: true, lastName: true, email: true, dni: true,
      storeName: true, storeSlug: true, storeBio: true, storeTheme: true, storePhoto: true,
      cbu: true, alias: true, address: true, city: true, postalCode: true,
      whatsapp: true, referralCode: true, isActive: true, approvalStatus: true, createdAt: true,
    },
  })
  ok(res, updated)
})

/** GET /admin/resellers/:id/audit — historial de cambios sensibles de una revendedora */
export const getResellerAudit = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const limit = Math.min(Number(req.query['limit'] ?? 50), 200)

  const logs = await prisma.resellerAuditLog.findMany({
    where: { resellerId: id },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  ok(res, logs)
})

// ── Restablecer contraseña ────────────────────────────────────────────────────
// El admin puede resetear la contraseña de una revendedora que perdió acceso a
// su cuenta (olvidó la contraseña y no tiene forma de recuperarla sola todavía).

const ResetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-zA-Z]/, 'La contraseña debe tener al menos una letra')
    .regex(/[0-9]/, 'La contraseña debe tener al menos un número'),
})

export const resetResellerPassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const { password } = ResetPasswordSchema.parse(req.body)

  const reseller = await prisma.reseller.findUnique({ where: { id } })
  if (!reseller) { notFound(res, 'Revendedor no encontrado'); return }

  const passwordHash = await hashPassword(password)
  await prisma.reseller.update({ where: { id }, data: { passwordHash } })
  ok(res, { id })
})

// ── Eliminación de revendedor ─────────────────────────────────────────────────
// Solo permitida si no tiene pedidos ni comisiones (historial financiero) —
// en ese caso hay que desactivar la cuenta en lugar de borrarla.

export const deleteReseller = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const reseller = await prisma.reseller.findUnique({
    where: { id },
    include: { _count: { select: { orders: true, commissions: true } } },
  })
  if (!reseller) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Revendedor no encontrado' } })
    return
  }
  if (reseller._count.orders > 0 || reseller._count.commissions > 0) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'No se puede eliminar: tiene pedidos o comisiones asociadas. Desactivá la cuenta en su lugar.',
      },
    })
    return
  }
  await prisma.reseller.delete({ where: { id } })
  ok(res, { id })
})
