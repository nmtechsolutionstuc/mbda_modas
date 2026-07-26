import { prisma } from '../config/prisma'

// ── Prendas propias en el feed "Prendas en Promo" (Modificación 6 + feed) ─────
// El usuario sube sus propias prendas (no de MBDA) para venta directa por
// WhatsApp. Requieren aprobación del admin salvo que autoApproveListings
// esté activo. No pueden ser revendidas por otros usuarios.

export interface CreateListingInput {
  resellerId: string
  name: string
  description?: string
  price: number
  photos: string[]
}

export async function createListing(input: CreateListingInput) {
  if (input.photos.length > 2) {
    throw Object.assign(new Error('Máximo 2 fotos por prenda'), { status: 400 })
  }

  const config = await prisma.config.findFirst()

  const activeCount = await prisma.userListing.count({
    where: { resellerId: input.resellerId, status: { in: ['PENDING', 'APPROVED'] }, sold: false },
  })
  const maxPerReseller = config?.feedMaxPerReseller ?? 3
  if (activeCount >= maxPerReseller) {
    throw Object.assign(
      new Error(`Ya tenés ${maxPerReseller} prendas publicadas. Vendé o eliminá alguna para publicar otra.`),
      { status: 400 },
    )
  }

  return prisma.userListing.create({
    data: {
      resellerId: input.resellerId,
      name: input.name,
      description: input.description,
      price: input.price,
      photos: input.photos,
      status: config?.autoApproveListings ? 'APPROVED' : 'PENDING',
    },
  })
}

export async function listMyListings(resellerId: string) {
  return prisma.userListing.findMany({
    where: { resellerId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function markListingSold(resellerId: string, id: string) {
  const listing = await prisma.userListing.findFirst({ where: { id, resellerId } })
  if (!listing) throw Object.assign(new Error('Prenda no encontrada'), { status: 404 })
  return prisma.userListing.update({ where: { id }, data: { sold: true } })
}

export async function deleteListing(resellerId: string, id: string) {
  const listing = await prisma.userListing.findFirst({ where: { id, resellerId } })
  if (!listing) throw Object.assign(new Error('Prenda no encontrada'), { status: 404 })
  await prisma.userListing.delete({ where: { id } })
}

// ── Moderación (admin) ─────────────────────────────────────────────────────────

export async function adminListListings(opts: { page: number; limit: number; status?: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
  const { page, limit, status } = opts
  const where = status ? { status } : {}
  const [listings, total] = await Promise.all([
    prisma.userListing.findMany({
      where,
      include: { reseller: { select: { id: true, storeName: true, whatsapp: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.userListing.count({ where }),
  ])
  return { listings, total, page, totalPages: Math.ceil(total / limit) }
}

export async function approveListing(id: string) {
  const listing = await prisma.userListing.findUnique({ where: { id } })
  if (!listing) throw Object.assign(new Error('Prenda no encontrada'), { status: 404 })
  return prisma.userListing.update({ where: { id }, data: { status: 'APPROVED' } })
}

export async function rejectListing(id: string) {
  const listing = await prisma.userListing.findUnique({ where: { id } })
  if (!listing) throw Object.assign(new Error('Prenda no encontrada'), { status: 404 })
  return prisma.userListing.update({ where: { id }, data: { status: 'REJECTED' } })
}
