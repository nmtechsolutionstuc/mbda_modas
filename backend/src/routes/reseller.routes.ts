import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'
import { upload } from '../services/upload.service'
import {
  getMyCatalog,
  getMyCatalogItem,
  getMyProducts,
  getMyCategories,
  addToCatalog,
  updateCatalogItem,
  removeCatalogItem,
  updateProfile,
  getMyOrders,
  getMyCommissions,
  createMyReservation,
  cancelMyOrder,
  markOnboardingSeen,
  getMyLevel,
  getMyRanking,
  getMyCyclesHandler,
  getDashboardSummary,
  getMyCourses,
} from '../controllers/reseller.controller'

const router = Router()

// Todos los endpoints del panel de revendedor requieren autenticación
router.use(authenticate, authorize('RESELLER'))

// Catálogo
router.get('/catalog',       getMyCatalog)
router.get('/catalog/:id',   getMyCatalogItem)
router.get('/categories',    getMyCategories)
router.get('/products',      getMyProducts)
router.post('/catalog',      addToCatalog)
router.patch('/catalog/:id', updateCatalogItem)
router.delete('/catalog/:id', removeCatalogItem)

// Resumen del inicio
router.get('/dashboard', getDashboardSummary)

// Onboarding
router.patch('/onboarding/seen', markOnboardingSeen)

// Perfil
router.patch('/profile', upload.single('storePhoto'), updateProfile)

// Pedidos y comisiones
router.get('/orders',              getMyOrders)
router.post('/orders',             createMyReservation)
router.patch('/orders/:id/cancel', cancelMyOrder)
router.get('/commissions', getMyCommissions)

// Nivel y ranking
router.get('/level',   getMyLevel)
router.get('/ranking', getMyRanking)

// Ciclos de compra
router.get('/cycles', getMyCyclesHandler)

// Cursos
router.get('/courses', getMyCourses)

export default router
