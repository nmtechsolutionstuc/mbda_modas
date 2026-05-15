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

// ── Catálogo ─────────────────────────────────────────────────────────────────

export function getMyCatalog() {
  return axiosClient.get<CatalogItem[]>('/reseller/catalog').then(r => r.data)
}

export function getAvailableProducts(params?: {
  page?: number
  limit?: number
  categoryId?: string
  search?: string
}) {
  return axiosClient
    .get<AvailableProductsResponse>('/reseller/products', { params })
    .then(r => r.data)
}

export function addToCatalog(productId: string, sellingPrice: number) {
  return axiosClient
    .post<CatalogItem>('/reseller/catalog', { productId, sellingPrice })
    .then(r => r.data)
}

export function updateCatalogItem(itemId: string, sellingPrice: number) {
  return axiosClient
    .patch<CatalogItem>(`/reseller/catalog/${itemId}`, { sellingPrice })
    .then(r => r.data)
}

export function removeCatalogItem(itemId: string) {
  return axiosClient.delete(`/reseller/catalog/${itemId}`).then(r => r.data)
}

// ── Perfil ───────────────────────────────────────────────────────────────────

export function updateProfile(data: FormData) {
  return axiosClient
    .patch<ResellerProfile>('/reseller/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(r => r.data)
}
