import { prisma } from '../config/prisma'
import { calcularComision } from '../utils/commission'

// ── Catálogo del revendedor ───────────────────────────────────────────────────

/** Devuelve todos los ítems del catálogo del revendedor con info de producto y ganancia calculada */
export async function getResellerCatalog(resellerId: string) {
  const items = await prisma.catalogItem.findMany({
    where: { resellerId },
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true } },
          variants: { select: { id: true, size: true, color: true, stock: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return items.map(item => {
    const ganancia = calcularComision(
      Number(item.sellingPrice),
      Number(item.product.basePrice),
      Number(item.product.commissionPct),
    )
    return {
      id: item.id,
      sellingPrice: item.sellingPrice,
      ganancia,
      createdAt: item.createdAt,
      product: {
        id: item.product.id,
        name: item.product.name,
        description: item.product.description,
        basePrice: item.product.basePrice,
        commissionPct: item.product.commissionPct,
        photos: item.product.photos,
        isActive: item.product.isActive,
        category: item.product.category,
        variants: item.product.variants,
      },
    }
  })
}

/** Todos los productos activos de MBDA con flag inCatalog */
export async function getAvailableProducts(resellerId: string, opts: {
  page: number
  limit: number
  categoryId?: string
  search?: string
}) {
  const { page, limit, categoryId, search } = opts

  const where = {
    isActive: true,
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        variants: { select: { id: true, size: true, color: true, stock: true } },
        catalogItems: { where: { resellerId }, select: { id: true, sellingPrice: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return {
    products: products.map(p => {
      const catalogEntry = p.catalogItems[0] ?? null
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        commissionPct: p.commissionPct,
        photos: p.photos,
        category: p.category,
        variants: p.variants,
        inCatalog: !!catalogEntry,
        catalogItemId: catalogEntry?.id ?? null,
        sellingPrice: catalogEntry?.sellingPrice ?? null,
      }
    }),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

/** Agrega un producto al catálogo del revendedor */
export async function addProductToCatalog(resellerId: string, productId: string, sellingPrice: number) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
  })
  if (!product) throw Object.assign(new Error('Producto no encontrado o inactivo'), { status: 404 })

  if (sellingPrice < Number(product.basePrice)) {
    throw Object.assign(
      new Error('El precio de venta no puede ser menor al precio base'),
      { status: 400 },
    )
  }

  // Verificar si ya está en el catálogo
  const existing = await prisma.catalogItem.findUnique({
    where: { resellerId_productId: { resellerId, productId } },
  })
  if (existing) throw Object.assign(new Error('El producto ya está en tu catálogo'), { status: 409 })

  const item = await prisma.catalogItem.create({
    data: { resellerId, productId, sellingPrice },
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true } },
          variants: { select: { id: true, size: true, color: true, stock: true } },
        },
      },
    },
  })

  const ganancia = calcularComision(sellingPrice, Number(product.basePrice), Number(product.commissionPct))
  return { ...item, ganancia }
}

/** Actualiza el precio de venta de un ítem del catálogo */
export async function updateCatalogItemPrice(resellerId: string, itemId: string, sellingPrice: number) {
  const item = await prisma.catalogItem.findFirst({
    where: { id: itemId, resellerId },
    include: { product: true },
  })
  if (!item) throw Object.assign(new Error('Ítem no encontrado'), { status: 404 })

  if (sellingPrice < Number(item.product.basePrice)) {
    throw Object.assign(
      new Error('El precio de venta no puede ser menor al precio base'),
      { status: 400 },
    )
  }

  const updated = await prisma.catalogItem.update({
    where: { id: itemId },
    data: { sellingPrice },
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true } },
          variants: { select: { id: true, size: true, color: true, stock: true } },
        },
      },
    },
  })

  const ganancia = calcularComision(sellingPrice, Number(item.product.basePrice), Number(item.product.commissionPct))
  return { ...updated, ganancia }
}

/** Elimina un ítem del catálogo */
export async function removeFromCatalog(resellerId: string, itemId: string) {
  const item = await prisma.catalogItem.findFirst({
    where: { id: itemId, resellerId },
  })
  if (!item) throw Object.assign(new Error('Ítem no encontrado'), { status: 404 })

  await prisma.catalogItem.delete({ where: { id: itemId } })
}
