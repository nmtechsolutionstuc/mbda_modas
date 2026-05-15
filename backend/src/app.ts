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
  }),
)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      const allowed = [
        env.frontendUrl,
        /^https?:\/\/localhost(:\d+)?$/,
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
        /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
        /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
        /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
      ]
      const isAllowed = allowed.some(a =>
        typeof a === 'string' ? a === origin : a.test(origin),
      )
      callback(null, isAllowed)
    },
    credentials: true,
  }),
)

// ── Parsers ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '4mb' }))
app.use(express.urlencoded({ extended: true, limit: '4mb' }))
app.use(cookieParser())
app.use(compression())

// ── Logging ───────────────────────────────────────────────────────────────────
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'))
}

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
