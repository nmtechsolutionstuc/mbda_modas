import { prisma } from '../config/prisma'

export async function getBonusTiers() {
  return prisma.cycleBonusTier.findMany({ orderBy: { thresholdAmount: 'asc' } })
}

/** Reemplaza toda la lista de tramos — la cantidad de filas es libre, no un enum fijo */
export async function replaceBonusTiers(tiers: { thresholdAmount: number; bonusPct: number }[]) {
  const sorted = [...tiers].sort((a, b) => a.thresholdAmount - b.thresholdAmount)
  await prisma.$transaction([
    prisma.cycleBonusTier.deleteMany({}),
    ...sorted.map((t, i) => prisma.cycleBonusTier.create({
      data: { thresholdAmount: t.thresholdAmount, bonusPct: t.bonusPct, order: i },
    })),
  ])
  return getBonusTiers()
}

export interface BonusTier { thresholdAmount: number; bonusPct: number }

/** El tramo más alto cuyo umbral ya se alcanzó con `total` (0 si ninguno) */
export function getBonusPctForTotal(tiers: BonusTier[], total: number): number {
  let pct = 0
  for (const t of tiers) {
    if (total >= t.thresholdAmount) pct = t.bonusPct
  }
  return pct
}

/** El próximo tramo todavía no alcanzado, o null si ya está en el más alto (o no hay tramos) */
export function getNextBonusTier(tiers: BonusTier[], total: number): BonusTier | null {
  const sorted = [...tiers].sort((a, b) => a.thresholdAmount - b.thresholdAmount)
  return sorted.find(t => total < t.thresholdAmount) ?? null
}
