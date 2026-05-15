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
  weightGrams?: number
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
  weightGrams?: number | null
  isActive?: boolean
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
        categoryId: data.categoryId,
        kind: data.kind ?? 'PHYSICAL',
        weightGrams: data.weightGrams,
        photos: data.photos ?? [],
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
        ...(data.weightGrams !== undefined && { weightGrams: data.weightGrams }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        photos,
      },
    })

    // Reemplazar variantes si se envían
    if (data.variants) {
      await tx.productVariant.deleteMany({ where: { productId: id } })
      if (data.variants.length > 0) {
        await tx.productVariant.createMany({
          data: data.variants.map(v => ({
            productId: id,
            size: v.size,
            color: v.color,
            stock: v.stock,
          })),
        })
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
