import axiosClient from './axiosClient'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CatalogProductVariant {
  id: string
  size: string
  color: string
  stock: number
}

export interface CatalogProduct {
  id: string
  name: string
  description: string | null
  basePrice: string  // Decimal serializado como string
  commissionPct: string
  photos: string[]
  isActive: boolean
  category: { id: string; name: string }
  variants: CatalogProductVariant[]
}

export type SaleMode = 'PRESENCIAL' | 'ONLINE'

export interface CatalogItem {
  id: string
  sellingPrice: string
  saleMode: SaleMode
  visible: boolean
  ganancia: number
  createdAt: string
  product: CatalogProduct
}

export interface AvailableProduct extends CatalogProduct {
  presencialCatalogItemId: string | null
  onlineCatalogItemId: string | null
  onlineSellingPrice: string | null
}

export interface ReservationOrderItem {
  id: string
  productName: string
  size: string
  color: string
  quantity: number
  unitPrice: string
  subtotal: string
}

export interface ReservationOrder {
  id: string
  orderNumber: string
  buyerName: string
  buyerWhatsapp: string
  total: string
  status: string
  pickupBy: 'BUYER' | 'RESELLER'
  reservedUntil: string
  items: ReservationOrderItem[]
}

export interface ReservationResult {
  order: ReservationOrder
  payment: { cbu: string; alias: string }
}

export interface AvailableProductsResponse {
  products: AvailableProduct[]
  total: number
  page: number
  totalPages: number
}

export interface ResellerCategory {
  id: string
  name: string
}

export type StoreTheme = 'ELEGANTE' | 'VARONIL' | 'NARANJA' | 'ROSA' | 'MINIMAL'

export interface ResellerProfile {
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
  storeTheme: StoreTheme
}

// ── Tipo auxiliar para respuestas envueltas del backend ───────────────────────
type ApiResponse<T> = { success: true; data: T }

// ── Catálogo ─────────────────────────────────────────────────────────────────

export function getMyCatalog(): Promise<CatalogItem[]> {
  return axiosClient
    .get<ApiResponse<CatalogItem[]>>('/reseller/catalog')
    .then(r => r.data.data)
}

export function getMyCatalogItem(itemId: string): Promise<CatalogItem> {
  return axiosClient
    .get<ApiResponse<CatalogItem>>(`/reseller/catalog/${itemId}`)
    .then(r => r.data.data)
}

export function getResellerCategories(): Promise<ResellerCategory[]> {
  return axiosClient
    .get<ApiResponse<ResellerCategory[]>>('/reseller/categories')
    .then(r => r.data.data)
}

export function getAvailableProducts(params?: {
  page?: number
  limit?: number
  categoryId?: string
  search?: string
}): Promise<AvailableProductsResponse> {
  return axiosClient
    .get<ApiResponse<AvailableProductsResponse>>('/reseller/products', { params })
    .then(r => r.data.data)
}

export function addToCatalog(productId: string, sellingPrice: number, saleMode: SaleMode): Promise<CatalogItem> {
  return axiosClient
    .post<ApiResponse<CatalogItem>>('/reseller/catalog', { productId, sellingPrice, saleMode })
    .then(r => r.data.data)
}

export function updateCatalogItem(itemId: string, data: { sellingPrice?: number; visible?: boolean }): Promise<CatalogItem> {
  return axiosClient
    .patch<ApiResponse<CatalogItem>>(`/reseller/catalog/${itemId}`, data)
    .then(r => r.data.data)
}

export function removeCatalogItem(itemId: string): Promise<void> {
  return axiosClient
    .delete<ApiResponse<void>>(`/reseller/catalog/${itemId}`)
    .then(() => undefined)
}

// ── Reservas (venta iniciada por el revendedor) ───────────────────────────────

export interface ReservationItemInput {
  catalogItemId: string
  variantId: string
  quantity: number
}

export function createReservation(data: {
  items: ReservationItemInput[]
  buyerName: string
  buyerWhatsapp: string
  note?: string
}): Promise<ReservationResult> {
  return axiosClient
    .post<ApiResponse<ReservationResult>>('/reseller/orders', data)
    .then(r => r.data.data)
}

export function cancelMyOrder(orderId: string): Promise<ReservationOrder> {
  return axiosClient
    .patch<ApiResponse<ReservationOrder>>(`/reseller/orders/${orderId}/cancel`, {})
    .then(r => r.data.data)
}

// ── Resumen del inicio ─────────────────────────────────────────────────────────

export interface DashboardSummary {
  salesThisMonth: number
  salesLastMonth: number
  ordersThisMonth: number
  ordersLastMonth: number
  pendingReservations: number
  nextClose: string
  nextDispatch: string
  cycleStatus: 'OPEN' | 'CLOSED' | 'PREPARING' | 'DISPATCHED'
  cycleNumber: number
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return axiosClient
    .get<ApiResponse<DashboardSummary>>('/reseller/dashboard')
    .then(r => r.data.data)
}

// ── Nivel y ranking ────────────────────────────────────────────────────────────

export type ResellerLevel = 'INICIAL' | 'BRONCE' | 'PLATA' | 'ORO'

export interface MyLevel {
  level: ResellerLevel
  lifetimeRevenue: number
  commissionPct: number
  maxMarkupPct: number
  nextLevel: ResellerLevel | null
  nextThreshold: number | null
}

export function getMyLevel(): Promise<MyLevel> {
  return axiosClient
    .get<ApiResponse<MyLevel>>('/reseller/level')
    .then(r => r.data.data)
}

export interface RankingEntry {
  position: number
  resellerId: string
  storeName: string
  level: ResellerLevel
}

export interface MyRanking {
  top: RankingEntry[]
  myPosition: number | null
  myTotal: number
  totalParticipants: number
}

export function getMyRanking(): Promise<MyRanking> {
  return axiosClient
    .get<ApiResponse<MyRanking>>('/reseller/ranking')
    .then(r => r.data.data)
}

// ── Ciclos de compra ───────────────────────────────────────────────────────────

export type CycleStatus = 'OPEN' | 'CLOSED' | 'PREPARING' | 'DISPATCHED'

export interface MyCycleOrder {
  id: string
  orderNumber: string
  buyerName: string
  status: string
  total: string
  items: { productName: string; size: string; color: string; quantity: number; cancelled: boolean }[]
}

export interface MyCycle {
  cycle: { id: string; number: number; closeAt: string; dispatchAt: string; status: CycleStatus }
  productCount: number
  total: number
  bonusPct: number
  nextTier: { thresholdAmount: number; bonusPct: number } | null
  remainingToNextTier: number | null
  orders: MyCycleOrder[]
}

export function getMyCycles(): Promise<MyCycle[]> {
  return axiosClient
    .get<ApiResponse<MyCycle[]>>('/reseller/cycles')
    .then(r => r.data.data)
}

// ── Onboarding ─────────────────────────────────────────────────────────────────

export function markOnboardingSeen(): Promise<{ id: string; onboardingSeenAt: string }> {
  return axiosClient
    .patch<ApiResponse<{ id: string; onboardingSeenAt: string }>>('/reseller/onboarding/seen')
    .then(r => r.data.data)
}

// ── Perfil ───────────────────────────────────────────────────────────────────

export function updateProfile(data: FormData): Promise<ResellerProfile> {
  return axiosClient
    .patch<ApiResponse<ResellerProfile>>('/reseller/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data.data)
}

// ── Cursos ───────────────────────────────────────────────────────────────────

export interface CourseVideo {
  id: string
  title: string
  youtubeUrl: string
  description: string | null
}

export function getMyCourses(): Promise<CourseVideo[]> {
  return axiosClient
    .get<ApiResponse<CourseVideo[]>>('/reseller/courses')
    .then(r => r.data.data)
}
