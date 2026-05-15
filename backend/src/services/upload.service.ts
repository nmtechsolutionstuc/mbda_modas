import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { v2 as cloudinary } from 'cloudinary'
import { env } from '../config/env'

// ── Crear directorio de uploads si no existe ──────────────────────────────────
const UPLOADS_DIR = 'public/uploads'
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

// ── Configurar Cloudinary (solo si aplica) ────────────────────────────────────
if (env.storageProvider === 'cloudinary') {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  })
}

// ── Multer — siempre guarda en disco para luego decidir destino ───────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB por foto
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se aceptan imágenes JPG, PNG o WebP'))
    }
  },
})

/**
 * Persiste los archivos recibidos por multer.
 * - Local: los deja en public/uploads/ y retorna la URL relativa.
 * - Cloudinary: los sube y elimina el temp local.
 */
export async function persistPhotos(files: Express.Multer.File[]): Promise<string[]> {
  if (!files || files.length === 0) return []

  if (env.storageProvider === 'cloudinary') {
    const urls = await Promise.all(
      files.map(async file => {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'mbda-revendedores/products',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        })
        fs.unlinkSync(file.path)
        return result.secure_url
      }),
    )
    return urls
  }

  // Local
  return files.map(f => `/uploads/${f.filename}`)
}

/**
 * Elimina una foto. Ignora errores silenciosamente.
 */
export async function deletePhoto(url: string): Promise<void> {
  try {
    if (env.storageProvider === 'cloudinary' && url.includes('cloudinary.com')) {
      // Extraer public_id
      const parts = url.split('/')
      const publicIdWithExt = parts.slice(-2).join('/')
      const publicId = publicIdWithExt.replace(/\.[^.]+$/, '')
      await cloudinary.uploader.destroy(publicId)
    } else if (url.startsWith('/uploads/')) {
      const localPath = `public${url}`
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath)
    }
  } catch {
    // Silenciar errores de borrado
  }
}
