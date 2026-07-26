import { Request, Response } from 'express'
import { z } from 'zod'
import { ok, created } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import { prisma } from '../config/prisma'
import {
  createVoucher, listVouchers, updateVoucher, markVoucherUsed, cancelVoucher,
} from '../services/voucher.service'

export const listVouchersHandler = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    page:   z.coerce.number().int().min(1).default(1),
    limit:  z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
  })
  const q = schema.parse(req.query)
  const result = await listVouchers(q)
  ok(res, result)
})

export const createVoucherHandler = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    buyerName:          z.string().min(2).max(80),
    buyerWhatsapp:      z.string().regex(/^\d{10,15}$/, 'Formato inválido de WhatsApp'),
    amount:             z.number().positive(),
    note:               z.string().max(300).optional(),
    relatedOrderNumber: z.string().max(30).optional(),
  })
  const data = schema.parse(req.body)

  const admin = await prisma.admin.findUnique({ where: { id: req.user!.sub } })
  if (!admin) { res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin no encontrado' } }); return }

  const voucher = await createVoucher({
    ...data,
    createdByAdminId: admin.id,
    createdByAdminName: admin.name,
  })
  created(res, voucher)
})

export const updateVoucherHandler = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    amount: z.number().positive().optional(),
    note:   z.string().max(300).optional(),
  })
  const data = schema.parse(req.body)
  const voucher = await updateVoucher(req.params.id, data)
  ok(res, voucher)
})

export const markVoucherUsedAction = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await markVoucherUsed(req.params.id)
  ok(res, voucher)
})

export const cancelVoucherAction = asyncHandler(async (req: Request, res: Response) => {
  const voucher = await cancelVoucher(req.params.id)
  ok(res, voucher)
})
