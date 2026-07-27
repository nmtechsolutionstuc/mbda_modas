import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

const STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos',
        details: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
      },
    })
    return
  }

  // Errores de negocio lanzados como Object.assign(new Error(msg), { status })
  const withStatus = err as { status?: unknown; message?: string }
  if (typeof withStatus.status === 'number' && withStatus.status >= 400 && withStatus.status < 500) {
    res.status(withStatus.status).json({
      success: false,
      error: {
        code: STATUS_CODES[withStatus.status] ?? 'BAD_REQUEST',
        message: withStatus.message ?? 'Error en la solicitud',
      },
    })
    return
  }

  console.error('[ErrorHandler]', err)
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' },
  })
}
