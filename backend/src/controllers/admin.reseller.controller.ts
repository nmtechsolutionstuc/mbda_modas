import { Request, Response } from 'express'
import { z } from 'zod'
import { ok, created } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { prisma } from '../config/prisma'
import { hashPassword, generateReferralCode } from '../services/auth.service'

export const listResellers = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    page:     z.coerce.number().int().min(1).default(1),
    limit:    z.coerce.number().int().min(1).max(100).default(20),
    isActive: z.coerce.boolean().optional(),
    search:   z.string().max(100).optional(),
  })
  const q = schema.parse(req.query)
  const where = {
    ...(q.isActive !== undefined && { isActive: q.isActive }),
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
        id: true, firstName: true, lastName: true, email: true,
        storeName: true, storePhoto: true, whatsapp: true,
        referralCode: true, isActive: true, createdAt: true,
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

// ── Alta manual de revendedor ─────────────────────────────────────────────────

export const createReseller = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    firstName: z.string().min(1).max(100),
    lastName:  z.string().min(1).max(100),
    email:     z.string().email(),
    password:  z.string().min(8),
    whatsapp:  z.string().regex(/^\d{10,15}$/, 'Formato inválido de WhatsApp'),
    storeName: z.string().min(1).max(100),
  })
  const data = schema.parse(req.body)

  const existing = await prisma.reseller.findUnique({ where: { email: data.email } })
  if (existing) {
    res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'El email ya está registrado' } })
    return
  }

  const passwordHash = await hashPassword(data.password)
  const referralCode = await generateReferralCode()

  const reseller = await prisma.reseller.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      passwordHash,
      whatsapp: data.whatsapp,
      storeName: data.storeName,
      referralCode,
      termsAcceptedAt: new Date(),
    },
    select: {
      id: true, firstName: true, lastName: true, email: true,
      storeName: true, whatsapp: true, referralCode: true, isActive: true, createdAt: true,
    },
  })
  created(res, reseller)
})

// ── Edición de revendedor ─────────────────────────────────────────────────────

export const updateReseller = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const schema = z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName:  z.string().min(1).max(100).optional(),
    email:     z.string().email().optional(),
    whatsapp:  z.string().regex(/^\d{10,15}$/, 'Formato inválido de WhatsApp').optional(),
    storeName: z.string().min(1).max(100).optional(),
  })
  const data = schema.parse(req.body)

  const reseller = await prisma.reseller.findUnique({ where: { id } })
  if (!reseller) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Revendedor no encontrado' } })
    return
  }

  if (data.email && data.email !== reseller.email) {
    const existing = await prisma.reseller.findUnique({ where: { email: data.email } })
    if (existing) {
      res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'El email ya está en uso por otra cuenta' } })
      return
    }
  }

  const updated = await prisma.reseller.update({
    where: { id },
    data,
    select: {
      id: true, firstName: true, lastName: true, email: true,
      storeName: true, whatsapp: true, referralCode: true, isActive: true, createdAt: true,
    },
  })
  ok(res, updated)
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
