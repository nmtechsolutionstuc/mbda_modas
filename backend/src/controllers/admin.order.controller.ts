import { Request, Response } from 'express'
import { z } from 'zod'
import { ok } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import {
  listOrders, getOrder, confirmOrder, extendForCashPickup, dispatchOrder, cancelOrder,
  markProofReceived, rejectPayment, cancelOrderItem,
  getPendingPickups, markPickedUp,
} from '../services/order.service'
import {
  linkPagoConfirmado, linkPedidoDespachado,
  linkPagoRechazado, linkPedidoCancelado,
} from '../services/whatsapp.service'
import { prisma } from '../config/prisma'

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    page:       z.coerce.number().int().min(1).default(1),
    limit:      z.coerce.number().int().min(1).max(100).default(20),
    status:     z.enum(['PENDING', 'PROOF_RECEIVED', 'CONFIRMED', 'DISPATCHED', 'CANCELLED']).optional(),
    resellerId: z.string().uuid().optional(),
  })
  const q = schema.parse(req.query)
  const result = await listOrders(q)
  ok(res, result)
})

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await getOrder(req.params.id)
  ok(res, order)
})

export const confirmOrderPayment = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    paymentMethod: z.enum(['TRANSFER', 'CASH']).optional(),
  })
  const { paymentMethod } = schema.parse(req.body ?? {})
  const order = await confirmOrder(req.params.id, { paymentMethod })

  // Calcular total de comisiones para el link de WA
  const totalCommission = (order?.commissions ?? []).reduce((a, c) => a + Number(c.amount), 0)
  let waLink: string | null = null
  if (order?.reseller?.whatsapp) {
    waLink = linkPagoConfirmado(order.reseller.whatsapp, {
      orderNumber: order!.orderNumber,
      storeName: order!.reseller.storeName,
      totalCommission,
      cbu: order!.reseller.cbu,
      alias: order!.reseller.alias,
    })
  }

  ok(res, { order, waLink })
})

/**
 * Estira el plazo de una reserva pendiente para que la clienta pague en
 * efectivo más adelante — NO confirma el pago. Confirmar sigue siendo
 * `confirmOrderPayment`, sea cual sea el método, recién cuando la plata esté
 * efectivamente en la mano/cuenta de MBDA.
 */
export const extendCashPickupAction = asyncHandler(async (req: Request, res: Response) => {
  const { cashDueDate } = z.object({ cashDueDate: z.coerce.date() }).parse(req.body)
  const order = await extendForCashPickup(req.params.id, cashDueDate)
  ok(res, { order })
})

export const dispatchOrderAction = asyncHandler(async (req: Request, res: Response) => {
  const { trackingNumber } = z.object({ trackingNumber: z.string().min(3) }).parse(req.body)
  const order = await dispatchOrder(req.params.id, trackingNumber)

  // El paquete va a la revendedora (retira en Concepción o lo recibe en su domicilio
  // registrado) — ella decide la entrega final a su cliente, MBDA no le envía nada al comprador.
  let waLink: string | null = null
  if (order.reseller.whatsapp) {
    waLink = linkPedidoDespachado(order.reseller.whatsapp, {
      orderNumber: order.orderNumber,
      storeName: order.reseller.storeName,
      trackingNumber,
    })
  }

  ok(res, { order, waLink })
})

export const cancelOrderAction = asyncHandler(async (req: Request, res: Response) => {
  const { cancelReason } = z.object({ cancelReason: z.string().min(3).max(300) }).parse(req.body)
  const order = await cancelOrder(req.params.id, cancelReason)

  let waLink: string | null = null
  if (order.reseller?.whatsapp) {
    waLink = linkPedidoCancelado(order.reseller.whatsapp, {
      orderNumber: order.orderNumber,
      storeName: order.reseller.storeName,
      reason: cancelReason,
    })
  }

  ok(res, { order, waLink })
})

export const markProofAction = asyncHandler(async (req: Request, res: Response) => {
  const order = await markProofReceived(req.params.id)
  ok(res, order)
})

export const rejectPaymentAction = asyncHandler(async (req: Request, res: Response) => {
  const { cancelReason } = z.object({ cancelReason: z.string().min(3).max(300) }).parse(req.body)
  const order = await rejectPayment(req.params.id, cancelReason)

  let waLink: string | null = null
  if (order.reseller?.whatsapp) {
    waLink = linkPagoRechazado(order.reseller.whatsapp, {
      orderNumber: order.orderNumber,
      storeName: order.reseller.storeName,
      reason: cancelReason,
    })
  }

  ok(res, { order, waLink })
})

export const cancelItemAction = asyncHandler(async (req: Request, res: Response) => {
  const order = await cancelOrderItem(req.params.id, req.params.itemId)
  ok(res, order)
})

// ── Retiros en el local ───────────────────────────────────────────────────────

export const getPendingPickupsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const pickups = await getPendingPickups()
  ok(res, pickups)
})

export const markPickedUpAction = asyncHandler(async (req: Request, res: Response) => {
  const order = await markPickedUp(req.params.id)
  ok(res, order)
})

// ── Comisiones ────────────────────────────────────────────────────────────────

export const listCommissions = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    page:       z.coerce.number().int().min(1).default(1),
    limit:      z.coerce.number().int().min(1).max(100).default(20),
    status:     z.enum(['PENDING', 'PAID']).optional(),
    resellerId: z.string().uuid().optional(),
  })
  const q = schema.parse(req.query)
  const where = {
    ...(q.status && { status: q.status }),
    ...(q.resellerId && { resellerId: q.resellerId }),
  }
  const [commissions, total] = await Promise.all([
    prisma.commission.findMany({
      where,
      include: {
        reseller: { select: { id: true, firstName: true, lastName: true, storeName: true, cbu: true, alias: true } },
        order: { select: { orderNumber: true, total: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
    prisma.commission.count({ where }),
  ])
  ok(res, { commissions, total, page: q.page, totalPages: Math.ceil(total / q.limit) })
})

export const markCommissionPaid = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params
  const commission = await prisma.commission.findUnique({ where: { id } })
  if (!commission) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Comisión no encontrada' } })
    return
  }
  const updated = await prisma.commission.update({
    where: { id },
    data: { status: 'PAID', paidAt: new Date() },
  })
  ok(res, updated)
})
