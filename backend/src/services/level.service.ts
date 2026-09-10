import type { Prisma, ResellerLevel } from '@prisma/client'
import { prisma } from '../config/prisma'

// Orden de niveles: define qué nivel es "más alto" para no bajar nunca de nivel.
export const LEVEL_ORDER: ResellerLevel[] = ['INICIAL', 'BRONCE', 'PLATA', 'ORO']

export async function getLevelConfigs() {
  const configs = await prisma.levelConfig.findMany()
  // Ordenados según LEVEL_ORDER, no alfabéticamente
  return LEVEL_ORDER.map(level => configs.find(c => c.level === level)).filter(
    (c): c is NonNullable<typeof c> => !!c,
  )
}

export async function getLevelConfigMap(): Promise<Record<ResellerLevel, { thresholdAmount: number; commissionPct: number; maxMarkupPct: number }>> {
  const configs = await prisma.levelConfig.findMany()
  const map = {} as Record<ResellerLevel, { thresholdAmount: number; commissionPct: number; maxMarkupPct: number }>
  for (const c of configs) {
    map[c.level] = {
      thresholdAmount: Number(c.thresholdAmount),
      commissionPct: Number(c.commissionPct),
      maxMarkupPct: Number(c.maxMarkupPct),
    }
  }
  return map
}

/** Comisión y tope de aumento vigentes para el nivel actual de un revendedor puntual */
export async function getLevelConfigForReseller(resellerId: string) {
  const reseller = await prisma.reseller.findUnique({ where: { id: resellerId }, select: { level: true } })
  if (!reseller) throw Object.assign(new Error('Revendedor no encontrado'), { status: 404 })
  const map = await getLevelConfigMap()
  return { level: reseller.level, ...map[reseller.level] }
}

/**
 * Suma `addedAmount` a la facturación histórica del revendedor y recalcula su
 * nivel contra los umbrales configurados — el nivel nunca baja, solo puede subir.
 * Debe llamarse dentro de la misma transacción que confirma el pedido.
 */
export async function applyRevenueAndRecalculateLevel(
  tx: Prisma.TransactionClient,
  resellerId: string,
  addedAmount: number,
) {
  const reseller = await tx.reseller.update({
    where: { id: resellerId },
    data: { lifetimeRevenue: { increment: addedAmount } },
    select: { id: true, level: true, lifetimeRevenue: true },
  })

  const configs = await tx.levelConfig.findMany()
  const revenue = Number(reseller.lifetimeRevenue)

  // El nivel más alto (según LEVEL_ORDER) cuyo umbral ya se alcanzó
  let newLevel = reseller.level
  for (const level of LEVEL_ORDER) {
    const cfg = configs.find(c => c.level === level)
    if (cfg && revenue >= Number(cfg.thresholdAmount)) newLevel = level
  }

  // Nunca baja: solo actualiza si el nuevo nivel está más adelante en el orden
  if (LEVEL_ORDER.indexOf(newLevel) > LEVEL_ORDER.indexOf(reseller.level)) {
    await tx.reseller.update({ where: { id: resellerId }, data: { level: newLevel } })
    return { level: newLevel, lifetimeRevenue: revenue }
  }

  return { level: reseller.level, lifetimeRevenue: revenue }
}
