import { prisma } from '../config/prisma'
import { calcularComision } from '../utils/commission'

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

// ── Crear pedido público ──────────────────────────────────────────────────────

export interface CartItem {
  variantId: string
  quantity: number
}

export interface CreateOrderInput {
  refCode:           string
  buyerName:         string
  buyerWhatsapp:     string
  buyerEmail?:       string
  shippingMethod:    'CORREO_ARGENTINO' | 'ANDREANI' | 'LOCAL_PICKUP' | 'OTHER_CARRIER'
  shippingAddress?:  string
  shippingCity?:     string
  shippingProvince?: string
  shippingZip?:      string
  shippingCost?:     number
  shippingQuoteData?: string  // JSON snapshot del quote Zipnova seleccionado
  buyerNote?:        string   // Nota libre del comprador
  items:             CartItem[]
}

export async function createPublicOrder(input: CreateOrderInput) {
  // Lazy expire antes de reservar
  await lazyExpireOrders()

  const reseller = await prisma.reseller.findFirst({
    where: { referralCode: input.refCode, isActive: true },
  })
  if (!reseller) throw Object.assign(new Error('Revendedor no encontrado'), { status: 404 })

  const config = await prisma.config.findFirst()
  if (!config) throw Object.assign(new Error('Configuración no encontrada'), { status: 500 })

  // Generar orderNumber único
  let orderNumber = generateOrderNumber()
  let attempts = 0
  while (await prisma.order.findUnique({ where: { orderNumber } }) && attempts < 20) {
    orderNumber = generateOrderNumber()
    attempts++
  }

  const reservedUntil = new Date(Date.now() + config.stockReserveHours * 60 * 60 * 1000)

  return await prisma.$transaction(async tx => {
    let subtotal = 0
    const orderItemsData: {
      variantId: string
      productId: string
      productName: string
      size: string
      color: string
      quantity: number
      unitPrice: number
      basePrice: number
      commissionPct: number
      subtotal: number
    }[] = []

    for (const cartItem of input.items) {
      const variant = await tx.productVariant.findUnique({
        where: { id: cartItem.variantId },
        include: { product: true },
      })
      if (!variant) throw Object.assign(new Error(`Variante ${cartItem.variantId} no encontrada`), { status: 404 })
      if (variant.stock < cartItem.quantity) {
        throw Object.assign(
          new Error(`Stock insuficiente para ${variant.product.name} (${variant.size}/${variant.color})`),
          { status: 409 },
        )
      }

      // Obtener precio del catálogo del revendedor (checkout clásico, no distingue modo de venta)
      const catalogItem = await tx.catalogItem.findFirst({
        where: { resellerId: reseller.id, productId: variant.productId },
      })
      if (!catalogItem) {
        throw Object.assign(new Error(`${variant.product.name} no está en el catálogo de este revendedor`), { status: 404 })
      }

      const unitPrice = Number(catalogItem.sellingPrice)
      const lineSubtotal = unitPrice * cartItem.quantity
      subtotal += lineSubtotal

      // Reservar stock
      await tx.productVariant.update({
        where: { id: cartItem.variantId },
        data: { stock: { decrement: cartItem.quantity } },
      })

      orderItemsData.push({
        variantId: cartItem.variantId,
        productId: variant.productId,
        productName: variant.product.name,
        size: variant.size,
        color: variant.color,
        quantity: cartItem.quantity,
        unitPrice,
        basePrice: Number(variant.product.basePrice),
        commissionPct: Number(variant.product.commissionPct),
        subtotal: lineSubtotal,
      })
    }

    const shippingCost = input.shippingCost ?? 0
    const order = await tx.order.create({
      data: {
        orderNumber,
        resellerId:        reseller.id,
        buyerName:         input.buyerName,
        buyerWhatsapp:     input.buyerWhatsapp,
        buyerEmail:        input.buyerEmail,
        shippingMethod:    input.shippingMethod,
        shippingAddress:   input.shippingAddress,
        shippingCity:      input.shippingCity,
        shippingProvince:  input.shippingProvince,
        shippingZip:       input.shippingZip,
        shippingCost:      shippingCost > 0 ? shippingCost : null,
        shippingQuoteData: input.shippingQuoteData ?? null,
        buyerNote:         input.buyerNote ?? null,
        subtotal,
        total: subtotal + shippingCost,
        status:        'PENDING',
        reservedUntil,
        items: { create: orderItemsData },
      },
      include: {
        items: true,
        reseller: { select: { storeName: true, whatsapp: true } },
      },
    })

    return { order, config }
  })
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

export async function confirmOrder(
  orderId: string,
  opts?: { paymentMethod?: 'TRANSFER' | 'CASH'; cashDueDate?: Date },
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, reseller: { select: SAFE_RESELLER_SELECT } },
  })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  if (order.status !== 'PENDING' && order.status !== 'PROOF_RECEIVED') {
    throw Object.assign(new Error('El pedido no se puede confirmar en su estado actual'), { status: 400 })
  }

  const config = await prisma.config.findFirst()
  const pickupDeadline = new Date(Date.now() + (config?.pickupExpiryHours ?? 48) * 60 * 60 * 1000)

  return await prisma.$transaction(async tx => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        pickupDeadline,
        ...(opts?.paymentMethod && { paymentMethod: opts.paymentMethod }),
        ...(opts?.cashDueDate && { cashDueDate: opts.cashDueDate }),
      },
    })

    // Crear comisiones por cada ítem
    const commissionsData = order.items
      .filter(i => !i.cancelled)
      .map(item => ({
        resellerId: order.resellerId,
        orderId: order.id,
        amount: calcularComision(Number(item.unitPrice), Number(item.basePrice), Number(item.commissionPct)),
      }))

    if (commissionsData.length > 0) {
      await tx.commission.createMany({ data: commissionsData })
    }

    return tx.order.findUnique({
      where: { id: orderId },
      include: { reseller: { select: SAFE_RESELLER_SELECT }, items: true, commissions: true },
    })
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

export interface CreateReservationInput {
  catalogItemId: string
  variantId:     string
  quantity:      number
  buyerName:     string
  buyerWhatsapp: string
}

/** El revendedor reserva un producto de su catálogo para un comprador con el que ya negoció por WhatsApp */
export async function createReservation(resellerId: string, input: CreateReservationInput) {
  await lazyExpireOrders()

  const catalogItem = await prisma.catalogItem.findFirst({
    where: { id: input.catalogItemId, resellerId },
    include: { product: true },
  })
  if (!catalogItem) throw Object.assign(new Error('Producto no encontrado en tu catálogo'), { status: 404 })

  const variant = await prisma.productVariant.findFirst({
    where: { id: input.variantId, productId: catalogItem.productId },
  })
  if (!variant) throw Object.assign(new Error('Variante no encontrada'), { status: 404 })
  if (variant.stock < input.quantity) {
    throw Object.assign(new Error(`Stock insuficiente (quedan ${variant.stock})`), { status: 409 })
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
  const unitPrice = Number(catalogItem.sellingPrice)
  const subtotal = unitPrice * input.quantity
  const pickupBy = catalogItem.saleMode === 'PRESENCIAL' ? 'BUYER' : 'RESELLER'

  return prisma.$transaction(async tx => {
    await tx.productVariant.update({
      where: { id: input.variantId },
      data: { stock: { decrement: input.quantity } },
    })

    const order = await tx.order.create({
      data: {
        orderNumber,
        resellerId,
        buyerName:     input.buyerName,
        buyerWhatsapp: input.buyerWhatsapp,
        shippingMethod: 'LOCAL_PICKUP',
        pickupBy,
        subtotal,
        total: subtotal,
        status: 'PENDING',
        reservedUntil,
        items: {
          create: [{
            variantId:     input.variantId,
            productId:     variant.productId,
            productName:   catalogItem.product.name,
            size:          variant.size,
            color:         variant.color,
            quantity:      input.quantity,
            unitPrice,
            basePrice:     Number(catalogItem.product.basePrice),
            commissionPct: Number(catalogItem.product.commissionPct),
            subtotal,
          }],
        },
      },
      include: { items: true },
    })

    return { order, config }
  })
}

/** El revendedor confirma que cobró y marca la reserva como vendida (genera la comisión) */
export async function resellerMarkSold(
  resellerId: string,
  orderId: string,
  opts: { paymentMethod: 'TRANSFER' | 'CASH'; cashDueDate?: Date },
) {
  const order = await prisma.order.findFirst({ where: { id: orderId, resellerId } })
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })

  if (opts.paymentMethod === 'CASH') {
    const config = await prisma.config.findFirst()
    const maxDate = new Date(Date.now() + (config?.maxCashDeliveryDays ?? 2) * 24 * 60 * 60 * 1000)
    if (!opts.cashDueDate || opts.cashDueDate > maxDate) {
      throw Object.assign(
        new Error(`La fecha de entrega no puede superar los ${config?.maxCashDeliveryDays ?? 2} días configurados por el admin`),
        { status: 400 },
      )
    }
  }

  return confirmOrder(orderId, opts)
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
