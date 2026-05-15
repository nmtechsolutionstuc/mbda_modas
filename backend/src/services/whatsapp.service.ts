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

/** Admin despacha pedido → notifica al comprador con tracking */
export function linkPedidoDespachado(
  buyerPhone: string,
  opts: {
    orderNumber: string
    storeName: string
    trackingNumber: string
    shippingMethod: string
  },
) {
  const metodo = opts.shippingMethod === 'CORREO_ARGENTINO'
    ? 'Correo Argentino'
    : opts.shippingMethod === 'ANDREANI'
    ? 'Andreani'
    : 'Retiro local'
  const msg = [
    `📦 *Tu pedido fue despachado!*`,
    ``,
    `Pedido: ${opts.orderNumber}`,
    `Tienda: ${opts.storeName}`,
    ``,
    `Envío: ${metodo}`,
    `Número de seguimiento: *${opts.trackingNumber}*`,
    ``,
    `Podés rastrear tu envío con ese número en el sitio de ${metodo}.`,
    `Ante cualquier consulta, respondé este mensaje.`,
  ].join('\n')
  return waLink(buyerPhone, msg)
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
