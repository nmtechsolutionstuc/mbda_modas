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

export interface ResellerProfile {
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
}

// ── Tipo auxiliar para respuestas envueltas del backend ───────────────────────
type ApiResponse<T> = { success: true; data: T }

// ── Catálogo ─────────────────────────────────────────────────────────────────

export function getMyCatalog(): Promise<CatalogItem[]> {
  return axiosClient
    .get<ApiResponse<CatalogItem[]>>('/reseller/catalog')
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

export function updateCatalogItem(itemId: string, sellingPrice: number): Promise<CatalogItem> {
  return axiosClient
    .patch<ApiResponse<CatalogItem>>(`/reseller/catalog/${itemId}`, { sellingPrice })
    .then(r => r.data.data)
}

export function removeCatalogItem(itemId: string): Promise<void> {
  return axiosClient
    .delete<ApiResponse<void>>(`/reseller/catalog/${itemId}`)
    .then(() => undefined)
}

// ── Reservas (venta iniciada por el revendedor) ───────────────────────────────

export function createReservation(data: {
  catalogItemId: string
  variantId: string
  quantity: number
  buyerName: string
  buyerWhatsapp: string
}): Promise<ReservationResult> {
  return axiosClient
    .post<ApiResponse<ReservationResult>>('/reseller/orders', data)
    .then(r => r.data.data)
}

export function markOrderSold(orderId: string, data: {
  paymentMethod: 'TRANSFER' | 'CASH'
  cashDueDate?: string
}): Promise<ReservationOrder> {
  return axiosClient
    .patch<ApiResponse<ReservationOrder>>(`/reseller/orders/${orderId}/sold`, data)
    .then(r => r.data.data)
}

export function cancelMyOrder(orderId: string): Promise<ReservationOrder> {
  return axiosClient
    .patch<ApiResponse<ReservationOrder>>(`/reseller/orders/${orderId}/cancel`, {})
    .then(r => r.data.data)
}

// ── Mis prendas (feed "Prendas en Promo") ─────────────────────────────────────

export type ListingStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface MyListing {
  id: string
  name: string
  description: string | null
  price: string
  photos: string[]
  status: ListingStatus
  sold: boolean
  createdAt: string
}

export function getMyListings(): Promise<MyListing[]> {
  return axiosClient
    .get<ApiResponse<MyListing[]>>('/reseller/listings')
    .then(r => r.data.data)
}

export function createListing(data: FormData): Promise<MyListing> {
  return axiosClient
    .post<ApiResponse<MyListing>>('/reseller/listings', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data.data)
}

export function markListingSold(id: string): Promise<MyListing> {
  return axiosClient
    .patch<ApiResponse<MyListing>>(`/reseller/listings/${id}/sold`)
    .then(r => r.data.data)
}

export function removeListing(id: string): Promise<void> {
  return axiosClient
    .delete<ApiResponse<void>>(`/reseller/listings/${id}`)
    .then(() => undefined)
}

// ── Perfil ───────────────────────────────────────────────────────────────────

export function updateProfile(data: FormData): Promise<ResellerProfile> {
  return axiosClient
    .patch<ApiResponse<ResellerProfile>>('/reseller/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data.data)
}
