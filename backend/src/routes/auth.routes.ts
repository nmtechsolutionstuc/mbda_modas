import { Router } from 'express'
import {
  adminLogin,
  resellerRegister,
  resellerLogin,
  refresh,
  logout,
  getMe,
} from '../controllers/auth.controller'
import { authenticate } from '../middlewares/authenticate'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

// Públicas
router.post('/admin/login',       asyncHandler(adminLogin))
router.post('/reseller/register', asyncHandler(resellerRegister))
router.post('/reseller/login',    asyncHandler(resellerLogin))
router.post('/refresh',           asyncHandler(refresh))

// Requieren token válido
router.post('/logout', authenticate, asyncHandler(logout))
router.get('/me',      authenticate, asyncHandler(getMe))

export default router
