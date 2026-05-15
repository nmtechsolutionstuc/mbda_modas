import { Request, Response } from 'express'
import { z } from 'zod'
import { ok, created, notFound, conflict, badRequest } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { prisma } from '../config/prisma'
import {
  getResellerCatalog,
  getAvailableProducts,
  addProductToCatalog,
  updateCatalogItemPrice,
  removeFromCatalog,
} from '../services/catalog.service'
import { persistPhotos, deletePhoto } from '../services/upload.service'

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
  })
  const { productId, sellingPrice } = schema.parse(req.body)
  const item = await addProductToCatalog(resellerId, productId, sellingPrice)
  created(res, item)
})

export const updateCatalogItem = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub
  const { id } = req.params
  const schema = z.object({
    sellingPrice: z.number().positive(),
  })
  const { sellingPrice } = schema.parse(req.body)
  const item = await updateCatalogItemPrice(resellerId, id, sellingPrice)
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
    status: z.string().optional(),
  })
  const { page, limit, status } = schema.parse(req.query)
  const where = {
    resellerId,
    ...(status && { status: status as any }),
  }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ])
  ok(res, { orders, total, page, totalPages: Math.ceil(total / limit) })
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

// ── Perfil ───────────────────────────────────────────────────────────────────

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const resellerId = req.user!.sub

  const schema = z.object({
    storeName: z.string().min(2).max(80).optional(),
    whatsapp:  z.string().regex(/^\d{10,15}$/, 'Formato inválido de WhatsApp').optional(),
    cbu:       z.string().regex(/^\d{22}$/, 'CBU debe tener 22 dígitos').optional(),
    alias:     z.string().min(6).max(30).optional(),
  })

  const data = schema.parse(req.body)

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
      storeName: true,
      storePhoto: true,
      whatsapp: true,
      cbu: true,
      alias: true,
      referralCode: true,
      isActive: true,
    },
  })

  ok(res, updated)
})
