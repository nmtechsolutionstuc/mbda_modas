import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface AccessTokenPayload {
  sub: string    // userId (Admin.id o Reseller.id)
  email: string
  role: 'ADMIN' | 'RESELLER'
}

export interface RefreshTokenPayload {
  sub: string    // Reseller.id
  jti: string    // RefreshToken.id en DB (para revocación)
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  })
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload
}
