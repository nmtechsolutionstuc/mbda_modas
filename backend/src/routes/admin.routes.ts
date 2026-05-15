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
import {
  getOrders, getOrderById, confirmOrderPayment,
  dispatchOrderAction, cancelOrderAction,
  listCommissions, markCommissionPaid,
} from '../controllers/admin.order.controller'
import {
  listResellers, deactivateReseller,
} from '../controllers/admin.reseller.controller'

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

// ── Pedidos ───────────────────────────────────────────────────────────────────
router.get('/orders',                      getOrders)
router.get('/orders/:id',                  getOrderById)
router.patch('/orders/:id/confirm',        confirmOrderPayment)
router.patch('/orders/:id/dispatch',       dispatchOrderAction)
router.patch('/orders/:id/cancel',         cancelOrderAction)

// ── Comisiones ────────────────────────────────────────────────────────────────
router.get('/commissions',                 listCommissions)
router.patch('/commissions/:id/mark-paid', markCommissionPaid)

// ── Revendedores ──────────────────────────────────────────────────────────────
router.get('/resellers',                   listResellers)
router.patch('/resellers/:id/toggle',      deactivateReseller)

export default router
