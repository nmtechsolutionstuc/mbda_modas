import rateLimit from 'express-rate-limit'

/** Respuesta estándar cuando se supera el límite */
function rateLimitHandler(_req: any, res: any) {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes. Esperá unos minutos e intentá de nuevo.',
    },
  })
}

/**
 * Auth: 8 intentos por IP cada 15 minutos.
 * Protege login contra ataques de fuerza bruta por IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
})

/**
 * Creación de pedidos públicos: 10 pedidos por IP cada hora.
 * Previene que un bot genere pedidos masivos y agote stock.
 */
export const publicOrderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
})

/**
 * API general admin/reseller: 200 req/minuto por IP.
 * Frena scrapers y DoS básico sin molestar al usuario normal.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
})

/**
 * Catálogo público: 120 req/minuto por IP.
 */
export const publicCatalogLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
})
