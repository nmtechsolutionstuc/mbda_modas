import { Request, Response } from 'express'
import { ok, notFound } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { prisma } from '../config/prisma'
import { lazyExpireOrders } from '../services/order.service'

// ── Tienda pública de una revendedora (/tienda/:slug) ─────────────────────────

export const getPublicStore = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params

  await lazyExpireOrders()

  const reseller = await prisma.reseller.findFirst({
    where: { storeSlug: slug, isActive: true },
    select: {
      id: true, storeName: true, storePhoto: true, storeBio: true, referralCode: true, storeSlug: true,
      whatsapp: true, city: true, level: true, storeTheme: true,
    },
  })
  if (!reseller) return notFound(res, 'Tienda no encontrada')

  const config = await prisma.config.findFirst({ select: { cbu: true, alias: true, outfitBuilderEnabled: true } })

  const items = await prisma.catalogItem.findMany({
    where: { resellerId: reseller.id, visible: true, product: { isActive: true } },
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true } },
          variants: { select: { id: true, size: true, color: true, stock: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const categoryMap = new Map<string, { id: string; name: string }>()
  items.forEach(i => categoryMap.set(i.product.category.id, i.product.category))

  const products = items.map(item => ({
    catalogItemId: item.id,
    productId:     item.product.id,
    name:          item.product.name,
    description:   item.product.description,
    photos:        item.product.photos,
    youtubeVideoUrl: item.product.youtubeVideoUrl,
    sellingPrice:  Number(item.sellingPrice),
    category:      item.product.category,
    variants:      item.product.variants,
  }))

  ok(res, {
    reseller,
    products,
    categories: Array.from(categoryMap.values()),
    payment: { cbu: config?.cbu ?? '', alias: config?.alias ?? '' },
    outfitBuilderEnabled: config?.outfitBuilderEnabled ?? true,
  })
})

// ── Productos destacados (para la sección "Colección" de la home) ────────────
// Del catálogo general de MBDA, no de la tienda de una revendedora puntual.

export const getFeaturedProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { isActive: true, availableForResellers: true, photos: { isEmpty: false } },
    select: {
      id: true, name: true, basePrice: true, photos: true,
      category: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })
  ok(res, products.map(p => ({ ...p, basePrice: Number(p.basePrice) })))
})

// ── Testimonios activos (sección "Voces de la comunidad" de la home) ─────────

export const getPublicTestimonials = asyncHandler(async (_req: Request, res: Response) => {
  const testimonials = await prisma.testimonial.findMany({
    where: { isActive: true },
    select: { id: true, quote: true, name: true, city: true },
    orderBy: { order: 'asc' },
  })
  ok(res, testimonials)
})

// ── Preguntas frecuentes activas (sección "Preguntas" de la home) ────────────

export const getPublicFaq = asyncHandler(async (_req: Request, res: Response) => {
  const faqs = await prisma.faqItem.findMany({
    where: { isActive: true },
    select: { id: true, question: true, answer: true },
    orderBy: { order: 'asc' },
  })
  ok(res, faqs)
})

// ── Config pública ────────────────────────────────────────────────────────────

export const getPublicConfig = asyncHandler(async (_req: Request, res: Response) => {
  const config = await prisma.config.findFirst({
    select: {
      cbu: true, alias: true, whatsapp: true, dispatchDays: true,
      maxCashDeliveryDays: true, helpUrl: true,
    },
  })
  ok(res, config)
})

// ── Términos y Condiciones públicos ───────────────────────────────────────────

export const getPublicTerms = asyncHandler(async (_req: Request, res: Response) => {
  const config = await prisma.config.findFirst({
    select: { termsContent: true, termsUpdatedAt: true },
  })
  ok(res, {
    content: config?.termsContent ?? null,
    updatedAt: config?.termsUpdatedAt ?? null,
  })
})

export const getPublicPrivacyPolicy = asyncHandler(async (_req: Request, res: Response) => {
  const config = await prisma.config.findFirst({
    select: { privacyPolicyContent: true, privacyPolicyUpdatedAt: true },
  })
  ok(res, {
    content: config?.privacyPolicyContent ?? null,
    updatedAt: config?.privacyPolicyUpdatedAt ?? null,
  })
})

export const getPublicChangePolicy = asyncHandler(async (_req: Request, res: Response) => {
  const config = await prisma.config.findFirst({
    select: { changePolicyContent: true, changePolicyUpdatedAt: true },
  })
  ok(res, {
    content: config?.changePolicyContent ?? null,
    updatedAt: config?.changePolicyUpdatedAt ?? null,
  })
})

export const getPublicWithdrawalRight = asyncHandler(async (_req: Request, res: Response) => {
  const config = await prisma.config.findFirst({
    select: { withdrawalRightContent: true, withdrawalRightUpdatedAt: true },
  })
  ok(res, {
    content: config?.withdrawalRightContent ?? null,
    updatedAt: config?.withdrawalRightUpdatedAt ?? null,
  })
})

// ── Landing page content ──────────────────────────────────────────────────────

export const getLandingContent = asyncHandler(async (_req: Request, res: Response) => {
  const config = await prisma.config.findFirst({
    select: {
      landingHeroTitle: true, landingHeroSubtitle: true, landingHeroDesc: true,
      landingCta1Text: true, landingCta2Text: true,
      landingHowTitle: true,
      landingStep1Title: true, landingStep1Desc: true,
      landingStep2Title: true, landingStep2Desc: true,
      landingStep3Title: true, landingStep3Desc: true,
      landingHeroImage: true, landingHeroVideo: true, landingAboutText: true, landingManifesto: true,
      landingFeaturesImage: true, landingStep1Video: true, landingStep2Video: true, landingStep3Video: true,
      landingBenefit1Title: true, landingBenefit1Desc: true,
      landingBenefit2Title: true, landingBenefit2Desc: true,
      landingBenefit3Title: true, landingBenefit3Desc: true,
      landingBenefit4Title: true, landingBenefit4Desc: true,
      landingShowBenefits: true, landingShowProcess: true, landingShowCollection: true,
      landingShowResellerStory: true, landingShowTestimonials: true, landingShowFaq: true,
    },
  })
  ok(res, config)
})
