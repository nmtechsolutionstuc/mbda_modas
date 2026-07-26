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
  // Dimensiones para cálculo de envío (null = usar default del admin)
  weightGrams: number | null
  dimH: number | null
  dimW: number | null
  dimL: number | null
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
  maxCashDeliveryDays: number
  shippingEnabled: boolean
  // Defaults para envío cuando el producto no tiene medidas propias
  defaultWeightGrams: number | null
  defaultDimH: number | null
  defaultDimW: number | null
  defaultDimL: number | null
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

export interface ZipnovaQuote {
  /** Clave única por opción de envío: `${carrierId}_${serviceTypeCode}` */
  quoteKey:        string
  /** Valor usado para guardar en DB */
  shippingMethod:  'CORREO_ARGENTINO' | 'ANDREANI' | 'OTHER_CARRIER'
  carrierId:       number
  carrierName:     string
  /** Código Zipnova, ej: "standard_delivery", "pickup_point" */
  serviceType:     string
  /** Nombre legible, ej: "Entrega a domicilio", "Entrega en sucursal" */
  serviceTypeName: string
  logisticType:    string
  cost:            number
  estimatedDays:   { min: number; max: number } | null
}

export interface ShippingQuotesResponse {
  quotes:   ZipnovaQuote[]
  message?: string  // presente cuando la API falla (fallback)
}

export interface CreateOrderPayload {
  refCode:           string
  buyerName:         string
  buyerWhatsapp:     string
  buyerEmail?:       string
  shippingMethod:    'CORREO_ARGENTINO' | 'ANDREANI' | 'LOCAL_PICKUP' | 'OTHER_CARRIER'
  shippingAddress?:  string
  shippingCity?:     string
  shippingProvince?: string
  shippingZip?:      string
  shippingCost?:     number
  shippingQuoteData?: string  // JSON del quote seleccionado
  buyerNote?:        string   // Nota libre del comprador
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

export interface PublicTerms {
  content: string | null
  updatedAt: string | null
}

export function getPublicTerms(): Promise<PublicTerms> {
  return axiosClient
    .get<ApiResponse<PublicTerms>>('/public/terms')
    .then(r => r.data.data)
}

// ── Feed "Prendas en Promo" ────────────────────────────────────────────────────

export interface FeedItemMbda {
  type: 'MBDA'
  id: string
  productId: string
  name: string
  price: number
  photos: string[]
  inStock: boolean
}

export interface FeedItemExternal {
  type: 'EXTERNAL'
  id: string
  name: string
  price: number
  photos: string[]
  storeName: string
  whatsapp: string
}

export type FeedItem = FeedItemMbda | FeedItemExternal

export interface PublicFeed {
  enabled: boolean
  sectionName: string
  mbdaWhatsapp: string
  items: FeedItem[]
}

export function getPublicFeed(): Promise<PublicFeed> {
  return axiosClient
    .get<ApiResponse<PublicFeed>>('/public/feed')
    .then(r => r.data.data)
}
