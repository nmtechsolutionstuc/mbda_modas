// ── Auth / User types ─────────────────────────────────────────────────────────

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'ADMIN'
}

export interface ResellerUser {
  id: string
  email: string
  firstName: string
  lastName: string
  storeName: string
  storePhoto: string | null
  whatsapp: string
  cbu: string | null
  alias: string | null
  referralCode: string
  isActive: boolean
  role: 'RESELLER'
}

export type User = AdminUser | ResellerUser

// ── Type guards ───────────────────────────────────────────────────────────────

export function isAdmin(user: User): user is AdminUser {
  return user.role === 'ADMIN'
}

export function isReseller(user: User): user is ResellerUser {
  return user.role === 'RESELLER'
}

// ── API response wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true
  data: T
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: { path: string; message: string }[]
  }
}
