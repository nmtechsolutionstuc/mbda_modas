import { prisma } from '../src/config/prisma'
import { createReservation, confirmOrder, dispatchOrder } from '../src/services/order.service'

async function main() {
  // ── Niveles variados para demo ──────────────────────────────────────────────
  const camila = await prisma.reseller.findFirst({ where: { storeName: { contains: 'Camila', mode: 'insensitive' } } })
  if (camila) {
    await prisma.reseller.update({ where: { id: camila.id }, data: { level: 'PLATA', lifetimeRevenue: 650000 } })
    console.log(`Nivel actualizado: ${camila.storeName} -> PLATA`)
  }

  const prueba = await prisma.reseller.findFirst({ where: { storeName: { contains: 'Prueba', mode: 'insensitive' } } })
  if (prueba) {
    await prisma.reseller.update({ where: { id: prueba.id }, data: { level: 'BRONCE', lifetimeRevenue: 250000 } })
    console.log(`Nivel actualizado: ${prueba.storeName} -> BRONCE`)
  }

  // ── Ciclo de ejemplo con reservas en distintos estados ──────────────────────
  const demo = await prisma.reseller.findUnique({ where: { email: 'revendedora.demo@mbdamodas.com' } })
  if (!demo) { console.log('No existe la revendedora demo, se omite el ciclo de ejemplo'); process.exit(0) }

  const catalogItem = await prisma.catalogItem.findFirst({
    where: { resellerId: demo.id },
    include: { product: { include: { variants: true } } },
  })
  if (!catalogItem) { console.log('La revendedora demo no tiene catálogo, se omite el ciclo de ejemplo'); process.exit(0) }

  const variantsWithStock = catalogItem.product.variants.filter(v => v.stock > 1)
  if (variantsWithStock.length === 0) { console.log('Sin stock suficiente para armar el ciclo de ejemplo'); process.exit(0) }
  const variant = variantsWithStock[0]!

  // 1) Reserva PENDING (recién creada, sin confirmar)
  await createReservation(demo.id, {
    items: [{ catalogItemId: catalogItem.id, variantId: variant.id, quantity: 1 }],
    buyerName: 'Compradora Pendiente',
    buyerWhatsapp: '5493810001111',
  })
  console.log('Reserva PENDING creada')

  // 2) Reserva CONFIRMED (admin ya confirmó el pago)
  const { order: order2 } = await createReservation(demo.id, {
    items: [{ catalogItemId: catalogItem.id, variantId: variant.id, quantity: 1 }],
    buyerName: 'Compradora Confirmada',
    buyerWhatsapp: '5493810002222',
  })
  await confirmOrder(order2.id, { paymentMethod: 'TRANSFER' })
  console.log('Reserva CONFIRMED creada')

  // 3) Reserva DISPATCHED (todo el circuito completo)
  const { order: order3 } = await createReservation(demo.id, {
    items: [{ catalogItemId: catalogItem.id, variantId: variant.id, quantity: 1 }],
    buyerName: 'Compradora Entregada',
    buyerWhatsapp: '5493810003333',
  })
  await confirmOrder(order3.id, { paymentMethod: 'TRANSFER' })
  await dispatchOrder(order3.id, 'DEMO-TRACK-001')
  console.log('Reserva DISPATCHED creada')

  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
