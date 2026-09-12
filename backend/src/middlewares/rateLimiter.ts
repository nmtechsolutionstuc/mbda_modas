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

// El tráfico llega pasando por la Cloudflare Pages Function (proxy del
// frontend) y luego por el balanceador de Render antes de tocar esta app —
// sin esto, `req.ip` resuelve siempre a la IP de ese último salto (la misma
// para TODOS los visitantes), y el rate limit termina compartido entre
// cualquiera que use el sitio en vez de contar por usuario real. Cloudflare
// siempre agrega `CF-Connecting-IP` con la IP real del visitante, así que la
// usamos como key en vez de confiar en la cadena de X-Forwarded-For.
function keyGenerator(req: any): string {
  return (req.headers['cf-connecting-ip'] as string) || req.ip
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
  keyGenerator,
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
  keyGenerator,
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
  keyGenerator,
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
  keyGenerator,
  handler: rateLimitHandler,
})
