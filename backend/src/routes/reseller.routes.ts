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

// Perfil
router.patch('/profile', upload.single('storePhoto'), updateProfile)

// Pedidos y comisiones
router.get('/orders',              getMyOrders)
router.post('/orders',             createMyReservation)
router.patch('/orders/:id/sold',   markMyOrderSold)
router.patch('/orders/:id/cancel', cancelMyOrder)
router.get('/commissions', getMyCommissions)

export default router
