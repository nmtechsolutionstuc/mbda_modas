import { Router } from 'express'
import {
  getPublicStore, getPublicConfig, getLandingContent, getPublicTerms,
  getPublicPrivacyPolicy, getPublicChangePolicy, getPublicWithdrawalRight,
  getFeaturedProducts, getPublicTestimonials, getPublicFaq,
} from '../controllers/public.controller'

const router = Router()

router.get('/products/featured',             getFeaturedProducts)
router.get('/testimonials',                  getPublicTestimonials)
router.get('/faq',                           getPublicFaq)
router.get('/tienda/:slug',                  getPublicStore)
router.get('/config',                        getPublicConfig)
router.get('/landing',                       getLandingContent)
router.get('/terms',                         getPublicTerms)
router.get('/privacy',                       getPublicPrivacyPolicy)
router.get('/change-policy',                 getPublicChangePolicy)
router.get('/withdrawal-right',              getPublicWithdrawalRight)

export default router
