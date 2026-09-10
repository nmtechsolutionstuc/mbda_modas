import { prisma } from '../config/prisma'
import { calcularComision } from '../utils/commission'
import { applyRevenueAndRecalculateLevel } from './level.service'
import { getOpenCycle } from './cycle.service'
import { getBonusPctForTotal } from './bonusTier.service'

const PAID_STATUSES = ['CONFIRMED', 'DISPATCHED'] as const

// Nunca incluir el reseller completo (expondría passwordHash) — solo los campos
// que consumen los controllers/frontend para mostrar datos de contacto/cobro.
const SAFE_RESELLER_SELECT = {
  id: true, firstName: true, lastName: true, storeName: true, whatsapp: true, cbu: true, alias: true,
} as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateOrderNumber(): string {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `ORD-${digits}`
}

/** Cancela pedidos PENDING con reservedUntil vencido y libera el stock */
export async function lazyExpireOrders() {
  const expired = await prisma.order.findMany({
    where: { status: 'PENDING', reservedUntil: { lt: new Date() } },
    include: { items: true },
  })

  for (const order of expired) {
    await prisma.$transaction(async tx => {
      // Liberar stock de cada ítem no cancelado
      for (const item of order.items.filter(i => !i.cancelled)) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      }
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', cancelReason: 'Pago no recibido en plazo' },
      })
    })
  }
}

// ── Admin: gestión de pedidos ────────────────────────────────────────────────

export async function listOrders(opts: {
  page: number
  limit: number
  status?: string
  resellerId?: string
}) {
  await lazyExpireOrders()
  const where = {
    ...(opts.status && { status: opts.status as any }),
    ...(opts.resellerId && { resellerId: opts.resellerId }),
  }
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        reseller: { select: { id: true, firstName: true, lastName: true, storeName: true, whatsapp: true, cbu: true, alias: true } },
        items: { include: { variant: { select: { id: true } } } },
        commissions: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
    }),
    prisma.order.count({ where }),
  ])
  return { orders, total, page: opts.page, totalPages: Math.ceil(total / opts.limit) }
}

export async function getOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      reseller: { select: { id: true, firstName: true, lastName: true, storeName: true, email: true, whatsapp: true, cbu: true, alias: true } },
      items: true,
      commissions: true,
    },
  })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  return order
}

/**
 * Confirma el pago de un pedido — lo hace únicamente el admin, y significa lo
 * mismo sea transferencia o efectivo: la plata ya está efectivamente en la
 * cuenta o en la mano de MBDA. Acá se genera la comisión del revendedor.
 *
 * El efectivo NO se confirma por adelantado con una fecha futura — eso sería
 * dar por pagado algo que todavía no pasó. Si la clienta va a pagar en
 * efectivo más adelante, se usa `extendForCashPickup` para estirarle el plazo
 * de la reserva; recién cuando el efectivo esté en mano se llama a esta
 * función, igual que con una transferencia.
 */
export async function confirmOrder(
  orderId: string,
  opts?: { paymentMethod?: 'TRANSFER' | 'CASH' },
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, reseller: { select: SAFE_RESELLER_SELECT } },
  })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  if (order.status !== 'PENDING' && order.status !== 'PROOF_RECEIVED') {
    throw Object.assign(new Error('El pedido no se puede confirmar en su estado actual'), { status: 400 })
  }

  const paymentMethod = opts?.paymentMethod ?? order.paymentMethod
  if (!paymentMethod) {
    throw Object.assign(new Error('Indicá cómo pagó: transferencia o efectivo'), { status: 400 })
  }

  const config = await prisma.config.findFirst()
  const pickupDeadline = new Date(Date.now() + (config?.pickupExpiryHours ?? 48) * 60 * 60 * 1000)

  const cycle = await getOpenCycle()

  return await prisma.$transaction(async tx => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        pickupDeadline,
        cycleId: cycle.id,
        paymentMethod,
      },
    })

    // Crear comisiones por cada ítem. La comisión "caso A" (venta al precio
    // oficial) sale del % que el admin cargó en el producto — los niveles de
    // revendedora (LevelConfig) están armados pero no se aplican todavía.
    const activeItems = order.items.filter(i => !i.cancelled)
    const commissionsData: { resellerId: string; orderId: string; amount: number; kind?: 'SALE' | 'BONUS' }[] =
      activeItems.map(item => ({
        resellerId: order.resellerId,
        orderId: order.id,
        amount: calcularComision(Number(item.unitPrice), Number(item.basePrice), Number(item.commissionPct)),
      }))

    // Recompensa por volumen del ciclo: se suma aparte de la comisión de venta,
    // sale del margen de MBDA (no del precio que la revendedora puso), y se
    // calcula sobre la facturación acumulada del ciclo incluyendo este pedido —
    // el pedido que cruza el umbral ya se beneficia del nuevo tramo.
    const priorCycleTotal = await tx.order.aggregate({
      where: {
        resellerId: order.resellerId,
        cycleId: cycle.id,
        status: { in: ['CONFIRMED', 'DISPATCHED'] },
        id: { not: order.id },
      },
      _sum: { total: true },
    })
    const cumulativeAfter = Number(priorCycleTotal._sum.total ?? 0) + Number(order.total)
    const tiers = await tx.cycleBonusTier.findMany({ orderBy: { thresholdAmount: 'asc' } })
    const bonusPct = getBonusPctForTotal(
      tiers.map(t => ({ thresholdAmount: Number(t.thresholdAmount), bonusPct: Number(t.bonusPct) })),
      cumulativeAfter,
    )
    if (bonusPct > 0) {
      const orderBaseTotal = activeItems.reduce((sum, i) => sum + Number(i.basePrice) * i.quantity, 0)
      const bonusAmount = parseFloat((orderBaseTotal * (bonusPct / 100)).toFixed(2))
      if (bonusAmount > 0) {
        commissionsData.push({ resellerId: order.resellerId, orderId: order.id, amount: bonusAmount, kind: 'BONUS' })
      }
    }

    if (commissionsData.length > 0) {
      await tx.commission.createMany({ data: commissionsData })
    }

    // Facturación acumulada histórica del revendedor — puede hacerle subir de nivel
    const activeTotal = order.items
      .filter(i => !i.cancelled)
      .reduce((sum, i) => sum + Number(i.subtotal), 0)
    await applyRevenueAndRecalculateLevel(tx, order.resellerId, activeTotal)

    return tx.order.findUnique({
      where: { id: orderId },
      include: { reseller: { select: SAFE_RESELLER_SELECT }, items: true, commissions: true },
    })
  })
}

/**
 * Le da más tiempo a un pedido pendiente para que la clienta pague en
 * efectivo — NO confirma el pago ni genera comisión, solo estira
 * `reservedUntil` (que es lo que ya usa `lazyExpireOrders` para cancelar y
 * liberar el stock solo). Si nadie confirma el pago antes de esa fecha, el
 * pedido se cancela igual que hoy se cancela una transferencia que nunca
 * llegó — la extensión es sobre el plazo, no sobre el resultado.
 */
export async function extendForCashPickup(orderId: string, cashDueDate: Date) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  if (order.status !== 'PENDING' && order.status !== 'PROOF_RECEIVED') {
    throw Object.assign(new Error('Solo se puede extender un pedido pendiente'), { status: 400 })
  }
  if (cashDueDate.getTime() <= Date.now()) {
    throw Object.assign(new Error('La fecha debe ser futura'), { status: 400 })
  }

  const config = await prisma.config.findFirst()
  const maxDate = new Date(Date.now() + (config?.maxCashDeliveryDays ?? 2) * 24 * 60 * 60 * 1000)
  if (cashDueDate > maxDate) {
    throw Object.assign(
      new Error(`La fecha no puede superar los ${config?.maxCashDeliveryDays ?? 2} días configurados`),
      { status: 400 },
    )
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { paymentMethod: 'CASH', cashDueDate, reservedUntil: cashDueDate },
    include: { reseller: { select: SAFE_RESELLER_SELECT }, items: true },
  })
}

export async function dispatchOrder(orderId: string, trackingNumber: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  if (order.status !== 'CONFIRMED') {
    throw Object.assign(new Error('Solo se pueden despachar pedidos confirmados'), { status: 400 })
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: 'DISPATCHED', trackingNumber },
    include: { reseller: { select: SAFE_RESELLER_SELECT }, items: true },
  })
}

/** Marca el pedido como PROOF_RECEIVED (el comprador envió comprobante) */
export async function markProofReceived(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  if (order.status !== 'PENDING') {
    throw Object.assign(new Error('Solo se puede marcar comprobante en pedidos pendientes'), { status: 400 })
  }
  return prisma.order.update({
    where: { id: orderId },
    data: { status: 'PROOF_RECEIVED' },
    include: { reseller: { select: SAFE_RESELLER_SELECT }, items: true },
  })
}

/** Rechaza el comprobante de pago → cancela el pedido y devuelve stock */
export async function rejectPayment(orderId: string, cancelReason: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  if (order.status !== 'PENDING' && order.status !== 'PROOF_RECEIVED') {
    throw Object.assign(new Error('Solo se puede rechazar en pedidos pendientes o con comprobante'), { status: 400 })
  }

  return await prisma.$transaction(async tx => {
    for (const item of order.items.filter(i => !i.cancelled)) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    }
    return tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED', cancelReason },
      include: { reseller: { select: SAFE_RESELLER_SELECT }, items: true },
    })
  })
}

/** Cancela un ítem individual y recalcula el total del pedido */
export async function cancelOrderItem(orderId: string, itemId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  if (order.status === 'DISPATCHED' || order.status === 'CANCELLED') {
    throw Object.assign(new Error('No se puede modificar este pedido'), { status: 400 })
  }

  const item = order.items.find(i => i.id === itemId)
  if (!item) throw Object.assign(new Error('Ítem no encontrado'), { status: 404 })
  if (item.cancelled) throw Object.assign(new Error('El ítem ya estaba cancelado'), { status: 400 })

  const activeItems = order.items.filter(i => !i.cancelled && i.id !== itemId)
  if (activeItems.length === 0) {
    throw Object.assign(new Error('No se puede cancelar el último ítem activo. Cancelá el pedido completo.'), { status: 400 })
  }

  return await prisma.$transaction(async tx => {
    // Devolver stock si el pedido no estaba CONFIRMED
    if (order.status === 'PENDING' || order.status === 'PROOF_RECEIVED') {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    }

    await tx.orderItem.update({ where: { id: itemId }, data: { cancelled: true } })

    // Recalcular totales con los ítems activos
    const newSubtotal = activeItems.reduce((sum, i) => sum + Number(i.subtotal), 0)
    return tx.order.update({
      where: { id: orderId },
      data: { subtotal: newSubtotal, total: newSubtotal },
      include: { reseller: { select: SAFE_RESELLER_SELECT }, items: true, commissions: true },
    })
  })
}

export async function cancelOrder(orderId: string, cancelReason: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  if (order.status === 'DISPATCHED' || order.status === 'CANCELLED') {
    throw Object.assign(new Error('No se puede cancelar este pedido'), { status: 400 })
  }

  return await prisma.$transaction(async tx => {
    // Devolver stock: si ya estaba CONFIRMED, la prenda no fue retirada todavía (DISPATCHED ya está bloqueado arriba)
    for (const item of order.items.filter(i => !i.cancelled)) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      })
    }

    // Si ya se habían generado comisiones (pedido CONFIRMED), cancelarlas — las ya pagadas quedan intactas
    if (order.status === 'CONFIRMED') {
      await tx.commission.updateMany({
        where: { orderId, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      })
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED', cancelReason },
      include: { reseller: { select: SAFE_RESELLER_SELECT }, items: true },
    })
  })
}

// ── Reserva iniciada por el revendedor (WhatsApp + reservar + marcar vendido) ──

export interface ReservationItemInput {
  catalogItemId: string
  variantId:     string
  quantity:      number
}

export interface CreateReservationInput {
  items:         ReservationItemInput[]
  buyerName:     string
  buyerWhatsapp: string
  note?:         string
}

/** El revendedor reserva uno o más productos de su catálogo para un comprador con el que ya negoció por WhatsApp */
export async function createReservation(resellerId: string, input: CreateReservationInput) {
  await lazyExpireOrders()

  if (input.items.length === 0) {
    throw Object.assign(new Error('Agregá al menos un producto a la reserva'), { status: 400 })
  }

  const config = await prisma.config.findFirst()
  if (!config) throw Object.assign(new Error('Configuración no encontrada'), { status: 500 })

  let orderNumber = generateOrderNumber()
  let attempts = 0
  while (await prisma.order.findUnique({ where: { orderNumber } }) && attempts < 20) {
    orderNumber = generateOrderNumber()
    attempts++
  }

  const reservedUntil = new Date(Date.now() + config.stockReserveHours * 60 * 60 * 1000)

  return prisma.$transaction(async tx => {
    let subtotal = 0
    let anyOnline = false
    const orderItemsData: {
      variantId: string; productId: string; productName: string; size: string; color: string
      quantity: number; unitPrice: number; basePrice: number; commissionPct: number; subtotal: number
    }[] = []

    for (const reqItem of input.items) {
      const catalogItem = await tx.catalogItem.findFirst({
        where: { id: reqItem.catalogItemId, resellerId },
        include: { product: true },
      })
      if (!catalogItem) throw Object.assign(new Error('Producto no encontrado en tu catálogo'), { status: 404 })

      const variant = await tx.productVariant.findFirst({
        where: { id: reqItem.variantId, productId: catalogItem.productId },
      })
      if (!variant) throw Object.assign(new Error('Variante no encontrada'), { status: 404 })
      if (variant.stock < reqItem.quantity) {
        throw Object.assign(new Error(`Stock insuficiente para ${catalogItem.product.name} (quedan ${variant.stock})`), { status: 409 })
      }
      if (catalogItem.saleMode === 'ONLINE') anyOnline = true

      await tx.productVariant.update({
        where: { id: reqItem.variantId },
        data: { stock: { decrement: reqItem.quantity } },
      })

      const unitPrice = Number(catalogItem.sellingPrice)
      const lineSubtotal = unitPrice * reqItem.quantity
      subtotal += lineSubtotal

      orderItemsData.push({
        variantId:     reqItem.variantId,
        productId:     variant.productId,
        productName:   catalogItem.product.name,
        size:          variant.size,
        color:         variant.color,
        quantity:      reqItem.quantity,
        unitPrice,
        basePrice:     Number(catalogItem.product.basePrice),
        commissionPct: Number(catalogItem.product.commissionPct),
        subtotal:      lineSubtotal,
      })
    }

    // Si algún ítem es de venta online, retira la revendedora; si todos son presenciales, retira el comprador
    const pickupBy = anyOnline ? 'RESELLER' : 'BUYER'

    const order = await tx.order.create({
      data: {
        orderNumber,
        resellerId,
        buyerName:     input.buyerName,
        buyerWhatsapp: input.buyerWhatsapp,
        buyerNote:     input.note ?? null,
        pickupBy,
        subtotal,
        total: subtotal,
        status: 'PENDING',
        reservedUntil,
        items: { create: orderItemsData },
      },
      include: { items: true },
    })

    return { order, config }
  })
}

/** El revendedor cancela su propia reserva mientras esté pendiente de pago */
export async function resellerCancelReservation(resellerId: string, orderId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, resellerId } })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  if (order.status !== 'PENDING') {
    throw Object.assign(new Error('Solo podés cancelar reservas pendientes de pago'), { status: 400 })
  }
  return cancelOrder(orderId, 'Cancelado por el revendedor')
}

// ── Retiros en el local (Modificación 3 + 7) ──────────────────────────────────

/** Cancela pedidos CONFIRMED cuyo plazo de retiro venció y libera el stock */
export async function lazyExpirePickups() {
  const expired = await prisma.order.findMany({
    where: { status: 'CONFIRMED', pickupDeadline: { lt: new Date() } },
    include: { items: true },
  })

  for (const order of expired) {
    await prisma.$transaction(async tx => {
      for (const item of order.items.filter(i => !i.cancelled)) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      }
      await tx.commission.updateMany({
        where: { orderId: order.id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      })
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED', cancelReason: 'Vencido: no fue retirado dentro del plazo' },
      })
    })
  }
}

/** Pedidos confirmados a la espera de ser retirados en el local, ordenados por vencimiento */
export async function getPendingPickups() {
  await lazyExpirePickups()

  return prisma.order.findMany({
    where: { status: 'CONFIRMED' },
    include: {
      reseller: { select: { id: true, storeName: true, whatsapp: true } },
      items: true,
    },
    orderBy: { pickupDeadline: 'asc' },
  })
}

// ── Ranking mensual (por facturación del mes en curso) ────────────────────────

/**
 * Ranking del mes en curso por facturación de pedidos confirmados/despachados.
 * No expone el monto de otras revendedoras — solo posición, tienda y nivel.
 */
export async function getMonthlyRanking(resellerId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const grouped = await prisma.order.groupBy({
    by: ['resellerId'],
    where: { status: { in: ['CONFIRMED', 'DISPATCHED'] }, createdAt: { gte: startOfMonth } },
    _sum: { total: true },
  })

  const sorted = grouped
    .map(g => ({ resellerId: g.resellerId, total: Number(g._sum.total ?? 0) }))
    .sort((a, b) => b.total - a.total)

  const resellers = await prisma.reseller.findMany({
    where: { id: { in: sorted.map(s => s.resellerId) } },
    select: { id: true, storeName: true, level: true },
  })
  const resellerMap = new Map(resellers.map(r => [r.id, r]))

  const ranking = sorted.map((s, i) => ({
    position: i + 1,
    resellerId: s.resellerId,
    storeName: resellerMap.get(s.resellerId)?.storeName ?? '—',
    level: resellerMap.get(s.resellerId)?.level ?? 'INICIAL',
  }))

  const mine = ranking.find(r => r.resellerId === resellerId)

  return {
    top: ranking.slice(0, 20),
    myPosition: mine?.position ?? null,
    myTotal: sorted.find(s => s.resellerId === resellerId)?.total ?? 0,
    totalParticipants: ranking.length,
  }
}

/** Resumen para el "Inicio" del panel: ventas/pedidos del mes (con comparación al mes anterior), reservas activas y próximo cierre/despacho del ciclo abierto */
export async function getResellerDashboardSummary(resellerId: string) {
  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [thisMonthAgg, lastMonthAgg, pendingReservations, cycle] = await Promise.all([
    prisma.order.aggregate({
      where: { resellerId, status: { in: [...PAID_STATUSES] }, createdAt: { gte: startOfThisMonth } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { resellerId, status: { in: [...PAID_STATUSES] }, createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.count({ where: { resellerId, status: 'PENDING' } }),
    getOpenCycle(),
  ])

  return {
    salesThisMonth: Number(thisMonthAgg._sum.total ?? 0),
    salesLastMonth: Number(lastMonthAgg._sum.total ?? 0),
    ordersThisMonth: thisMonthAgg._count,
    ordersLastMonth: lastMonthAgg._count,
    pendingReservations,
    nextClose: cycle.closeAt,
    nextDispatch: cycle.dispatchAt,
    cycleStatus: cycle.status,
    cycleNumber: cycle.number,
  }
}

/** Marca el pedido como retirado en el local (reutiliza el estado DISPATCHED) */
export async function markPickedUp(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  if (order.status !== 'CONFIRMED') {
    throw Object.assign(new Error('Solo se pueden marcar como retirados los pedidos confirmados'), { status: 400 })
  }
  return prisma.order.update({
    where: { id: orderId },
    data: { status: 'DISPATCHED' },
    include: { reseller: { select: SAFE_RESELLER_SELECT }, items: true },
  })
}
