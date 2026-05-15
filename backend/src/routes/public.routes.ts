import { Router } from 'express'
import {
  getPublicCatalog, getPublicProduct,
  createOrder, getPublicConfig, getLandingContent,
} from '../controllers/public.controller'

const router = Router()

router.get('/catalog/:refCode',              getPublicCatalog)
router.get('/catalog/:refCode/:productId',   getPublicProduct)
router.post('/orders',                       createOrder)
router.get('/config',                        getPublicConfig)
router.get('/landing',                       getLandingContent)

export default router
