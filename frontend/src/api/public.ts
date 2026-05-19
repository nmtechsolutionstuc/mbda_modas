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

// ── API calls ─────────────────────────────────────────────────────────────────

export function getPublicCatalog(refCode: string) {
  return axiosClient.get<PublicCatalog>(`/public/catalog/${refCode}`).then(r => r.data)
}

export function getPublicConfig() {
  return axiosClient.get<PublicConfig>('/public/config').then(r => r.data)
}

export function createPublicOrder(payload: CreateOrderPayload) {
  return axiosClient.post<CreatedOrder>('/public/orders', payload).then(r => r.data)
}

export function getPublicLanding() {
  return axiosClient.get<LandingContent>('/public/landing').then(r => r.data)
}
