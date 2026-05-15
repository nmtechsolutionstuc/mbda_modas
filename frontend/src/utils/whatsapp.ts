/** Genera un link wa.me con mensaje pre-armado para que el comprador avise que ya transfirió */
export function linkYaTransferi(
  phone: string,
  opts: { orderNumber: string; buyerName: string; total: number },
) {
  const msg =
    `💸 Ya realicé la transferencia\n` +
    `Pedido: ${opts.orderNumber}\n` +
    `Nombre: ${opts.buyerName}\n` +
    `Monto: $${opts.total.toLocaleString('es-AR')}\n` +
    `Por favor confirmá la recepción del pago.`
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
}

/** Genera un link wa.me genérico con un mensaje personalizado */
export function linkWhatsApp(phone: string, message: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}
