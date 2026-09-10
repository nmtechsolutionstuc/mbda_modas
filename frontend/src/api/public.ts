import axiosClient from './axiosClient'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PublicVariant {
  id: string
  size: string
  color: string
  stock: number
}

// ── Tienda pública de una revendedora (/tienda/:slug) ─────────────────────────

export type ResellerLevel = 'INICIAL' | 'BRONCE' | 'PLATA' | 'ORO'
export type StoreTheme = 'ELEGANTE' | 'VARONIL' | 'NARANJA' | 'ROSA' | 'MINIMAL'

export interface StoreProduct {
  catalogItemId: string
  productId: string
  name: string
  description: string | null
  photos: string[]
  youtubeVideoUrl: string | null
  sellingPrice: number
  category: { id: string; name: string }
  variants: PublicVariant[]
}

export interface StoreReseller {
  id: string
  storeName: string
  storePhoto: string | null
  storeBio: string | null
  referralCode: string
  storeSlug: string
  whatsapp: string
  city: string | null
  level: ResellerLevel
  storeTheme: StoreTheme
}

export interface PublicStore {
  reseller: StoreReseller
  products: StoreProduct[]
  categories: { id: string; name: string }[]
  payment: { cbu: string; alias: string }
  outfitBuilderEnabled: boolean
}

export function getPublicStore(slug: string): Promise<PublicStore> {
  return axiosClient
    .get<{ success: true; data: PublicStore }>(`/public/tienda/${slug}`)
    .then(r => r.data.data)
}

export interface PublicConfig {
  cbu: string
  alias: string
  whatsapp: string
  dispatchDays: number
  maxCashDeliveryDays: number
  helpUrl: string
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
  landingHeroImage: string | null
  landingHeroVideo: string | null
  landingAboutText: string
  landingManifesto: string
  landingFeaturesImage: string | null
  landingStep1Video: string | null
  landingStep2Video: string | null
  landingStep3Video: string | null
  landingBenefit1Title: string
  landingBenefit1Desc: string
  landingBenefit2Title: string
  landingBenefit2Desc: string
  landingBenefit3Title: string
  landingBenefit3Desc: string
  landingBenefit4Title: string
  landingBenefit4Desc: string
  landingShowBenefits: boolean
  landingShowProcess: boolean
  landingShowCollection: boolean
  landingShowResellerStory: boolean
  landingShowTestimonials: boolean
  landingShowFaq: boolean
}

// ── Tipo auxiliar para respuestas envueltas del backend ───────────────────────
type ApiResponse<T> = { success: true; data: T }

// ── API calls ─────────────────────────────────────────────────────────────────

export function getPublicConfig(): Promise<PublicConfig> {
  return axiosClient
    .get<ApiResponse<PublicConfig>>('/public/config')
    .then(r => r.data.data)
}

export function getPublicLanding(): Promise<LandingContent> {
  return axiosClient
    .get<ApiResponse<LandingContent>>('/public/landing')
    .then(r => r.data.data)
}

export interface FeaturedProduct {
  id: string
  name: string
  basePrice: number
  photos: string[]
  category: { name: string }
}

export function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  return axiosClient
    .get<ApiResponse<FeaturedProduct[]>>('/public/products/featured')
    .then(r => r.data.data)
}

export interface PublicTestimonial {
  id: string
  quote: string
  name: string
  city: string
}

export function getPublicTestimonials(): Promise<PublicTestimonial[]> {
  return axiosClient
    .get<ApiResponse<PublicTestimonial[]>>('/public/testimonials')
    .then(r => r.data.data)
}

export interface PublicFaqItem {
  id: string
  question: string
  answer: string
}

export function getPublicFaq(): Promise<PublicFaqItem[]> {
  return axiosClient
    .get<ApiResponse<PublicFaqItem[]>>('/public/faq')
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

export function getPublicPrivacyPolicy(): Promise<PublicTerms> {
  return axiosClient
    .get<ApiResponse<PublicTerms>>('/public/privacy')
    .then(r => r.data.data)
}

export function getPublicChangePolicy(): Promise<PublicTerms> {
  return axiosClient
    .get<ApiResponse<PublicTerms>>('/public/change-policy')
    .then(r => r.data.data)
}

export function getPublicWithdrawalRight(): Promise<PublicTerms> {
  return axiosClient
    .get<ApiResponse<PublicTerms>>('/public/withdrawal-right')
    .then(r => r.data.data)
}
