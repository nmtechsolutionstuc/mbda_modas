import 'dotenv/config'

function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env var: ${key}`)
  return value
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback
}

export const env = {
  port: parseInt(optional('PORT', '3000'), 10),
  nodeEnv: optional('NODE_ENV', 'development'),
  databaseUrl: required('DATABASE_URL'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtAccessExpiresIn: optional('JWT_ACCESS_EXPIRES_IN', '7d'),
  jwtRefreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '60d'),
  frontendUrl: optional('FRONTEND_URL', 'http://localhost:5173'),
  storageProvider: optional('STORAGE_PROVIDER', 'local') as 'local' | 'cloudinary',
  cloudinaryCloudName: process.env['CLOUDINARY_CLOUD_NAME'],
  cloudinaryApiKey: process.env['CLOUDINARY_API_KEY'],
  cloudinaryApiSecret: process.env['CLOUDINARY_API_SECRET'],
  // Zipnova — cotización y etiquetas de envío
  zipnovaApiKey:    process.env['ZIPNOVA_API_KEY'],
  zipnovaApiSecret: process.env['ZIPNOVA_API_SECRET'],
  zipnovaAccountId: process.env['ZIPNOVA_ACCOUNT_ID']
    ? parseInt(process.env['ZIPNOVA_ACCOUNT_ID'], 10)
    : undefined,
} as const
