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
  deleteCategoryHandler,
} from '../controllers/admin.product.controller'
import {
  getConfig,
  updateConfig,
  getConfigAudit,
  getDashboardStats,
  updateLandingImage,
  removeLandingImage,
  getLevelConfigsHandler,
  updateLevelConfigsHandler,
  getBonusTiersHandler,
  updateBonusTiersHandler,
  listTestimonialsHandler, createTestimonialHandler, updateTestimonialHandler, deleteTestimonialHandler,
  listFaqItemsHandler, createFaqItemHandler, updateFaqItemHandler, deleteFaqItemHandler,
} from '../controllers/admin.config.controller'
import {
  getOrders, getOrderById, confirmOrderPayment, extendCashPickupAction,
  dispatchOrderAction, cancelOrderAction,
  markProofAction, rejectPaymentAction, cancelItemAction,
  listCommissions, markCommissionPaid,
  getPendingPickupsHandler, markPickedUpAction,
} from '../controllers/admin.order.controller'
import {
  listResellers, deactivateReseller, createReseller, updateReseller, deleteReseller,
  resetResellerPassword, getResellerAudit, approveReseller, rejectReseller,
} from '../controllers/admin.reseller.controller'
import {
  listSubAdmins, createSubAdmin, toggleSubAdmin, updateSubAdmin, deleteSubAdmin,
} from '../controllers/admin.subadmin.controller'
import {
  listCyclesHandler, getCycleHandler, createCycleHandler, updateCycleStatusHandler, updateCycleDatesHandler, getCycleShippingHandler,
} from '../controllers/admin.cycle.controller'
import {
  listCourseVideosHandler, createCourseVideoHandler, updateCourseVideoHandler, deleteCourseVideoHandler,
} from '../controllers/admin.course.controller'

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
router.delete('/categories/:id', adminOrSub, asyncHandler(deleteCategoryHandler))

// ── Configuración (solo ADMIN) ────────────────────────────────────────────────
router.get('/config',        adminOnly, asyncHandler(getConfig))
router.patch('/config',      adminOnly, asyncHandler(updateConfig))
router.get('/config/audit',  adminOnly, asyncHandler(getConfigAudit))
router.patch('/config/landing-image', adminOnly, upload.single('heroImage'), asyncHandler(updateLandingImage))
router.delete('/config/landing-image', adminOnly, asyncHandler(removeLandingImage))

// ── Testimonios de la Home (solo ADMIN) ───────────────────────────────────────
router.get('/testimonials',        adminOnly, asyncHandler(listTestimonialsHandler))
router.post('/testimonials',       adminOnly, asyncHandler(createTestimonialHandler))
router.patch('/testimonials/:id',  adminOnly, asyncHandler(updateTestimonialHandler))
router.delete('/testimonials/:id', adminOnly, asyncHandler(deleteTestimonialHandler))

// ── Preguntas frecuentes de la Home (solo ADMIN) ──────────────────────────────
router.get('/faq',        adminOnly, asyncHandler(listFaqItemsHandler))
router.post('/faq',       adminOnly, asyncHandler(createFaqItemHandler))
router.patch('/faq/:id',  adminOnly, asyncHandler(updateFaqItemHandler))
router.delete('/faq/:id', adminOnly, asyncHandler(deleteFaqItemHandler))

// ── Niveles de revendedora (solo ADMIN) ───────────────────────────────────────
router.get('/levels',   adminOnly, asyncHandler(getLevelConfigsHandler))
router.patch('/levels', adminOnly, asyncHandler(updateLevelConfigsHandler))

// ── Recompensa por volumen del ciclo (solo ADMIN) ─────────────────────────────
router.get('/bonus-tiers',   adminOnly, asyncHandler(getBonusTiersHandler))
router.patch('/bonus-tiers', adminOnly, asyncHandler(updateBonusTiersHandler))

// ── Pedidos (solo ADMIN) ──────────────────────────────────────────────────────
router.get('/orders',                           adminOnly, getOrders)
router.get('/orders/:id',                       adminOnly, getOrderById)
router.patch('/orders/:id/confirm',             adminOnly, confirmOrderPayment)
router.patch('/orders/:id/extend-cash',         adminOnly, extendCashPickupAction)
router.patch('/orders/:id/mark-proof',          adminOnly, markProofAction)
router.patch('/orders/:id/reject',              adminOnly, rejectPaymentAction)
router.patch('/orders/:id/dispatch',            adminOnly, dispatchOrderAction)
router.patch('/orders/:id/cancel',              adminOnly, cancelOrderAction)
router.patch('/orders/:id/items/:itemId/cancel', adminOnly, cancelItemAction)

// ── Retiros pendientes (ADMIN y SUBADMIN) ─────────────────────────────────────
router.get('/pickups',                 adminOrSub, getPendingPickupsHandler)
router.patch('/pickups/:id/picked-up', adminOrSub, markPickedUpAction)

// ── Comisiones (solo ADMIN) ───────────────────────────────────────────────────
router.get('/commissions',                 adminOnly, listCommissions)
router.patch('/commissions/:id/mark-paid', adminOnly, markCommissionPaid)

// ── Revendedores (solo ADMIN) ─────────────────────────────────────────────────
router.get('/resellers',              adminOnly, listResellers)
router.post('/resellers',             adminOnly, createReseller)
router.patch('/resellers/:id',        adminOnly, updateReseller)
router.patch('/resellers/:id/toggle', adminOnly, deactivateReseller)
router.patch('/resellers/:id/approve', adminOnly, approveReseller)
router.patch('/resellers/:id/reject', adminOnly, rejectReseller)
router.patch('/resellers/:id/reset-password', adminOnly, resetResellerPassword)
router.get('/resellers/:id/audit',    adminOnly, getResellerAudit)
router.delete('/resellers/:id',       adminOnly, deleteReseller)

// ── Subadmins (solo ADMIN) ────────────────────────────────────────────────────
router.get('/subadmins',               adminOnly, listSubAdmins)
router.post('/subadmins',              adminOnly, createSubAdmin)
router.patch('/subadmins/:id/toggle',  adminOnly, toggleSubAdmin)
router.patch('/subadmins/:id',         adminOnly, updateSubAdmin)
router.delete('/subadmins/:id',        adminOnly, deleteSubAdmin)

// ── Ciclos de compra (ADMIN y SUBADMIN) ───────────────────────────────────────
router.get('/cycles',              adminOrSub, listCyclesHandler)
router.get('/cycles/:id',          adminOrSub, getCycleHandler)
router.get('/cycles/:id/shipping', adminOrSub, getCycleShippingHandler)
router.post('/cycles',             adminOnly,  createCycleHandler)
router.patch('/cycles/:id',        adminOnly,  updateCycleDatesHandler)
router.patch('/cycles/:id/status', adminOnly,  updateCycleStatusHandler)

// ── Cursos para revendedoras (ADMIN y SUBADMIN) ───────────────────────────────
router.get('/courses',        adminOrSub, asyncHandler(listCourseVideosHandler))
router.post('/courses',       adminOrSub, asyncHandler(createCourseVideoHandler))
router.patch('/courses/:id',  adminOrSub, asyncHandler(updateCourseVideoHandler))
router.delete('/courses/:id', adminOrSub, asyncHandler(deleteCourseVideoHandler))

export default router
