import { Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma'
import { ok } from '../utils/apiResponse'

// ── Schema de configuración ───────────────────────────────────────────────────

const UpdateConfigSchema = z.object({
  cbu: z.string().max(30).optional(),
  alias: z.string().max(60).optional(),
  whatsapp: z.string().max(20).optional(),
  dispatchDays: z.coerce.number().int().min(1).max(30).optional(),
  stockReserveHours: z.coerce.number().int().min(1).max(168).optional(),
  defaultWeightGrams: z.coerce.number().int().positive().optional().nullable(),
  defaultCommissionPct: z.coerce.number().min(1).max(100).optional().nullable(),
  correoApiKey: z.string().optional().nullable(),
  andreaniApiKey: z.string().optional().nullable(),
  termsContent: z.string().optional(),

  // Landing
  landingHeroTitle: z.string().max(120).optional(),
  landingHeroSubtitle: z.string().max(120).optional(),
  landingHeroDesc: z.string().max(300).optional(),
  landingCta1Text: z.string().max(60).optional(),
  landingCta2Text: z.string().max(60).optional(),
  landingHowTitle: z.string().max(120).optional(),
  landingStep1Title: z.string().max(80).optional(),
  landingStep1Desc: z.string().max(200).optional(),
  landingStep2Title: z.string().max(80).optional(),
  landingStep2Desc: z.string().max(200).optional(),
  landingStep3Title: z.string().max(80).optional(),
  landingStep3Desc: z.string().max(200).optional(),
})

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

  // Si se actualiza el contenido de los T&C, registrar la fecha
  const termsUpdate = data.termsContent !== undefined
    ? { termsUpdatedAt: new Date() }
    : {}

  const config = await prisma.config.upsert({
    where: { id: 'singleton' },
    update: { ...data, ...termsUpdate },
    create: { id: 'singleton', ...data, ...termsUpdate },
  })

  ok(res, config)
}

export async function getDashboardStats(_req: Request, res: Response): Promise<void> {
  const [
    totalProducts,
    activeProducts,
    totalCategories,
    totalResellers,
    activeResellers,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.reseller.count(),
    prisma.reseller.count({ where: { isActive: true } }),
  ])

  ok(res, {
    totalProducts,
    activeProducts,
    inactiveProducts: totalProducts - activeProducts,
    totalCategories,
    totalResellers,
    activeResellers,
  })
}
