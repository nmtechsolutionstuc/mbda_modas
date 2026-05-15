import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'
import { asyncHandler } from '../utils/asyncHandler'
import { upload } from '../services/upload.service'
import {
  listProductsHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  getProductCatalogsHandler,
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
} from '../controllers/admin.product.controller'
import {
  getConfig,
  updateConfig,
  getDashboardStats,
} from '../controllers/admin.config.controller'

const router = Router()

// Todos los endpoints de admin requieren autenticación + rol ADMIN
router.use(authenticate, authorize('ADMIN'))

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', asyncHandler(getDashboardStats))

// ── Productos ─────────────────────────────────────────────────────────────────
router.get('/products',                  asyncHandler(listProductsHandler))
router.post('/products',                 upload.array('photos', 10), asyncHandler(createProductHandler))
router.patch('/products/:id',            upload.array('photos', 10), asyncHandler(updateProductHandler))
router.delete('/products/:id',           asyncHandler(deleteProductHandler))
router.get('/products/:id/catalogs',     asyncHandler(getProductCatalogsHandler))

// ── Categorías ────────────────────────────────────────────────────────────────
router.get('/categories',                asyncHandler(listCategoriesHandler))
router.post('/categories',               asyncHandler(createCategoryHandler))
router.patch('/categories/:id',          asyncHandler(updateCategoryHandler))

// ── Configuración ─────────────────────────────────────────────────────────────
router.get('/config',                    asyncHandler(getConfig))
router.patch('/config',                  asyncHandler(updateConfig))

export default router
