// ── Auth / User types ─────────────────────────────────────────────────────────

export type StoreTheme = 'ELEGANTE' | 'VARONIL' | 'NARANJA' | 'ROSA' | 'MINIMAL'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: 'ADMIN'
}

export interface SubAdminUser {
  id: string
  email: string
  name: string
  role: 'SUBADMIN'
}

export interface ResellerUser {
  id: string
  email: string
  firstName: string
  lastName: string
  dni: string | null
  storeName: string
  storeSlug: string
  storePhoto: string | null
  storeBio: string | null
  whatsapp: string
  cbu: string | null
  alias: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  deliveryMethod: 'PICKUP' | 'SHIPPING'
  referralCode: string
  isActive: boolean
  onboardingSeenAt: string | null
  storeTheme: StoreTheme
  role: 'RESELLER'
}

export type User = AdminUser | SubAdminUser | ResellerUser

// ── Type guards ───────────────────────────────────────────────────────────────

export function isAdmin(user: User): user is AdminUser {
  return user.role === 'ADMIN'
}

export function isSubAdmin(user: User): user is SubAdminUser {
  return user.role === 'SUBADMIN'
}

/** Verdadero tanto para ADMIN como para SUBADMIN */
export function isAdminLike(user: User): user is AdminUser | SubAdminUser {
  return user.role === 'ADMIN' || user.role === 'SUBADMIN'
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
