import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AccessTokenPayload {
  sub: string    // userId (Admin.id o Reseller.id)
  email: string
  role: 'ADMIN' | 'SUBADMIN' | 'RESELLER'
}

export interface RefreshTokenPayload {
  sub: string    // Reseller.id
  jti: string    // RefreshToken.id en DB (para revocación)
}

// Se fija el algoritmo explícitamente tanto al firmar como al verificar — sin
// esto, un atacante que consiga que el server acepte un token con "alg" distinto
// (o "none") podría falsificar tokens. jsonwebtoken no lo fuerza por defecto.
const ALGORITHM: jwt.Algorithm = 'HS256'

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    algorithm: ALGORITHM,
    expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    algorithm: ALGORITHM,
    expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret, { algorithms: [ALGORITHM] }) as AccessTokenPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret, { algorithms: [ALGORITHM] }) as RefreshTokenPayload
}
