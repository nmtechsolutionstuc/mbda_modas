import { Router } from 'express'
import authRoutes from './auth.routes'
import adminRoutes from './admin.routes'
import resellerRoutes from './reseller.routes'
// Fase 4: descomentar cuando esté implementado
// import publicRoutes from './public.routes'

const router = Router()

router.use('/auth',     authRoutes)
router.use('/admin',    adminRoutes)
router.use('/reseller', resellerRoutes)
// router.use('/public',   publicRoutes)

export default router
