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

export interface CatalogItem {
  id: string
  sellingPrice: string
  ganancia: number
  createdAt: string
  product: CatalogProduct
}

export interface AvailableProduct extends CatalogProduct {
  inCatalog: boolean
  catalogItemId: string | null
  sellingPrice: string | null
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

export function addToCatalog(productId: string, sellingPrice: number): Promise<CatalogItem> {
  return axiosClient
    .post<ApiResponse<CatalogItem>>('/reseller/catalog', { productId, sellingPrice })
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

// ── Perfil ───────────────────────────────────────────────────────────────────

export function updateProfile(data: FormData): Promise<ResellerProfile> {
  return axiosClient
    .patch<ApiResponse<ResellerProfile>>('/reseller/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data.data)
}
