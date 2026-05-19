import axiosClient from './axiosClient'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PublicVariant {
  id: string
  size: string
  color: string
  stock: number
}

export interface PublicProduct {
  catalogItemId: string
  productId: string
  name: string
  description: string | null
  photos: string[]
  sellingPrice: number
  category: { id: string; name: string }
  variants: PublicVariant[]
}

export interface PublicReseller {
  id: string
  storeName: string
  storePhoto: string | null
  referralCode: string
  whatsapp: string
}

export interface PublicCatalog {
  reseller: PublicReseller
  products: PublicProduct[]
  categories: { id: string; name: string }[]
}

export interface PublicConfig {
  cbu: string
  alias: string
  whatsapp: string
  dispatchDays: number
}

export interface LandingContent {
  landingHeroTitle: string
  landingHeroSubtitle: string
  landingHeroDesc: string
  landingCta1Text: string
  landingCta2Text: string
  landingHowTitle: string
  landingStep1Title: string
  landingStep1Desc: string
  landingStep2Title: string
  landingStep2Desc: string
  landingStep3Title: string
  landingStep3Desc: string
}

export interface CreateOrderPayload {
  refCode: string
  buyerName: string
  buyerWhatsapp: string
  buyerEmail?: string
  shippingMethod: 'CORREO_ARGENTINO' | 'ANDREANI' | 'LOCAL_PICKUP'
  shippingAddress?: string
  shippingCity?: string
  shippingProvince?: string
  shippingZip?: string
  items: { variantId: string; quantity: number }[]
}

export interface CreatedOrder {
  order: {
    id: string
    orderNumber: string
    buyerName: string
    total: number
    status: string
    reservedUntil: string
  }
  payment: {
    cbu: string
    alias: string
    whatsapp: string
    dispatchDays: number
  }
}

// ── Tipo auxiliar para respuestas envueltas del backend ───────────────────────
type ApiResponse<T> = { success: true; data: T }

// ── API calls ─────────────────────────────────────────────────────────────────

export function getPublicCatalog(refCode: string): Promise<PublicCatalog> {
  return axiosClient
    .get<ApiResponse<PublicCatalog>>(`/public/catalog/${refCode}`)
    .then(r => r.data.data)
}

export function getPublicConfig(): Promise<PublicConfig> {
  return axiosClient
    .get<ApiResponse<PublicConfig>>('/public/config')
    .then(r => r.data.data)
}

export function createPublicOrder(payload: CreateOrderPayload): Promise<CreatedOrder> {
  return axiosClient
    .post<ApiResponse<CreatedOrder>>('/public/orders', payload)
    .then(r => r.data.data)
}

export function getPublicLanding(): Promise<LandingContent> {
  return axiosClient
    .get<ApiResponse<LandingContent>>('/public/landing')
    .then(r => r.data.data)
}
