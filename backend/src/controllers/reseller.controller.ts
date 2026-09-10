import { Request, Response } from 'express'
import { z } from 'zod'
import { ok, created } from '../utils/apiResponse'
import { stripHtml } from '../utils/sanitize'
import { asyncHandler } from '../utils/asyncHandler'
import { prisma } from '../config/prisma'
import {
  getResellerCatalog,
  getResellerCatalogItem,
  getAvailableProducts,
  addProductToCatalog,
  updateCatalogItem as updateCatalogItemService,
  removeFromCatalog,
} from '../services/catalog.service'
import {
  createReservation,
  resellerCancelReservation,
  getMonthlyRanking,
  getResellerDashboardSummary,
} from '../services/order.service'
import { getLevelConfigs } from '../services/level.service'
import { getMyCycles } from '../services/cycle.service'
import { persistPhotos, deletePhoto } from '../services/upload.service'

// ── Categorías accesibles por revendedor ────────────────────────────────────

export const getMyCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    select: { id: true, name: true },
  })
  ok(res, categories)
})

// ── Catálogo ─────────────────────────────────────────────────────────────────

export const getMyCatalog = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const items = await getResellerCatalog(resellerId)
  ok(res, items)
})

export const getMyProducts = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const schema = z.object({
    page:       z.coerce.number().int().min(1).default(1),
    limit:      z.coerce.number().int().min(1).max(100).default(24),
    categoryId: z.string().uuid().optional(),
    search:     z.string().max(100).optional(),
  })
  const q = schema.parse(req.query)
  const result = await getAvailableProducts(resellerId, q)
  ok(res, result)
})

export const addToCatalog = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const schema = z.object({
    productId:    z.string().uuid(),
    sellingPrice: z.number().positive(),
    saleMode:     z.enum(['PRESENCIAL', 'ONLINE']).default('ONLINE'),
  })
  const { productId, sellingPrice, saleMode } = schema.parse(req.body)
  const item = await addProductToCatalog(resellerId, productId, sellingPrice, saleMode)
  created(res, item)
})

export const getMyCatalogItem = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const { id } = req.params
  const item = await getResellerCatalogItem(resellerId, id)
  ok(res, item)
})

export const updateCatalogItem = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const { id } = req.params
  const schema = z.object({
    sellingPrice: z.number().positive().optional(),
    visible: z.boolean().optional(),
  })
  const data = schema.parse(req.body)
  const item = await updateCatalogItemService(resellerId, id, data)
  ok(res, item)
})

export const removeCatalogItem = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const { id } = req.params
  await removeFromCatalog(resellerId, id)
  ok(res, { message: 'Producto eliminado del catálogo' })
})

// ── Pedidos del revendedor ───────────────────────────────────────────────────

export const getMyOrders = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const schema = z.object({
    page:   z.coerce.number().int().min(1).default(1),
    limit:  z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['PENDING', 'PROOF_RECEIVED', 'CONFIRMED', 'DISPATCHED', 'CANCELLED']).optional(),
    currentCycle: z.coerce.boolean().optional(),
    cycleId: z.string().uuid().optional(),
  })
  const { page, limit, status, currentCycle, cycleId } = schema.parse(req.query)

  let cycleFilter: { cycleId: string } | undefined
  if (cycleId) {
    cycleFilter = { cycleId }
  } else if (currentCycle) {
    const openCycle = await prisma.cycle.findFirst({ where: { status: 'OPEN' } })
    // Si no hay ciclo abierto, el filtro no debe matchear ningún pedido.
    cycleFilter = { cycleId: openCycle?.id ?? '00000000-0000-0000-0000-000000000000' }
  }

  const where = {
    resellerId,
    ...(status && { status }),
    ...cycleFilter,
  }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, cycle: { select: { number: true, status: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])
  ok(res, { orders, total, page, totalPages: Math.ceil(total / limit) })
})

/** El revendedor reserva uno o más productos de su catálogo para un comprador con el que negoció por WhatsApp */
export const createMyReservation = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const schema = z.object({
    items: z.array(z.object({
      catalogItemId: z.string().uuid(),
      variantId:     z.string().uuid(),
      quantity:      z.number().int().min(1).max(99),
    })).min(1),
    buyerName:     z.string().min(2).max(80),
    buyerWhatsapp: z.string().regex(/^\d{10,15}$/, 'Formato inválido de WhatsApp'),
    note:          z.string().max(300).optional(),
  })
  const data = schema.parse(req.body)
  const { order, config } = await createReservation(resellerId, data)
  created(res, {
    order,
    payment: { cbu: config.cbu, alias: config.alias },
  })
})

/** El revendedor cancela su propia reserva mientras esté pendiente de pago */
export const cancelMyOrder = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const { id } = req.params
  const order = await resellerCancelReservation(resellerId, id)
  ok(res, order)
})

// ── Comisiones del revendedor ────────────────────────────────────────────────

export const getMyCommissions = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const schema = z.object({
    page:   z.coerce.number().int().min(1).default(1),
    limit:  z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['PENDING', 'PAID']).optional(),
  })
  const { page, limit, status } = schema.parse(req.query)
  const where = {
    resellerId,
    ...(status && { status }),
  }
  const [commissions, total] = await Promise.all([
    prisma.commission.findMany({
      where,
      include: { order: { select: { orderNumber: true, buyerName: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.commission.count({ where }),
  ])

  // Totales resumen
  const [pendingAgg, paidAgg] = await Promise.all([
    prisma.commission.aggregate({ where: { resellerId, status: 'PENDING' }, _sum: { amount: true } }),
    prisma.commission.aggregate({ where: { resellerId, status: 'PAID' }, _sum: { amount: true } }),
  ])

  ok(res, {
    commissions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    summary: {
      pending: Number(pendingAgg._sum.amount ?? 0),
      paid: Number(paidAgg._sum.amount ?? 0),
    },
  })
})

// ── Resumen del inicio ───────────────────────────────────────────────────────

export const getDashboardSummary = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const summary = await getResellerDashboardSummary(resellerId)
  ok(res, summary)
})

// ── Nivel y ranking ──────────────────────────────────────────────────────────

const LEVEL_ORDER = ['INICIAL', 'BRONCE', 'PLATA', 'ORO'] as const

export const getMyLevel = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    select: { level: true, lifetimeRevenue: true },
  })
  if (!reseller) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Revendedor no encontrado' } }); return }

  const configs = await getLevelConfigs()
  const currentIdx = LEVEL_ORDER.indexOf(reseller.level)
  const currentCfg = configs.find(c => c.level === reseller.level)!
  const nextCfg = currentIdx < LEVEL_ORDER.length - 1 ? configs[currentIdx + 1] : null

  ok(res, {
    level: reseller.level,
    lifetimeRevenue: Number(reseller.lifetimeRevenue),
    commissionPct: Number(currentCfg.commissionPct),
    maxMarkupPct: Number(currentCfg.maxMarkupPct),
    nextLevel: nextCfg?.level ?? null,
    nextThreshold: nextCfg ? Number(nextCfg.thresholdAmount) : null,
  })
})

export const getMyRanking = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const ranking = await getMonthlyRanking(resellerId)
  ok(res, ranking)
})

// ── Cursos (videos de YouTube de capacitación, los carga el admin) ───────────

export const getMyCourses = asyncHandler(async (_req: Request, res: Response) => {
  const videos = await prisma.courseVideo.findMany({
    where: { isActive: true },
    select: { id: true, title: true, youtubeUrl: true, description: true },
    orderBy: { order: 'asc' },
  })
  ok(res, videos)
})

// ── Ciclos de compra ─────────────────────────────────────────────────────────

export const getMyCyclesHandler = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const cycles = await getMyCycles(resellerId)
  ok(res, cycles)
})

// ── Onboarding ───────────────────────────────────────────────────────────────

export const markOnboardingSeen = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const updated = await prisma.reseller.update({
    where: { id: resellerId },
    data: { onboardingSeenAt: new Date() },
    select: { id: true, onboardingSeenAt: true },
  })
  ok(res, updated)
})

// ── Perfil ───────────────────────────────────────────────────────────────────

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub

  const schema = z.object({
    storeName:  z.string().min(2).max(80).optional(),
    whatsapp:   z.string().regex(/^\d{10,15}$/, 'Formato inválido de WhatsApp').optional(),
    cbu:        z.string().regex(/^\d{22}$/, 'CBU debe tener 22 dígitos').optional(),
    alias:      z.string().min(6).max(30).optional(),
    dni:        z.string().min(6).max(15).optional(),
    address:    z.string().min(3).max(150).optional(),
    city:       z.string().min(2).max(80).optional(),
    postalCode: z.string().min(3).max(10).optional(),
    storeTheme: z.enum(['ELEGANTE', 'VARONIL', 'NARANJA', 'ROSA', 'MINIMAL']).optional(),
    storeBio:   z.string().max(200, 'Máximo 200 caracteres').optional(),
    deliveryMethod: z.enum(['PICKUP', 'SHIPPING']).optional(),
  })

  const parsed = schema.parse(req.body)
  // storeName, address/city y storeBio se muestran en la tienda pública y en el
  // panel admin — se limpia cualquier etiqueta HTML antes de guardar.
  const data = {
    ...parsed,
    ...(parsed.storeName !== undefined && { storeName: stripHtml(parsed.storeName) }),
    ...(parsed.address !== undefined && { address: stripHtml(parsed.address) }),
    ...(parsed.city !== undefined && { city: stripHtml(parsed.city) }),
    ...(parsed.storeBio !== undefined && { storeBio: stripHtml(parsed.storeBio) }),
  }

  // Manejar foto de perfil si se sube
  let storePhotoUrl: string | undefined
  if (req.file) {
    const current = await prisma.reseller.findUnique({
      where: { id: resellerId },
      select: { storePhoto: true },
    })
    // Subir nueva foto
    const [url] = await persistPhotos([req.file])
    storePhotoUrl = url
    // Eliminar foto anterior si existe
    if (current?.storePhoto) {
      await deletePhoto(current.storePhoto).catch(() => null)
    }
  }

  const updated = await prisma.reseller.update({
    where: { id: resellerId },
    data: {
      ...data,
      ...(storePhotoUrl && { storePhoto: storePhotoUrl }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      dni: true,
      storeName: true,
      storeSlug: true,
      storePhoto: true,
      storeBio: true,
      whatsapp: true,
      cbu: true,
      alias: true,
      address: true,
      city: true,
      postalCode: true,
      deliveryMethod: true,
      referralCode: true,
      isActive: true,
      storeTheme: true,
    },
  })

  ok(res, updated)
})
