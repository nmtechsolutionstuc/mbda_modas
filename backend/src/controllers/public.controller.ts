import { Request, Response } from 'express'
import { z } from 'zod'
import { ok, created, notFound } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { prisma } from '../config/prisma'
import { lazyExpireOrders, createPublicOrder } from '../services/order.service'
import { getZipnovaQuotes, isZipnovaConfigured } from '../services/shipping.service'

// ── Catálogo público del revendedor ───────────────────────────────────────────

export const getPublicCatalog = asyncHandler(async (req: Request, res: Response) => {
  const { refCode } = req.params

  await lazyExpireOrders()

  const reseller = await prisma.reseller.findFirst({
    where: { referralCode: refCode, isActive: true },
    select: {
      id: true, storeName: true, storePhoto: true, referralCode: true, whatsapp: true,
    },
  })
  if (!reseller) return notFound(res, 'Catálogo no encontrado')

  const items = await prisma.catalogItem.findMany({
    where: { resellerId: reseller.id, product: { isActive: true } },
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

  // Agrupar categorías únicas del catálogo
  const categoryMap = new Map<string, { id: string; name: string }>()
  items.forEach(i => categoryMap.set(i.product.category.id, i.product.category))
  const categories = Array.from(categoryMap.values())

  const products = items.map(item => ({
    catalogItemId: item.id,
    productId:     item.product.id,
    name:          item.product.name,
    description:   item.product.description,
    photos:        item.product.photos,
    sellingPrice:  Number(item.sellingPrice),
    category:      item.product.category,
    variants:      item.product.variants,
    // Dimensiones para cálculo de envío (null si no fueron cargadas)
    weightGrams: item.product.weightGrams ?? null,
    dimH:        item.product.dimH != null ? Number(item.product.dimH) : null,
    dimW:        item.product.dimW != null ? Number(item.product.dimW) : null,
    dimL:        item.product.dimL != null ? Number(item.product.dimL) : null,
  }))

  ok(res, { reseller, products, categories })
})

export const getPublicProduct = asyncHandler(async (req: Request, res: Response) => {
  const { refCode, productId } = req.params

  const reseller = await prisma.reseller.findFirst({
    where: { referralCode: refCode, isActive: true },
    select: { id: true, storeName: true, storePhoto: true, referralCode: true, whatsapp: true },
  })
  if (!reseller) return notFound(res, 'Catálogo no encontrado')

  const catalogItem = await prisma.catalogItem.findFirst({
    where: { resellerId: reseller.id, productId },
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true } },
          variants: { select: { id: true, size: true, color: true, stock: true } },
        },
      },
    },
  })
  if (!catalogItem || !catalogItem.product.isActive) return notFound(res, 'Producto no encontrado')

  ok(res, {
    reseller,
    product: {
      catalogItemId: catalogItem.id,
      productId:     catalogItem.product.id,
      name:          catalogItem.product.name,
      description:   catalogItem.product.description,
      photos:        catalogItem.product.photos,
      sellingPrice:  Number(catalogItem.sellingPrice),
      category:      catalogItem.product.category,
      variants:      catalogItem.product.variants,
      weightGrams:   catalogItem.product.weightGrams ?? null,
      dimH:          catalogItem.product.dimH != null ? Number(catalogItem.product.dimH) : null,
      dimW:          catalogItem.product.dimW != null ? Number(catalogItem.product.dimW) : null,
      dimL:          catalogItem.product.dimL != null ? Number(catalogItem.product.dimL) : null,
    },
  })
})

// ── Crear pedido ──────────────────────────────────────────────────────────────

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    refCode:           z.string().length(6),
    buyerName:         z.string().min(2).max(80),
    buyerWhatsapp:     z.string().regex(/^\d{10,15}$/),
    buyerEmail:        z.string().email().optional().or(z.literal('')),
    shippingMethod:    z.enum(['CORREO_ARGENTINO', 'ANDREANI', 'LOCAL_PICKUP', 'OTHER_CARRIER']),
    shippingAddress:   z.string().max(200).optional(),
    shippingCity:      z.string().max(80).optional(),
    shippingProvince:  z.string().max(80).optional(),
    shippingZip:       z.string().max(20).optional(),
    shippingCost:      z.coerce.number().nonnegative().optional(),
    shippingQuoteData: z.string().max(1000).optional(),  // JSON snapshot del quote seleccionado
    buyerNote:         z.string().max(500).optional(),   // Nota libre del comprador
    items:             z.array(z.object({
      variantId: z.string().uuid(),
      quantity:  z.number().int().min(1).max(99),
    })).min(1),
  })

  const data = schema.parse(req.body)
  const { order, config } = await createPublicOrder({
    ...data,
    buyerEmail:        data.buyerEmail || undefined,
    shippingCost:      data.shippingCost,
    shippingQuoteData: data.shippingQuoteData,
    buyerNote:         data.buyerNote || undefined,
  })

  created(res, {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      buyerName: order.buyerName,
      total: order.total,
      status: order.status,
      reservedUntil: order.reservedUntil,
      items: order.items,
    },
    payment: {
      cbu: config.cbu,
      alias: config.alias,
      whatsapp: config.whatsapp,
      dispatchDays: config.dispatchDays,
    },
  })
})

// ── Config pública ────────────────────────────────────────────────────────────

export const getPublicConfig = asyncHandler(async (_req: Request, res: Response) => {
  const config = await prisma.config.findFirst({
    select: {
      cbu: true, alias: true, whatsapp: true, dispatchDays: true,
      maxCashDeliveryDays: true, shippingEnabled: true,
      // Defaults para cálculo de envío cuando el producto no tiene medidas propias
      defaultWeightGrams: true,
      defaultDimH: true, defaultDimW: true, defaultDimL: true,
    },
  })
  ok(res, config ? {
    ...config,
    defaultDimH: config.defaultDimH != null ? Number(config.defaultDimH) : null,
    defaultDimW: config.defaultDimW != null ? Number(config.defaultDimW) : null,
    defaultDimL: config.defaultDimL != null ? Number(config.defaultDimL) : null,
  } : config)
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

// ── Cotización de envío via Zipnova ───────────────────────────────────────────

const SHIPPING_FALLBACK = {
  quotes:  [] as unknown[],
  message: 'El costo de envío no pudo calcularse en este momento. Te lo informaremos por WhatsApp antes de confirmar tu pedido.',
}

export const getShippingCost = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    zipDestino:    z.string().min(4).max(8),
    weightGrams:   z.coerce.number().int().positive(),
    declaredValue: z.coerce.number().nonnegative().optional(),
    city:          z.string().max(80).optional(),
    state:         z.string().max(80).optional(),
    dimH:          z.coerce.number().positive().optional(),
    dimW:          z.coerce.number().positive().optional(),
    dimL:          z.coerce.number().positive().optional(),
  })

  const { zipDestino, weightGrams, declaredValue, city, state, dimH, dimW, dimL } = schema.parse(req.query)

  if (!isZipnovaConfigured()) {
    return ok(res, SHIPPING_FALLBACK)
  }

  try {
    const quotes = await getZipnovaQuotes({ zipDestino, weightGrams, declaredValue, city, state, dimH, dimW, dimL })

    // Aplicar descuento según tipo de entrega (domicilio vs sucursal)
    const config = await prisma.config.findFirst({
      select: { zipnovaDiscountPctHome: true, zipnovaDiscountPctBranch: true },
    })
    const discountHome   = config ? Number(config.zipnovaDiscountPctHome)   : 0
    const discountBranch = config ? Number(config.zipnovaDiscountPctBranch) : 0

    const adjustedQuotes = quotes.map(q => {
      const pct = q.serviceType === 'pickup_point' ? discountBranch : discountHome
      return pct > 0 ? { ...q, cost: Math.round(q.cost * (1 - pct / 100)) } : q
    })

    return ok(res, { quotes: adjustedQuotes })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error Zipnova'
    console.error('[shipping] Zipnova quote error:', msg)
    return ok(res, SHIPPING_FALLBACK)
  }
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
    },
  })
  ok(res, config)
})
