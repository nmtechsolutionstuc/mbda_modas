import { Request, Response } from 'express'
import { z } from 'zod'
import { ok } from '../utils/apiResponse'
import { asyncHandler } from '../utils/asyncHandler'
import {
  listOrders, getOrder, confirmOrder, dispatchOrder, cancelOrder,
  markProofReceived, rejectPayment, cancelOrderItem,
} from '../services/order.service'
import {
  linkPagoConfirmado, linkPedidoDespachado,
  linkPagoRechazado, linkPedidoCancelado,
} from '../services/whatsapp.service'
import { prisma } from '../config/prisma'
import {
  createZipnovaShipment, downloadZipnovaLabel, isZipnovaConfigured,
  type ShippingQuoteSnapshot,
} from '../services/shipping.service'

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    page:       z.coerce.number().int().min(1).default(1),
    limit:      z.coerce.number().int().min(1).max(100).default(20),
    status:     z.string().optional(),
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
  const order = await confirmOrder(req.params.id)

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

export const dispatchOrderAction = asyncHandler(async (req: Request, res: Response) => {
  const { trackingNumber } = z.object({ trackingNumber: z.string().min(3) }).parse(req.body)
  const order = await dispatchOrder(req.params.id, trackingNumber)

  let waLink: string | null = null
  if (order.buyerWhatsapp) {
    waLink = linkPedidoDespachado(order.buyerWhatsapp, {
      orderNumber: order.orderNumber,
      storeName: order.reseller.storeName,
      trackingNumber,
      shippingMethod: order.shippingMethod,
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

// ── Etiqueta de envío Zipnova ─────────────────────────────────────────────────

export const getShippingLabel = asyncHandler(async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  })
  if (!order) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Pedido no encontrado' } })
    return
  }
  if (order.shippingMethod === 'LOCAL_PICKUP') {
    res.status(400).json({ success: false, error: { code: 'NO_LABEL', message: 'Los pedidos con retiro local no tienen etiqueta de envío' } })
    return
  }
  if (!order.shippingQuoteData) {
    res.status(400).json({ success: false, error: { code: 'NO_QUOTE', message: 'Este pedido no tiene datos de cotización Zipnova. Solo los pedidos nuevos (post-integración) pueden generar etiquetas automáticamente.' } })
    return
  }

  // Verificar que Zipnova esté configurado (env vars)
  if (!isZipnovaConfigured()) {
    res.status(503).json({ success: false, error: { code: 'NO_CONFIG', message: 'Zipnova no está configurado. Definí ZIPNOVA_API_KEY, ZIPNOVA_API_SECRET y ZIPNOVA_ACCOUNT_ID en las variables de entorno.' } })
    return
  }

  // Crear envío en Zipnova si todavía no fue creado
  let shipmentId = (order as any).zipnovaShipmentId as number | null
  let trackingNumber = order.trackingNumber

  if (!shipmentId) {
    const quoteSnapshot = JSON.parse(order.shippingQuoteData) as ShippingQuoteSnapshot
    const weightGrams = order.items.reduce((sum, i) => sum + 500 * i.quantity, 0)

    const result = await createZipnovaShipment({
      orderNumber:      order.orderNumber,
      declaredValue:    Number(order.total),
      buyerName:        order.buyerName,
      buyerEmail:       order.buyerEmail ?? undefined,
      buyerPhone:       order.buyerWhatsapp,
      shippingAddress:  order.shippingAddress  ?? '',
      shippingCity:     order.shippingCity      ?? '',
      shippingProvince: order.shippingProvince  ?? '',
      shippingZip:      order.shippingZip       ?? '',
      weightGrams,
      quoteSnapshot,
    })

    shipmentId = result.shipmentId

    // Guardar en DB
    await prisma.order.update({
      where: { id: order.id },
      data: {
        zipnovaShipmentId: shipmentId,
        ...(result.trackingNumber ? { trackingNumber: result.trackingNumber } : {}),
      } as any,
    })

    if (result.trackingNumber) trackingNumber = result.trackingNumber
  }

  // Descargar PDF
  const pdfBuffer = await downloadZipnovaLabel(shipmentId)

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="etiqueta-${order.orderNumber}.pdf"`)
  if (trackingNumber) {
    res.setHeader('X-Tracking-Number', trackingNumber)
  }
  res.send(pdfBuffer)
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
