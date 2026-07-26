import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { verifyPassword } from '../services/auth.service'
import { validateCbu, maskCbu } from '../utils/cbu'
import { validateArgentinaPhone, stripHtml, sanitizeStrings } from '../utils/sanitize'
import { ok, badRequest, unauthorized } from '../utils/apiResponse'

// ── Sensitive fields that require password re-confirmation ────────────────────

const SENSITIVE_FIELDS = ['cbu', 'alias', 'whatsapp'] as const
type SensitiveField = typeof SENSITIVE_FIELDS[number]

// ── Schemas ───────────────────────────────────────────────────────────────────

const UpdateConfigSchema = z.object({
  // Sensitive — require confirmPassword when any of these are present
  cbu:       z.string().max(30).optional(),
  alias:     z.string().max(60).optional(),
  whatsapp:  z.string().max(30).optional(),

  // Operational
  dispatchDays:         z.coerce.number().int().min(1).max(30).optional(),
  stockReserveHours:    z.coerce.number().int().min(1).max(168).optional(),
  maxCashDeliveryDays:  z.coerce.number().int().min(1).max(30).optional(),
  pickupExpiryHours:    z.coerce.number().int().min(1).max(720).optional(),
  shippingEnabled:      z.boolean().optional(),

  // Feed "Prendas en Promo"
  feedEnabled:         z.boolean().optional(),
  feedSectionName:     z.string().min(1).max(60).optional(),
  feedMaxItems:        z.coerce.number().int().min(1).max(200).optional(),
  feedMaxPerReseller:  z.coerce.number().int().min(1).max(20).optional(),
  autoApproveListings: z.boolean().optional(),
  defaultWeightGrams:   z.coerce.number().int().positive().optional().nullable(),
  defaultCommissionPct: z.coerce.number().min(1).max(100).optional().nullable(),
  zipnovaDiscountPctHome:   z.coerce.number().min(0).max(50).optional(),
  zipnovaDiscountPctBranch: z.coerce.number().min(0).max(50).optional(),
  termsContent:         z.string().optional(),

  // Landing
  landingHeroTitle:    z.string().max(120).optional(),
  landingHeroSubtitle: z.string().max(120).optional(),
  landingHeroDesc:     z.string().max(300).optional(),
  landingCta1Text:     z.string().max(60).optional(),
  landingCta2Text:     z.string().max(60).optional(),
  landingHowTitle:     z.string().max(120).optional(),
  landingStep1Title:   z.string().max(80).optional(),
  landingStep1Desc:    z.string().max(200).optional(),
  landingStep2Title:   z.string().max(80).optional(),
  landingStep2Desc:    z.string().max(200).optional(),
  landingStep3Title:   z.string().max(80).optional(),
  landingStep3Desc:    z.string().max(200).optional(),

  // Password re-confirmation (required when touching sensitive fields)
  confirmPassword: z.string().optional(),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function maskAlias(alias: string): string {
  if (!alias || alias.length <= 4) return '****'
  return alias.slice(0, 2) + '*'.repeat(alias.length - 4) + alias.slice(-2)
}

function maskPhone(phone: string): string {
  if (!phone || phone.length <= 4) return '****'
  return '*'.repeat(phone.length - 4) + phone.slice(-4)
}

function getMaskFn(field: SensitiveField): (v: string) => string {
  if (field === 'cbu')      return maskCbu
  if (field === 'alias')    return maskAlias
  if (field === 'whatsapp') return maskPhone
  return (v) => v
}

// ── Handlers ──────────────────────────────────────────────────────────────────

export async function getConfig(_req: Request, res: Response): Promise<void> {
  const config = await prisma.config.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })

  ok(res, config)
}

export async function updateConfig(req: Request, res: Response): Promise<void> {
  const data = UpdateConfigSchema.parse(req.body)

  // ── 1. Check if any sensitive field is being changed ─────────────────────
  const touchedSensitive = SENSITIVE_FIELDS.filter(f => data[f] !== undefined)

  if (touchedSensitive.length > 0) {
    // Password re-confirmation is mandatory
    if (!data.confirmPassword) {
      badRequest(res, 'Debés confirmar tu contraseña para modificar CBU, alias o WhatsApp.')
      return
    }

    // Verify admin password
    const admin = await prisma.admin.findUnique({ where: { id: req.user!.sub } })
    if (!admin) { unauthorized(res, 'Admin no encontrado'); return }

    const valid = await verifyPassword(data.confirmPassword, admin.passwordHash)
    if (!valid) {
      unauthorized(res, 'Contraseña incorrecta. No se guardaron los cambios.')
      return
    }

    // ── 2. Validate and normalize sensitive fields ──────────────────────────

    if (data.cbu !== undefined) {
      const cbuResult = validateCbu(data.cbu)
      if (!cbuResult.valid) {
        badRequest(res, cbuResult.error ?? 'CBU inválido')
        return
      }
    }

    if (data.whatsapp !== undefined) {
      const phoneResult = validateArgentinaPhone(data.whatsapp)
      if (!phoneResult.valid) {
        badRequest(res, phoneResult.error ?? 'Número de WhatsApp inválido')
        return
      }
      // Normalize to 549XXXXXXXXXX
      data.whatsapp = phoneResult.normalized!
    }

    // ── 3. Get current config to log old values ─────────────────────────────
    const current = await prisma.config.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    })

    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
          ?? req.socket.remoteAddress
          ?? 'unknown'

    // ── 4. Write audit log entries for each sensitive field changing ─────────
    const auditEntries = touchedSensitive.map((field) => {
      const maskFn = getMaskFn(field)
      const oldRaw  = (current[field] as string | null | undefined) ?? ''
      const newRaw  = (data[field] as string) ?? ''
      return {
        adminId:   admin.id,
        adminName: admin.name,
        field,
        oldValue:  maskFn(oldRaw),
        newValue:  maskFn(newRaw),
        ip,
      }
    })

    await prisma.configAuditLog.createMany({ data: auditEntries })
  }

  // ── 5. Sanitize all string inputs ─────────────────────────────────────────
  // Strip HTML tags from text fields to prevent XSS stored in DB
  const { confirmPassword: _cp, ...updateData } = data

  const sanitized = sanitizeStrings(
    Object.fromEntries(
      Object.entries(updateData).filter(([, v]) => v !== undefined)
    ) as Record<string, unknown>
  ) as typeof updateData

  // ── 6. Persist config ─────────────────────────────────────────────────────
  const termsUpdate = sanitized.termsContent !== undefined ? { termsUpdatedAt: new Date() } : {}

  const config = await prisma.config.upsert({
    where: { id: 'singleton' },
    update: { ...sanitized, ...termsUpdate },
    create: { id: 'singleton', ...sanitized, ...termsUpdate },
  })

  ok(res, config)
}

/**
 * GET /admin/config/audit
 * Historial de cambios en CBU, alias y WhatsApp. Solo ADMIN.
 */
export async function getConfigAudit(req: Request, res: Response): Promise<void> {
  const field  = typeof req.query['field'] === 'string' ? req.query['field'] : undefined
  const limit  = Math.min(Number(req.query['limit'] ?? 50), 200)
  const offset = Number(req.query['offset'] ?? 0)

  const where = field ? { field } : {}

  const [logs, total] = await Promise.all([
    prisma.configAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    limit,
      skip:    offset,
    }),
    prisma.configAuditLog.count({ where }),
  ])

  ok(res, { logs, total, limit, offset })
}

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const [
    totalProducts,
    activeProducts,
    totalCategories,
    totalResellers,
    activeResellers,
    pendingOrders,
    pendingCommissions,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.reseller.count(),
    prisma.reseller.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.commission.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    }),
  ])

  ok(res, {
    totalProducts,
    activeProducts,
    inactiveProducts:    totalProducts - activeProducts,
    totalCategories,
    totalResellers,
    activeResellers,
    pendingOrders,
    pendingCommissionsAmount: Number(pendingCommissions._sum.amount ?? 0),
  })
}
