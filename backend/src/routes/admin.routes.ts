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
  getConfigAudit,
  getDashboardStats,
} from '../controllers/admin.config.controller'
import {
  getOrders, getOrderById, confirmOrderPayment,
  dispatchOrderAction, cancelOrderAction,
  markProofAction, rejectPaymentAction, cancelItemAction,
  getShippingLabel,
  listCommissions, markCommissionPaid,
} from '../controllers/admin.order.controller'
import {
  listResellers, deactivateReseller,
} from '../controllers/admin.reseller.controller'
import {
  listSubAdmins, createSubAdmin, toggleSubAdmin,
} from '../controllers/admin.subadmin.controller'

const router = Router()

// Autenticación requerida en todos los endpoints admin
router.use(authenticate)

// Shorthands de autorización
const adminOnly      = authorize('ADMIN')
const adminOrSub     = authorize('ADMIN', 'SUBADMIN')

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', adminOnly, asyncHandler(getDashboardStats))

// ── Productos (ADMIN y SUBADMIN) ──────────────────────────────────────────────
router.get('/products',              adminOrSub, asyncHandler(listProductsHandler))
router.post('/products',             adminOrSub, upload.array('photos', 10), asyncHandler(createProductHandler))
router.patch('/products/:id',        adminOrSub, upload.array('photos', 10), asyncHandler(updateProductHandler))
router.delete('/products/:id',       adminOrSub, asyncHandler(deleteProductHandler))
router.get('/products/:id/catalogs', adminOrSub, asyncHandler(getProductCatalogsHandler))

// ── Categorías (ADMIN y SUBADMIN) ─────────────────────────────────────────────
router.get('/categories',        adminOrSub, asyncHandler(listCategoriesHandler))
router.post('/categories',       adminOrSub, asyncHandler(createCategoryHandler))
router.patch('/categories/:id',  adminOrSub, asyncHandler(updateCategoryHandler))

// ── Configuración (solo ADMIN) ────────────────────────────────────────────────
router.get('/config',        adminOnly, asyncHandler(getConfig))
router.patch('/config',      adminOnly, asyncHandler(updateConfig))
router.get('/config/audit',  adminOnly, asyncHandler(getConfigAudit))

// ── Pedidos (solo ADMIN) ──────────────────────────────────────────────────────
router.get('/orders',                           adminOnly, getOrders)
router.get('/orders/:id',                       adminOnly, getOrderById)
router.patch('/orders/:id/confirm',             adminOnly, confirmOrderPayment)
router.patch('/orders/:id/mark-proof',          adminOnly, markProofAction)
router.patch('/orders/:id/reject',              adminOnly, rejectPaymentAction)
router.patch('/orders/:id/dispatch',            adminOnly, dispatchOrderAction)
router.patch('/orders/:id/cancel',              adminOnly, cancelOrderAction)
router.patch('/orders/:id/items/:itemId/cancel', adminOnly, cancelItemAction)
router.get('/orders/:id/label',                  adminOnly, getShippingLabel)

// ── Comisiones (solo ADMIN) ───────────────────────────────────────────────────
router.get('/commissions',                 adminOnly, listCommissions)
router.patch('/commissions/:id/mark-paid', adminOnly, markCommissionPaid)

// ── Revendedores (solo ADMIN) ─────────────────────────────────────────────────
router.get('/resellers',              adminOnly, listResellers)
router.patch('/resellers/:id/toggle', adminOnly, deactivateReseller)

// ── Subadmins (solo ADMIN) ────────────────────────────────────────────────────
router.get('/subadmins',               adminOnly, listSubAdmins)
router.post('/subadmins',              adminOnly, createSubAdmin)
router.patch('/subadmins/:id/toggle',  adminOnly, toggleSubAdmin)

export default router
