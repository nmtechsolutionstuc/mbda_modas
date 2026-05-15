import { Response } from 'express'

interface Meta {
  page?: number
  limit?: number
  total?: number
}

export function ok<T>(res: Response, data: T, meta?: Meta): Response {
  return res.status(200).json({ success: true, data, ...(meta && { meta }) })
}

export function created<T>(res: Response, data: T): Response {
  return res.status(201).json({ success: true, data })
}

export function noContent(res: Response): Response {
  return res.status(204).send()
}

export function badRequest(res: Response, message: string, details?: unknown): Response {
  return res.status(400).json({
    success: false,
    error: { code: 'BAD_REQUEST', message, ...(details ? { details } : {}) },
  })
}

export function unauthorized(res: Response, message = 'No autenticado'): Response {
  return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message } })
}

export function forbidden(res: Response, message = 'Sin permiso'): Response {
  return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message } })
}

export function notFound(res: Response, message = 'Recurso no encontrado'): Response {
  return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message } })
}

export function conflict(res: Response, message: string): Response {
  return res.status(409).json({ success: false, error: { code: 'CONFLICT', message } })
}

export function serverError(res: Response, message = 'Error interno del servidor'): Response {
  return res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message } })
}
