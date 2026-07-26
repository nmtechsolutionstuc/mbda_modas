import { Router } from 'express'
import { authenticate } from '../middlewares/authenticate'
import { authorize } from '../middlewares/authorize'
import { upload } from '../services/upload.service'
import {
  getMyCatalog,
  getMyProducts,
  getMyCategories,
  addToCatalog,
  updateCatalogItem,
  removeCatalogItem,
  updateProfile,
  getMyOrders,
  getMyCommissions,
  createMyReservation,
  markMyOrderSold,
  cancelMyOrder,
  getMyListings,
  createMyListing,
  markMyListingSold,
  removeMyListing,
  markOnboardingSeen,
} from '../controllers/reseller.controller'

const router = Router()

// Todos los endpoints del panel de revendedor requieren autenticación
router.use(authenticate, authorize('RESELLER'))

// Catálogo
router.get('/catalog',       getMyCatalog)
router.get('/categories',    getMyCategories)
router.get('/products',      getMyProducts)
router.post('/catalog',      addToCatalog)
router.patch('/catalog/:id', updateCatalogItem)
router.delete('/catalog/:id', removeCatalogItem)

// Onboarding
router.patch('/onboarding/seen', markOnboardingSeen)

// Perfil
router.patch('/profile', upload.single('storePhoto'), updateProfile)

// Pedidos y comisiones
router.get('/orders',              getMyOrders)
router.post('/orders',             createMyReservation)
router.patch('/orders/:id/sold',   markMyOrderSold)
router.patch('/orders/:id/cancel', cancelMyOrder)
router.get('/commissions', getMyCommissions)

// Mis prendas (feed "Prendas en Promo")
router.get('/listings',              getMyListings)
router.post('/listings',             upload.array('photos', 2), createMyListing)
router.patch('/listings/:id/sold',   markMyListingSold)
router.delete('/listings/:id',       removeMyListing)

export default router
