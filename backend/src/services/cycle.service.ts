import { prisma } from '../config/prisma'
import { getBonusTiers, getBonusPctForTotal, getNextBonusTier } from './bonusTier.service'

// Bloque Unicode "Combining Diacritical Marks" (U+0300-U+036F): lo que queda
// de una tilde/acento tras normalize('NFD') separa la letra de su marca.
// Se arma con fromCharCode (no como literal de regex) para evitar caracteres
// invisibles en el código fuente.
const DIACRITICS_RANGE = new RegExp(`[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`, 'g')

/**
 * Si es de Concepción, siempre retira en el local (sin importar lo que haya
 * elegido antes) — fuera de Concepción, se respeta lo que ella eligió.
 *
 * La ciudad es un campo de texto libre en el registro, así que hay que tolerar
 * variantes reales ("Concepcion" sin tilde, "Concepción, Tucumán", espacios
 * de más) en vez de exigir una coincidencia exacta — si no, alguien de
 * Concepción que tipeó su ciudad distinto terminaría recibiendo envío gratis
 * que MBDA no le tendría que pagar.
 */
export function resolveDeliveryMethod(city: string | null, deliveryMethod: 'PICKUP' | 'SHIPPING'): 'PICKUP' | 'SHIPPING' {
  const normalized = (city ?? '')
    .normalize('NFD').replace(DIACRITICS_RANGE, '')
    .trim().toLowerCase()
  const firstPart = normalized.split(',')[0].trim()
  const isConcepcion = firstPart === 'concepcion' || firstPart.startsWith('concepcion ')
  return isConcepcion ? 'PICKUP' : deliveryMethod
}

const DEFAULT_CYCLE_DURATION_DAYS = 15
const DEFAULT_DISPATCH_DELAY_DAYS = 3

/**
 * Devuelve el ciclo abierto actual. Si no existe ninguno (primera vez, o el
 * admin todavía no creó uno), crea uno con valores por defecto razonables
 * para que la confirmación de pedidos nunca se bloquee por falta de ciclo.
 */
export async function getOpenCycle() {
  const open = await prisma.cycle.findFirst({ where: { status: 'OPEN' }, orderBy: { number: 'desc' } })
  if (open) return open

  const closeAt = new Date(Date.now() + DEFAULT_CYCLE_DURATION_DAYS * 24 * 60 * 60 * 1000)
  const dispatchAt = new Date(closeAt.getTime() + DEFAULT_DISPATCH_DELAY_DAYS * 24 * 60 * 60 * 1000)
  return prisma.cycle.create({ data: { closeAt, dispatchAt } })
}

/** Admin crea un ciclo nuevo — cierra automáticamente el que estuviera abierto */
export async function createCycle(closeAt: Date, dispatchAt: Date) {
  if (dispatchAt <= closeAt) {
    throw Object.assign(new Error('La fecha de despacho debe ser posterior al cierre'), { status: 400 })
  }
  await prisma.cycle.updateMany({ where: { status: 'OPEN' }, data: { status: 'CLOSED' } })
  return prisma.cycle.create({ data: { closeAt, dispatchAt } })
}

export async function listCycles() {
  const cycles = await prisma.cycle.findMany({
    orderBy: { number: 'desc' },
    include: { _count: { select: { orders: true } } },
  })
  const totals = await prisma.order.groupBy({
    by: ['cycleId'],
    where: { cycleId: { in: cycles.map(c => c.id) }, status: { in: ['CONFIRMED', 'DISPATCHED'] } },
    _sum: { total: true },
  })
  const totalMap = new Map(totals.map(t => [t.cycleId, Number(t._sum.total ?? 0)]))
  return cycles.map(c => ({ ...c, orderCount: c._count.orders, total: totalMap.get(c.id) ?? 0 }))
}

export async function getCycleDetail(cycleId: string) {
  const cycle = await prisma.cycle.findUnique({
    where: { id: cycleId },
    include: {
      orders: {
        include: {
          items: true,
          reseller: {
            select: { id: true, storeName: true, city: true, address: true, postalCode: true, deliveryMethod: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!cycle) throw Object.assign(new Error('Ciclo no encontrado'), { status: 404 })
  return cycle
}

/**
 * Agrupa los pedidos del ciclo por revendedora, con su dirección registrada —
 * así admin sabe a quién despachar el envío grupal del ciclo, y a quién le
 * entrega en mano cuando retira en Concepción.
 */
export async function getCycleShippingSummary(cycleId: string) {
  const cycle = await getCycleDetail(cycleId)

  const byReseller = new Map<string, {
    resellerId: string; storeName: string; city: string | null; address: string | null; postalCode: string | null
    deliveryMethod: 'PICKUP' | 'SHIPPING'; productCount: number; total: number
  }>()

  for (const order of cycle.orders) {
    if (order.status !== 'CONFIRMED' && order.status !== 'DISPATCHED') continue
    const key = order.reseller.id
    const existing = byReseller.get(key)
    const productCount = order.items.filter(i => !i.cancelled).length
    if (existing) {
      existing.productCount += productCount
      existing.total += Number(order.total)
    } else {
      byReseller.set(key, {
        resellerId: order.reseller.id,
        storeName: order.reseller.storeName,
        city: order.reseller.city,
        address: order.reseller.address,
        postalCode: order.reseller.postalCode,
        deliveryMethod: resolveDeliveryMethod(order.reseller.city, order.reseller.deliveryMethod),
        productCount,
        total: Number(order.total),
      })
    }
  }

  return [...byReseller.values()].sort((a, b) => a.storeName.localeCompare(b.storeName))
}

const NEXT_STATUS: Record<string, string[]> = {
  OPEN: ['CLOSED'],
  CLOSED: ['PREPARING'],
  PREPARING: ['DISPATCHED'],
  DISPATCHED: [],
}

export async function updateCycleStatus(cycleId: string, status: 'CLOSED' | 'PREPARING' | 'DISPATCHED') {
  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } })
  if (!cycle) throw Object.assign(new Error('Ciclo no encontrado'), { status: 404 })
  if (!NEXT_STATUS[cycle.status]?.includes(status)) {
    throw Object.assign(new Error(`No se puede pasar de ${cycle.status} a ${status}`), { status: 400 })
  }
  return prisma.cycle.update({ where: { id: cycleId }, data: { status } })
}

/**
 * Corrige las fechas de un ciclo mal cargado. Solo mientras está OPEN — una
 * vez que cierra, esas fechas quedan como registro histórico de cuándo
 * realmente se cerró/despachó y no deberían reescribirse.
 */
export async function updateCycleDates(cycleId: string, closeAt: Date, dispatchAt: Date) {
  if (dispatchAt <= closeAt) {
    throw Object.assign(new Error('La fecha de despacho debe ser posterior al cierre'), { status: 400 })
  }
  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } })
  if (!cycle) throw Object.assign(new Error('Ciclo no encontrado'), { status: 404 })
  if (cycle.status !== 'OPEN') {
    throw Object.assign(new Error('Solo se pueden editar las fechas de un ciclo abierto'), { status: 400 })
  }
  return prisma.cycle.update({ where: { id: cycleId }, data: { closeAt, dispatchAt } })
}

/**
 * Ciclos con al menos un pedido del revendedor (más el ciclo abierto actual,
 * aunque todavía no tenga ninguno, para que siempre pueda ver su progreso de
 * recompensa) — con el total/cantidad solo de sus propios productos, y el
 * tramo de recompensa por volumen alcanzado en ese ciclo.
 */
export async function getMyCycles(resellerId: string) {
  const [orders, openCycle, tiersRaw] = await Promise.all([
    prisma.order.findMany({
      where: { resellerId, cycleId: { not: null }, status: { in: ['CONFIRMED', 'DISPATCHED'] } },
      include: { items: true, cycle: true },
      orderBy: { createdAt: 'desc' },
    }),
    getOpenCycle(),
    getBonusTiers(),
  ])

  const tiers = tiersRaw.map(t => ({ thresholdAmount: Number(t.thresholdAmount), bonusPct: Number(t.bonusPct) }))

  const byCycle = new Map<string, { cycle: NonNullable<typeof orders[number]['cycle']>; orders: typeof orders }>()
  for (const order of orders) {
    if (!order.cycle) continue
    const entry = byCycle.get(order.cycle.id)
    if (entry) entry.orders.push(order)
    else byCycle.set(order.cycle.id, { cycle: order.cycle, orders: [order] })
  }
  // El ciclo abierto siempre aparece, aunque todavía no tenga pedidos confirmados.
  if (!byCycle.has(openCycle.id)) byCycle.set(openCycle.id, { cycle: openCycle, orders: [] })

  return [...byCycle.values()]
    .sort((a, b) => b.cycle.number - a.cycle.number)
    .map(({ cycle, orders: cycleOrders }) => {
      const productCount = cycleOrders.reduce((sum, o) => sum + o.items.filter(i => !i.cancelled).length, 0)
      const total = cycleOrders.reduce((sum, o) => sum + Number(o.total), 0)
      const nextTier = getNextBonusTier(tiers, total)
      return {
        cycle,
        productCount,
        total,
        bonusPct: getBonusPctForTotal(tiers, total),
        nextTier,
        remainingToNextTier: nextTier ? Math.max(0, nextTier.thresholdAmount - total) : null,
        orders: cycleOrders.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          buyerName: o.buyerName,
          status: o.status,
          total: o.total,
          items: o.items,
        })),
      }
    })
}
