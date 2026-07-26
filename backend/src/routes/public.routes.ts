import { Router } from 'express'
import {
  getPublicCatalog, getPublicProduct,
  createOrder, getPublicConfig, getLandingContent, getPublicTerms,
  getShippingCost, getPublicFeed,
} from '../controllers/public.controller'

const router = Router()

router.get('/catalog/:refCode',              getPublicCatalog)
router.get('/catalog/:refCode/:productId',   getPublicProduct)
router.post('/orders',                       createOrder)
router.get('/config',                        getPublicConfig)
router.get('/landing',                       getLandingContent)
router.get('/terms',                         getPublicTerms)
router.get('/shipping/calculate',            getShippingCost)
router.get('/feed',                          getPublicFeed)

export default router
