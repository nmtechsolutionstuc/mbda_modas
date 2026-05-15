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

// ── Pedidos ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'PROOF_RECEIVED' | 'CONFIRMED' | 'DISPATCHED' | 'CANCELLED'
export type ShippingMethod = 'CORREO_ARGENTINO' | 'ANDREANI' | 'LOCAL_PICKUP'

export interface OrderItem {
  id: string
  productName: string
  size: string
  color: string
  quantity: number
  unitPrice: string
  basePrice: string
  commissionPct: string
  subtotal: string
  cancelled: boolean
}

export interface OrderReseller {
  id: string
  firstName: string
  lastName: string
  storeName: string
  whatsapp: string
  cbu: string | null
  alias: string | null
}

export interface Order {
  id: string
  orderNumber: string
  buyerName: string
  buyerWhatsapp: string
  buyerEmail: string | null
  shippingMethod: ShippingMethod
  shippingAddress: string | null
  shippingCity: string | null
  shippingProvince: string | null
  shippingZip: string | null
  subtotal: string
  total: string
  status: OrderStatus
  cancelReason: string | null
  reservedUntil: string
  trackingNumber: string | null
  createdAt: string
  reseller: OrderReseller
  items: OrderItem[]
  commissions: Commission[]
}

export interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  totalPages: number
}

export async function getAdminOrders(params?: {
  page?: number
  limit?: number
  status?: string
  resellerId?: string
}): Promise<OrdersResponse> {
  const { data } = await axiosClient.get<{ success: true; data: OrdersResponse }>('/admin/orders', { params })
  return data.data
}

export async function getAdminOrder(id: string): Promise<Order> {
  const { data } = await axiosClient.get<{ success: true; data: Order }>(`/admin/orders/${id}`)
  return data.data
}

export async function confirmOrderPayment(id: string): Promise<Order> {
  const { data } = await axiosClient.patch<{ success: true; data: Order }>(`/admin/orders/${id}/confirm`)
  return data.data
}

export async function dispatchOrder(id: string, trackingNumber: string): Promise<Order> {
  const { data } = await axiosClient.patch<{ success: true; data: Order }>(`/admin/orders/${id}/dispatch`, { trackingNumber })
  return data.data
}

export async function cancelAdminOrder(id: string, cancelReason: string): Promise<Order> {
  const { data } = await axiosClient.patch<{ success: true; data: Order }>(`/admin/orders/${id}/cancel`, { cancelReason })
  return data.data
}

// ── Comisiones ────────────────────────────────────────────────────────────────

export interface Commission {
  id: string
  resellerId: string
  orderId: string
  amount: string
  status: 'PENDING' | 'PAID'
  paidAt: string | null
  createdAt: string
}

export interface CommissionsResponse {
  commissions: Commission[]
  total: number
  page: number
  totalPages: number
}

export async function getAdminCommissions(params?: {
  page?: number
  limit?: number
  status?: string
  resellerId?: string
}): Promise<CommissionsResponse> {
  const { data } = await axiosClient.get<{ success: true; data: CommissionsResponse }>('/admin/commissions', { params })
  return data.data
}

export async function markCommissionPaid(id: string): Promise<Commission> {
  const { data } = await axiosClient.patch<{ success: true; data: Commission }>(`/admin/commissions/${id}/mark-paid`)
  return data.data
}

// ── Revendedores ──────────────────────────────────────────────────────────────

export interface AdminReseller {
  id: string
  firstName: string
  lastName: string
  email: string
  whatsapp: string
  storeName: string
  storePhoto: string | null
  referralCode: string
  cbu: string | null
  alias: string | null
  isActive: boolean
  termsAcceptedAt: string | null
  createdAt: string
  _count: {
    catalogItems: number
    orders: number
    commissions: number
  }
}

export interface ResellersResponse {
  resellers: AdminReseller[]
  total: number
  page: number
  totalPages: number
}

export async function getAdminResellers(params?: {
  page?: number
  limit?: number
  isActive?: boolean
}): Promise<ResellersResponse> {
  const { data } = await axiosClient.get<{ success: true; data: ResellersResponse }>('/admin/resellers', { params })
  return data.data
}

export async function toggleResellerActive(id: string): Promise<AdminReseller> {
  const { data } = await axiosClient.patch<{ success: true; data: AdminReseller }>(`/admin/resellers/${id}/toggle`)
  return data.data
}
