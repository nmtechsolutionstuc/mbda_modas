/** Genera links wa.me con mensajes pre-armados. Sin WhatsApp Business API. */

function encode(text: string) {
  return encodeURIComponent(text)
}

function waLink(phone: string, message: string) {
  // Eliminar caracteres no numéricos del teléfono
  const clean = phone.replace(/\D/g, '')
  return `https://wa.me/${clean}?text=${encode(message)}`
}

// ── Links por evento ──────────────────────────────────────────────────────────

/** Revendedor notifica a MBDA que un comprador generó un pedido */
export function linkNuevoPedidoAMbda(
  mbdaPhone: string,
  opts: {
    orderNumber: string
    buyerName: string
    storeName: string
    total: number
    itemsSummary: string
  },
) {
  const msg = [
    `🛍️ *Nuevo pedido ${opts.orderNumber}*`,
    ``,
    `Tienda: ${opts.storeName}`,
    `Comprador: ${opts.buyerName}`,
    `Total: $${opts.total.toLocaleString('es-AR')}`,
    ``,
    `Productos:`,
    opts.itemsSummary,
    ``,
    `Pendiente de pago y confirmación.`,
  ].join('\n')
  return waLink(mbdaPhone, msg)
}

/** Admin confirma pago → notifica al revendedor con su comisión */
export function linkPagoConfirmado(
  resellerPhone: string,
  opts: {
    orderNumber: string
    storeName: string
    totalCommission: number
    cbu?: string | null
    alias?: string | null
  },
) {
  const datosCobro = opts.cbu
    ? `CBU: ${opts.cbu}${opts.alias ? `\nAlias: ${opts.alias}` : ''}`
    : 'No tenés CBU registrado. Actualizá tu perfil.'
  const msg = [
    `✅ *Pago confirmado — ${opts.orderNumber}*`,
    ``,
    `Hola ${opts.storeName}! El pago de tu venta fue verificado.`,
    ``,
    `💰 Tu ganancia: *$${opts.totalCommission.toLocaleString('es-AR')}*`,
    ``,
    `Datos de transferencia:`,
    datosCobro,
    ``,
    `Procesaremos el pago a la brevedad. ¡Gracias!`,
  ].join('\n')
  return waLink(resellerPhone, msg)
}

/** Admin despacha pedido → notifica a la revendedora (recibe ella el paquete de MBDA) */
export function linkPedidoDespachado(
  resellerPhone: string,
  opts: {
    orderNumber: string
    storeName: string
    trackingNumber: string
  },
) {
  const msg = [
    `📦 *Despachamos tu pedido!*`,
    ``,
    `Pedido: ${opts.orderNumber}`,
    `Tienda: ${opts.storeName}`,
    ``,
    `Número de seguimiento: *${opts.trackingNumber}*`,
    ``,
    `Ante cualquier consulta, respondé este mensaje.`,
  ].join('\n')
  return waLink(resellerPhone, msg)
}

/** Admin rechaza comprobante de pago → notifica al revendedor */
export function linkPagoRechazado(
  resellerPhone: string,
  opts: {
    orderNumber: string
    storeName: string
    reason: string
  },
) {
  const msg = [
    `❌ *Comprobante rechazado — ${opts.orderNumber}*`,
    ``,
    `Hola ${opts.storeName}. Revisamos el comprobante de pago pero no pudimos verificarlo.`,
    ``,
    `Motivo: ${opts.reason}`,
    ``,
    `El pedido fue cancelado y el stock liberado. Si hay algún error, comunicate con nosotros.`,
  ].join('\n')
  return waLink(resellerPhone, msg)
}

/** Admin cancela pedido → notifica al revendedor */
export function linkPedidoCancelado(
  resellerPhone: string,
  opts: {
    orderNumber: string
    storeName: string
    reason: string
  },
) {
  const msg = [
    `🚫 *Pedido cancelado — ${opts.orderNumber}*`,
    ``,
    `Hola ${opts.storeName}. El pedido fue cancelado.`,
    ``,
    `Motivo: ${opts.reason}`,
    ``,
    `Si el comprador ya había transferido, coordinen la devolución. Ante cualquier consulta respondé este mensaje.`,
  ].join('\n')
  return waLink(resellerPhone, msg)
}

/** Comprador → MBDA: "ya transferí" */
export function linkYaTransferi(
  mbdaPhone: string,
  opts: {
    orderNumber: string
    buyerName: string
    storeName: string
    total: number
  },
) {
  const msg = [
    `💸 *Ya realicé la transferencia*`,
    ``,
    `Pedido: ${opts.orderNumber}`,
    `Nombre: ${opts.buyerName}`,
    `Tienda: ${opts.storeName}`,
    `Monto: $${opts.total.toLocaleString('es-AR')}`,
    ``,
    `Por favor confirmá la recepción del pago. ¡Gracias!`,
  ].join('\n')
  return waLink(mbdaPhone, msg)
}
