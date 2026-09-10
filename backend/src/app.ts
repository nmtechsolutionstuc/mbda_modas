import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { env } from './config/env'

const app = express()

// ── Seguridad ─────────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    // Las fotos de /uploads se embeben como <img> desde el frontend, que corre en
    // otro origen (puerto distinto en dev, subdominio propio en prod) — el default
    // "same-origin" de helmet las bloquea silenciosamente en el navegador aunque el
    // backend responda 200 OK.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

      // Los orígenes de red local/localhost solo se aceptan fuera de producción
      // (desarrollo en la LAN, dispositivos de prueba) — en producción únicamente
      // se confía en el dominio real del frontend.
      const devOnlyPatterns =
        env.nodeEnv === 'production'
          ? []
          : [
              /^https?:\/\/localhost(:\d+)?$/,
              /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
              /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
              /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
              /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
            ]
      const allowed = [env.frontendUrl, ...devOnlyPatterns]
      const isAllowed = allowed.some(a =>
        typeof a === 'string' ? a === origin : a.test(origin),
      )
      callback(null, isAllowed)
    },
    credentials: true,
  }),
)

// ── Rate limiters globales ────────────────────────────────────────────────────
import { authLimiter, generalApiLimiter, publicStoreLimiter, reservationLimiter } from './middlewares/rateLimiter'

app.use('/api/v1/auth', authLimiter)
app.use('/api/v1/reseller/orders', reservationLimiter)
app.use('/api/v1/public/tienda', publicStoreLimiter)
app.use('/api/v1', generalApiLimiter)

// ── Parsers ───────────────────────────────────────────────────────────────────
// JSON limitado a 512 KB para rutas normales (las de upload usan multipart/form-data)
app.use(express.json({ limit: '512kb' }))
app.use(express.urlencoded({ extended: true, limit: '512kb' }))
app.use(cookieParser())
app.use(compression())

// ── Logging ───────────────────────────────────────────────────────────────────
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'))
}

// ── Archivos estáticos (fotos locales) ────────────────────────────────────────
app.use('/uploads', express.static('public/uploads'))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Rutas API ─────────────────────────────────────────────────────────────────
import apiRoutes from './routes/index'
app.use('/api/v1', apiRoutes)

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } })
})

// ── Error handler global ──────────────────────────────────────────────────────
import { errorHandler } from './middlewares/errorHandler'
app.use(errorHandler)

export default app
