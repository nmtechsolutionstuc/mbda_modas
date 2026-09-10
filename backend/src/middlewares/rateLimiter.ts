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
 * Creación de reservas (la revendedora reserva stock para su clienta):
 * 30 por IP cada hora. Previene que una cuenta comprometida o un script
 * agote el stock creando reservas en cadena.
 */
export const reservationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
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
 * Tienda pública de una revendedora: 120 req/minuto por IP.
 * Frena scraping masivo del catálogo público.
 */
export const publicStoreLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
})
