import { Request, Response, NextFunction } from 'express'
import { forbidden } from '../utils/apiResponse'

/**
 * Middleware de autorización por rol.
 * Debe usarse después de `authenticate`.
 *
 * @example
 * router.get('/admin/products', authenticate, authorize('ADMIN'), handler)
 * router.get('/reseller/catalog', authenticate, authorize('RESELLER'), handler)
 */
export function authorize(...roles: ('ADMIN' | 'RESELLER')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as 'ADMIN' | 'RESELLER')) {
      forbidden(res)
      return
    }
    next()
  }
}
