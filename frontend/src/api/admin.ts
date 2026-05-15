import axiosClient from './axiosClient'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  isActive: boolean
  order: number
  _count?: { products: number }
}

export interface ProductVariant {
  id: string
  size: string
  color: string
  stock: number
}

export interface Product {
  id: string
  name: string
  description: string | null
  basePrice: string // Decimal serializado como string
  commissionPct: string
  photos: string[]
  categoryId: string
  category: { id: string; name: string }
  kind: 'PHYSICAL' | 'SERVICE' | 'DIGITAL'
  weightGrams: number | null
  isActive: boolean
  variants: ProductVariant[]
  _count?: { catalogItems: number }
  createdAt: string
}

export interface DashboardStats {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  totalCategories: number
  totalResellers: number
  activeResellers: number
}

export interface Config {
  id: string
  cbu: string
  alias: string
  whatsapp: string
  dispatchDays: number
  stockReserveHours: number
  defaultWeightGrams: number | null
  defaultCommissionPct: string | null
  correoApiKey: string | null
  andreaniApiKey: string | null
  termsContent: string | null
  termsUpdatedAt: string | null
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

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await axiosClient.get<{ success: true; data: DashboardStats }>('/admin/dashboard')
  return data.data
}

// ── Categorías ────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { data } = await axiosClient.get<{ success: true; data: Category[] }>('/admin/categories')
  return data.data
}

export async function createCategory(payload: { name: string; order?: number }): Promise<Category> {
  const { data } = await axiosClient.post<{ success: true; data: Category }>('/admin/categories', payload)
  return data.data
}

export async function updateCategory(id: string, payload: { name?: string; isActive?: boolean; order?: number }): Promise<Category> {
  const { data } = await axiosClient.patch<{ success: true; data: Category }>(`/admin/categories/${id}`, payload)
  return data.data
}

// ── Productos ─────────────────────────────────────────────────────────────────

export interface ProductsResponse {
  items: Product[]
  total: number
  page: number
  limit: number
}

export async function getProducts(params?: {
  page?: number
  limit?: number
  categoryId?: string
  isActive?: boolean
  search?: string
}): Promise<ProductsResponse> {
  const { data } = await axiosClient.get<{ success: true; data: Product[]; meta: { total: number; page: number; limit: number } }>('/admin/products', { params })
  return { items: data.data, total: data.meta?.total ?? data.data.length, page: data.meta?.page ?? 1, limit: data.meta?.limit ?? 20 }
}

export interface VariantInput {
  size: string
  color: string
  stock: number
}

export async function createProduct(formData: FormData): Promise<Product> {
  const { data } = await axiosClient.post<{ success: true; data: Product }>('/admin/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function updateProduct(id: string, formData: FormData): Promise<Product> {
  const { data } = await axiosClient.patch<{ success: true; data: Product }>(`/admin/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteProduct(id: string): Promise<void> {
  await axiosClient.delete(`/admin/products/${id}`)
}

// ── Configuración ─────────────────────────────────────────────────────────────

export async function getConfig(): Promise<Config> {
  const { data } = await axiosClient.get<{ success: true; data: Config }>('/admin/config')
  return data.data
}

export async function updateConfig(payload: Partial<Config>): Promise<Config> {
  const { data } = await axiosClient.patch<{ success: true; data: Config }>('/admin/config', payload)
  return data.data
}
