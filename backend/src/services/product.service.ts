import { prisma } from '../config/prisma'
import { deletePhoto } from './upload.service'

export interface VariantInput {
  id?: string
  size: string
  color: string
  stock: number
}

export interface CreateProductInput {
  name: string
  description?: string
  basePrice: number
  commissionPct: number
  categoryId: string
  kind?: 'PHYSICAL' | 'SERVICE' | 'DIGITAL'
  youtubeVideoUrl?: string
  variants: VariantInput[]
  photos?: string[]
}

export interface UpdateProductInput {
  name?: string
  description?: string
  basePrice?: number
  commissionPct?: number
  categoryId?: string
  kind?: 'PHYSICAL' | 'SERVICE' | 'DIGITAL'
  isActive?: boolean
  availableForResellers?: boolean
  youtubeVideoUrl?: string | null
  variants?: VariantInput[]
  addPhotos?: string[]
  deletePhotos?: string[]
}

// ── CRUD de Productos ─────────────────────────────────────────────────────────

export async function listProducts(opts: {
  page: number
  limit: number
  categoryId?: string
  isActive?: boolean
  search?: string
}) {
  const { page, limit, categoryId, isActive, search } = opts

  const where = {
    ...(categoryId && { categoryId }),
    ...(isActive !== undefined && { isActive }),
    ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        variants: { select: { id: true, size: true, color: true, stock: true } },
        _count: { select: { catalogItems: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function createProduct(data: CreateProductInput) {
  return prisma.$transaction(async tx => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        commissionPct: data.commissionPct,
        categoryId:   data.categoryId,
        kind:         data.kind ?? 'PHYSICAL',
        photos:       data.photos ?? [],
        youtubeVideoUrl: data.youtubeVideoUrl,
      },
    })

    if (data.variants && data.variants.length > 0) {
      await tx.productVariant.createMany({
        data: data.variants.map(v => ({
          productId: product.id,
          size: v.size,
          color: v.color,
          stock: v.stock,
        })),
      })
    }

    return tx.product.findUnique({
      where: { id: product.id },
      include: {
        category: { select: { id: true, name: true } },
        variants: true,
      },
    })
  })
}

export async function updateProduct(id: string, data: UpdateProductInput) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return null

  // Calcular fotos finales
  let photos = [...product.photos]
  if (data.deletePhotos?.length) {
    await Promise.all(data.deletePhotos.map(url => deletePhoto(url)))
    photos = photos.filter(p => !data.deletePhotos!.includes(p))
  }
  if (data.addPhotos?.length) {
    photos = [...photos, ...data.addPhotos]
  }

  return prisma.$transaction(async tx => {
    // Actualizar campos del producto
    await tx.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
        ...(data.commissionPct !== undefined && { commissionPct: data.commissionPct }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.kind !== undefined && { kind: data.kind }),
        ...(data.isActive   !== undefined && { isActive: data.isActive }),
        ...(data.availableForResellers !== undefined && { availableForResellers: data.availableForResellers }),
        ...(data.youtubeVideoUrl !== undefined && { youtubeVideoUrl: data.youtubeVideoUrl }),
        photos,
      },
    })

    // Upsert inteligente de variantes
    if (data.variants) {
      const existing = await tx.productVariant.findMany({
        where: { productId: id },
        select: { id: true },
      })
      const existingIds = new Set(existing.map(v => v.id))
      const incomingIds = new Set(data.variants.filter(v => v.id).map(v => v.id!))

      // 1. Actualizar variantes que ya existen (tienen id)
      for (const v of data.variants) {
        if (v.id && existingIds.has(v.id)) {
          await tx.productVariant.update({
            where: { id: v.id },
            data: { size: v.size, color: v.color, stock: v.stock },
          })
        }
      }

      // 2. Crear variantes nuevas (sin id)
      const newVariants = data.variants.filter(v => !v.id)
      if (newVariants.length > 0) {
        await tx.productVariant.createMany({
          data: newVariants.map(v => ({
            productId: id, size: v.size, color: v.color, stock: v.stock,
          })),
        })
      }

      // 3. Variantes que se eliminaron del formulario
      const toRemove = [...existingIds].filter(vid => !incomingIds.has(vid))
      for (const vid of toRemove) {
        const hasOrders = await tx.orderItem.count({ where: { variantId: vid } })
        if (hasOrders > 0) {
          // Tiene pedidos → no se puede borrar, ponemos stock 0
          await tx.productVariant.update({ where: { id: vid }, data: { stock: 0 } })
        } else {
          await tx.productVariant.delete({ where: { id: vid } })
        }
      }
    }

    return tx.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        variants: true,
      },
    })
  })
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return null

  // Si alguna variante del producto ya tiene pedidos asociados, la base de
  // datos rechaza el delete en cascada (la FK de OrderItem → ProductVariant
  // no permite borrarlo) — se detecta antes para devolver un error claro en
  // vez de un 500 crudo, igual que con revendedores.
  const orderedVariants = await prisma.orderItem.count({ where: { variant: { productId: id } } })
  if (orderedVariants > 0) {
    throw Object.assign(
      new Error('No se puede eliminar: el producto tiene pedidos asociados. Desactivalo en su lugar.'),
      { status: 400 },
    )
  }

  // Eliminar fotos del storage
  await Promise.all(product.photos.map(url => deletePhoto(url)))

  // Eliminar producto (cascade elimina variantes + catalog items)
  return prisma.product.delete({ where: { id } })
}

export async function getProductWithCatalogs(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: true,
      catalogItems: {
        include: {
          reseller: { select: { id: true, firstName: true, lastName: true, storeName: true, referralCode: true } },
        },
      },
    },
  })
}

// ── CRUD de Categorías ────────────────────────────────────────────────────────

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } },
  })
}

export async function createCategory(data: { name: string; order?: number }) {
  return prisma.category.create({ data })
}

export async function updateCategory(id: string, data: { name?: string; isActive?: boolean; order?: number }) {
  return prisma.category.update({ where: { id }, data })
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  })
  if (!category) return null

  if (category._count.products > 0) {
    throw Object.assign(
      new Error('No se puede eliminar: tiene productos asociados. Desactivala o movelos a otra categoría primero.'),
      { status: 400 },
    )
  }

  return prisma.category.delete({ where: { id } })
}
