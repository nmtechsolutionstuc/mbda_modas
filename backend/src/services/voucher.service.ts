import { prisma } from '../config/prisma'

// ── Vales de cambio (Modificación 8) ──────────────────────────────────────────
// Personales e intransferibles, sin vencimiento. El admin los crea/edita/anula
// manualmente cuando, al hacer un cambio, no hay ninguna prenda disponible.

export interface CreateVoucherInput {
  buyerName: string
  buyerWhatsapp: string
  amount: number
  note?: string
  relatedOrderNumber?: string
  createdByAdminId: string
  createdByAdminName: string
}

export async function createVoucher(input: CreateVoucherInput) {
  return prisma.voucher.create({ data: input })
}

export async function listVouchers(opts: { page: number; limit: number; search?: string }) {
  const { page, limit, search } = opts
  const where = search
    ? {
        OR: [
          { buyerName: { contains: search, mode: 'insensitive' as const } },
          { buyerWhatsapp: { contains: search } },
        ],
      }
    : {}

  const [vouchers, total] = await Promise.all([
    prisma.voucher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.voucher.count({ where }),
  ])

  return { vouchers, total, page, totalPages: Math.ceil(total / limit) }
}

export async function updateVoucher(id: string, data: { amount?: number; note?: string }) {
  const voucher = await prisma.voucher.findUnique({ where: { id } })
  if (!voucher) throw Object.assign(new Error('Vale no encontrado'), { status: 404 })
  if (voucher.status !== 'ACTIVE') {
    throw Object.assign(new Error('Solo se pueden editar vales activos'), { status: 400 })
  }
  return prisma.voucher.update({ where: { id }, data })
}

export async function markVoucherUsed(id: string) {
  const voucher = await prisma.voucher.findUnique({ where: { id } })
  if (!voucher) throw Object.assign(new Error('Vale no encontrado'), { status: 404 })
  if (voucher.status !== 'ACTIVE') {
    throw Object.assign(new Error('El vale ya no está activo'), { status: 400 })
  }
  return prisma.voucher.update({ where: { id }, data: { status: 'USED', usedAt: new Date() } })
}

export async function cancelVoucher(id: string) {
  const voucher = await prisma.voucher.findUnique({ where: { id } })
  if (!voucher) throw Object.assign(new Error('Vale no encontrado'), { status: 404 })
  if (voucher.status !== 'ACTIVE') {
    throw Object.assign(new Error('El vale ya no está activo'), { status: 400 })
  }
  return prisma.voucher.update({ where: { id }, data: { status: 'CANCELLED', cancelledAt: new Date() } })
}
