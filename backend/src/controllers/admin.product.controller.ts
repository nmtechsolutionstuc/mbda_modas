import { Request, Response } from 'express'
import { z } from 'zod'
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductWithCatalogs,
  listCategories,
  createCategory,
  updateCategory,
} from '../services/product.service'
import { persistPhotos } from '../services/upload.service'
import { ok, created, notFound, badRequest } from '../utils/apiResponse'

// ── Schemas ───────────────────────────────────────────────────────────────────

const VariantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.coerce.number().int().min(0),
})

const CreateProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.coerce.number().positive('El precio base debe ser mayor a 0'),
  commissionPct: z.coerce.number().min(1).max(100),
  categoryId: z.string().uuid('categoryId inválido'),
  kind: z.enum(['PHYSICAL', 'SERVICE', 'DIGITAL']).default('PHYSICAL'),
  weightGrams: z.coerce.number().int().positive().optional(),
  variants: z.preprocess(
    v => (typeof v === 'string' ? JSON.parse(v) : v),
    z.array(VariantSchema).min(1, 'Debe tener al menos una variante'),
  ),
})

const UpdateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  basePrice: z.coerce.number().positive().optional(),
  commissionPct: z.coerce.number().min(1).max(100).optional(),
  categoryId: z.string().uuid().optional(),
  kind: z.enum(['PHYSICAL', 'SERVICE', 'DIGITAL']).optional(),
  weightGrams: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.preprocess(v => v === 'true' || v === true, z.boolean()).optional(),
  variants: z.preprocess(
    v => (typeof v === 'string' ? JSON.parse(v) : v),
    z.array(VariantSchema).min(1).optional(),
  ),
  deletePhotos: z.preprocess(
    v => (typeof v === 'string' ? JSON.parse(v) : v),
    z.array(z.string()).optional(),
  ),
})

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(80),
  order: z.coerce.number().int().optional(),
})

const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  isActive: z.preprocess(v => v === 'true' || v === true, z.boolean()).optional(),
  order: z.coerce.number().int().optional(),
})

// ── Handlers de Productos ─────────────────────────────────────────────────────

export async function listProductsHandler(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page ?? 1)))
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? 20))))
  const categoryId = req.query.categoryId as string | undefined
  const search = req.query.search as string | undefined
  const isActiveRaw = req.query.isActive
  const isActive = isActiveRaw === 'true' ? true : isActiveRaw === 'false' ? false : undefined

  const result = await listProducts({ page, limit, categoryId, isActive, search })
  ok(res, result.items, { page: result.page, limit: result.limit, total: result.total })
}

export async function createProductHandler(req: Request, res: Response): Promise<void> {
  const data = CreateProductSchema.parse(req.body)
  const files = req.files as Express.Multer.File[] | undefined
  const photos = await persistPhotos(files ?? [])

  const product = await createProduct({ ...data, photos })
  created(res, product)
}

export async function updateProductHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const data = UpdateProductSchema.parse(req.body)
  const files = req.files as Express.Multer.File[] | undefined
  const addPhotos = await persistPhotos(files ?? [])

  const updated = await updateProduct(id, { ...data, addPhotos: addPhotos.length ? addPhotos : undefined })
  if (!updated) { notFound(res, 'Producto no encontrado'); return }
  ok(res, updated)
}

export async function deleteProductHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const deleted = await deleteProduct(id)
  if (!deleted) { notFound(res, 'Producto no encontrado'); return }
  ok(res, { id })
}

export async function getProductCatalogsHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const product = await getProductWithCatalogs(id)
  if (!product) { notFound(res, 'Producto no encontrado'); return }
  ok(res, product)
}

// ── Handlers de Categorías ────────────────────────────────────────────────────

export async function listCategoriesHandler(_req: Request, res: Response): Promise<void> {
  const categories = await listCategories()
  ok(res, categories)
}

export async function createCategoryHandler(req: Request, res: Response): Promise<void> {
  const data = CreateCategorySchema.parse(req.body)
  const category = await createCategory(data)
  created(res, category)
}

export async function updateCategoryHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const data = UpdateCategorySchema.parse(req.body)
  if (!data.name && data.isActive === undefined && data.order === undefined) {
    badRequest(res, 'No se enviaron campos para actualizar')
    return
  }
  const category = await updateCategory(id, data)
  ok(res, category)
}
