import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { verifyPassword } from '../services/auth.service'
import { validateCbu, maskCbu } from '../utils/cbu'
import { validateArgentinaPhone, stripHtml, sanitizeStrings } from '../utils/sanitize'
import { ok, created, badRequest, unauthorized, notFound } from '../utils/apiResponse'
import { persistPhotos, deletePhoto } from '../services/upload.service'
import { getLevelConfigs } from '../services/level.service'
import { getBonusTiers, replaceBonusTiers } from '../services/bonusTier.service'

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

  // Armador de outfits
  outfitBuilderEnabled: z.boolean().optional(),

  // Límite de revendedoras por ciudad
  cityResellerLimitEnabled: z.boolean().optional(),
  cityResellerLimitCount:   z.coerce.number().int().min(1).max(1000).optional(),

  // Ayuda
  helpUrl: z.string().max(300).optional(),
  termsContent:         z.string().optional(),
  privacyPolicyContent: z.string().optional(),
  changePolicyContent:  z.string().optional(),
  withdrawalRightContent: z.string().optional(),

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
  landingAboutText:    z.string().max(500).optional(),
  landingManifesto:    z.string().max(300).optional(),
  landingHeroVideo:     z.string().max(500).optional(),
  landingFeaturesImage: z.string().max(500).optional(),
  landingStep1Video:    z.string().max(500).optional(),
  landingStep2Video:    z.string().max(500).optional(),
  landingStep3Video:    z.string().max(500).optional(),

  landingBenefit1Title: z.string().max(80).optional(),
  landingBenefit1Desc:  z.string().max(300).optional(),
  landingBenefit2Title: z.string().max(80).optional(),
  landingBenefit2Desc:  z.string().max(300).optional(),
  landingBenefit3Title: z.string().max(80).optional(),
  landingBenefit3Desc:  z.string().max(300).optional(),
  landingBenefit4Title: z.string().max(80).optional(),
  landingBenefit4Desc:  z.string().max(300).optional(),

  landingShowBenefits:      z.boolean().optional(),
  landingShowProcess:       z.boolean().optional(),
  landingShowCollection:    z.boolean().optional(),
  landingShowResellerStory: z.boolean().optional(),
  landingShowTestimonials:  z.boolean().optional(),
  landingShowFaq:           z.boolean().optional(),

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
  const legalTimestamps = {
    ...(sanitized.termsContent !== undefined && { termsUpdatedAt: new Date() }),
    ...(sanitized.privacyPolicyContent !== undefined && { privacyPolicyUpdatedAt: new Date() }),
    ...(sanitized.changePolicyContent !== undefined && { changePolicyUpdatedAt: new Date() }),
    ...(sanitized.withdrawalRightContent !== undefined && { withdrawalRightUpdatedAt: new Date() }),
  }

  const config = await prisma.config.upsert({
    where: { id: 'singleton' },
    update: { ...sanitized, ...legalTimestamps },
    create: { id: 'singleton', ...sanitized, ...legalTimestamps },
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
    totalOrders,
    totalSales,
    pendingCommissions,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.reseller.count(),
    prisma.reseller.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: { in: ['CONFIRMED', 'DISPATCHED'] } } }),
    prisma.order.aggregate({
      where: { status: { in: ['CONFIRMED', 'DISPATCHED'] } },
      _sum: { total: true },
    }),
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
    totalOrders,
    totalSalesAmount: Number(totalSales._sum.total ?? 0),
    activeResellers,
    pendingOrders,
    pendingCommissionsAmount: Number(pendingCommissions._sum.amount ?? 0),
  })
}

// ── Niveles de revendedora ──────────────────────────────────────────────────

const UpdateLevelConfigsSchema = z.object({
  levels: z.array(z.object({
    level:           z.enum(['INICIAL', 'BRONCE', 'PLATA', 'ORO']),
    thresholdAmount: z.coerce.number().min(0),
    commissionPct:   z.coerce.number().min(0).max(100),
    maxMarkupPct:    z.coerce.number().min(0).max(500),
  })).length(4),
})

/** GET /admin/levels */
export async function getLevelConfigsHandler(_req: Request, res: Response): Promise<void> {
  const configs = await getLevelConfigs()
  ok(res, configs)
}

/** PATCH /admin/levels — actualiza las 4 filas de una sola vez */
export async function updateLevelConfigsHandler(req: Request, res: Response): Promise<void> {
  const { levels } = UpdateLevelConfigsSchema.parse(req.body)

  await prisma.$transaction(
    levels.map(l => prisma.levelConfig.update({
      where: { level: l.level },
      data: {
        thresholdAmount: l.thresholdAmount,
        commissionPct: l.commissionPct,
        maxMarkupPct: l.maxMarkupPct,
      },
    })),
  )

  const configs = await getLevelConfigs()
  ok(res, configs)
}

// ── Recompensa por volumen del ciclo ──────────────────────────────────────────

const UpdateBonusTiersSchema = z.object({
  tiers: z.array(z.object({
    thresholdAmount: z.coerce.number().min(0),
    bonusPct:        z.coerce.number().min(0).max(100),
  })).max(20),
})

/** GET /admin/bonus-tiers */
export async function getBonusTiersHandler(_req: Request, res: Response): Promise<void> {
  const tiers = await getBonusTiers()
  ok(res, tiers)
}

/** PATCH /admin/bonus-tiers — reemplaza toda la lista de tramos */
export async function updateBonusTiersHandler(req: Request, res: Response): Promise<void> {
  const { tiers } = UpdateBonusTiersSchema.parse(req.body)
  const updated = await replaceBonusTiers(tiers)
  ok(res, updated)
}

/**
 * PATCH /admin/config/landing-image
 * Sube (o reemplaza) la imagen de fondo del hero del home. Solo ADMIN.
 */
export async function updateLandingImage(req: Request, res: Response): Promise<void> {
  const file = req.file
  if (!file) { badRequest(res, 'Subí una imagen'); return }

  const current = await prisma.config.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })

  const [newUrl] = await persistPhotos([file])
  if (current.landingHeroImage) await deletePhoto(current.landingHeroImage)

  const config = await prisma.config.update({
    where: { id: 'singleton' },
    data: { landingHeroImage: newUrl },
  })

  ok(res, config)
}

/**
 * DELETE /admin/config/landing-image
 * Quita la imagen de fondo del hero — vuelve al degradé por defecto. Solo ADMIN.
 */
export async function removeLandingImage(_req: Request, res: Response): Promise<void> {
  const current = await prisma.config.findUnique({ where: { id: 'singleton' } })
  if (current?.landingHeroImage) await deletePhoto(current.landingHeroImage)

  const config = await prisma.config.update({
    where: { id: 'singleton' },
    data: { landingHeroImage: null },
  })

  ok(res, config)
}

// ── Testimonios (Home pública) ───────────────────────────────────────────────

const TestimonialSchema = z.object({
  quote: z.string().min(1).max(500),
  name: z.string().min(1).max(80),
  city: z.string().min(1).max(80),
  order: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
})

const UpdateTestimonialSchema = TestimonialSchema.partial()

export async function listTestimonialsHandler(_req: Request, res: Response): Promise<void> {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { order: 'asc' } })
  ok(res, testimonials)
}

export async function createTestimonialHandler(req: Request, res: Response): Promise<void> {
  const parsed = TestimonialSchema.parse(req.body)
  const data = sanitizeStrings(parsed) as typeof parsed
  const testimonial = await prisma.testimonial.create({ data })
  created(res, testimonial)
}

export async function updateTestimonialHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const parsed = UpdateTestimonialSchema.parse(req.body)
  const data = sanitizeStrings(parsed) as typeof parsed
  try {
    const testimonial = await prisma.testimonial.update({ where: { id }, data })
    ok(res, testimonial)
  } catch {
    notFound(res, 'Testimonio no encontrado')
  }
}

export async function deleteTestimonialHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  try {
    await prisma.testimonial.delete({ where: { id } })
    ok(res, { id })
  } catch {
    notFound(res, 'Testimonio no encontrado')
  }
}

// ── Preguntas frecuentes (Home pública) ──────────────────────────────────────

const FaqItemSchema = z.object({
  question: z.string().min(1).max(200),
  answer: z.string().min(1).max(1000),
  order: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
})

const UpdateFaqItemSchema = FaqItemSchema.partial()

export async function listFaqItemsHandler(_req: Request, res: Response): Promise<void> {
  const faqs = await prisma.faqItem.findMany({ orderBy: { order: 'asc' } })
  ok(res, faqs)
}

export async function createFaqItemHandler(req: Request, res: Response): Promise<void> {
  const parsed = FaqItemSchema.parse(req.body)
  const data = sanitizeStrings(parsed) as typeof parsed
  const faq = await prisma.faqItem.create({ data })
  created(res, faq)
}

export async function updateFaqItemHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const parsed = UpdateFaqItemSchema.parse(req.body)
  const data = sanitizeStrings(parsed) as typeof parsed
  try {
    const faq = await prisma.faqItem.update({ where: { id }, data })
    ok(res, faq)
  } catch {
    notFound(res, 'Pregunta no encontrada')
  }
}

export async function deleteFaqItemHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  try {
    await prisma.faqItem.delete({ where: { id } })
    ok(res, { id })
  } catch {
    notFound(res, 'Pregunta no encontrada')
  }
}
