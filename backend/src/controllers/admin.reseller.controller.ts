import { Request, Response } from 'express'
import { z } from 'zod'
import { ok } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { prisma } from '../config/prisma'

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
