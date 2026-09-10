import axiosClient from './axiosClient'
import type { StoreTheme } from '../types'

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
  youtubeVideoUrl: string | null
  categoryId: string
  category: { id: string; name: string }
  kind: 'PHYSICAL' | 'SERVICE' | 'DIGITAL'
  isActive: boolean
  availableForResellers: boolean
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
  pendingOrders: number
  totalOrders: number
  totalSalesAmount: number
  pendingCommissionsAmount: number
}

export interface ConfigAuditEntry {
  id: string
  adminId: string
  adminName: string
  field: 'cbu' | 'alias' | 'whatsapp'
  oldValue: string
  newValue: string
  ip: string | null
  createdAt: string
}

export interface ConfigAuditResponse {
  logs: ConfigAuditEntry[]
  total: number
  limit: number
  offset: number
}

export interface Config {
  id: string
  cbu: string
  alias: string
  whatsapp: string
  dispatchDays: number
  stockReserveHours: number
  maxCashDeliveryDays: number
  pickupExpiryHours: number
  outfitBuilderEnabled: boolean
  cityResellerLimitEnabled: boolean
  cityResellerLimitCount: number
  helpUrl: string
  termsContent: string | null
  termsUpdatedAt: string | null
  privacyPolicyContent: string | null
  privacyPolicyUpdatedAt: string | null
  changePolicyContent: string | null
  changePolicyUpdatedAt: string | null
  withdrawalRightContent: string | null
  withdrawalRightUpdatedAt: string | null
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

export async function deleteCategory(id: string): Promise<void> {
  await axiosClient.delete(`/admin/categories/${id}`)
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

export async function uploadLandingImage(file: File): Promise<Config> {
  const fd = new FormData()
  fd.append('heroImage', file)
  const { data } = await axiosClient.patch<{ success: true; data: Config }>('/admin/config/landing-image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

/** Quita la imagen de fondo del hero — vuelve al degradé por defecto. */
export async function removeLandingImage(): Promise<Config> {
  const { data } = await axiosClient.delete<{ success: true; data: Config }>('/admin/config/landing-image')
  return data.data
}

export async function updateConfig(payload: Partial<Config> & { confirmPassword?: string }): Promise<Config> {
  const { data } = await axiosClient.patch<{ success: true; data: Config }>('/admin/config', payload)
  return data.data
}

export async function getConfigAudit(params?: {
  field?: 'cbu' | 'alias' | 'whatsapp'
  limit?: number
  offset?: number
}): Promise<ConfigAuditResponse> {
  const { data } = await axiosClient.get<{ success: true; data: ConfigAuditResponse }>('/admin/config/audit', { params })
  return data.data
}

// ── Testimonios de la Home ────────────────────────────────────────────────────

export interface Testimonial {
  id: string
  quote: string
  name: string
  city: string
  order: number
  isActive: boolean
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const { data } = await axiosClient.get<{ success: true; data: Testimonial[] }>('/admin/testimonials')
  return data.data
}

export async function createTestimonial(payload: { quote: string; name: string; city: string; order?: number }): Promise<Testimonial> {
  const { data } = await axiosClient.post<{ success: true; data: Testimonial }>('/admin/testimonials', payload)
  return data.data
}

export async function updateTestimonial(id: string, payload: Partial<Pick<Testimonial, 'quote' | 'name' | 'city' | 'order' | 'isActive'>>): Promise<Testimonial> {
  const { data } = await axiosClient.patch<{ success: true; data: Testimonial }>(`/admin/testimonials/${id}`, payload)
  return data.data
}

export async function deleteTestimonial(id: string): Promise<void> {
  await axiosClient.delete(`/admin/testimonials/${id}`)
}

// ── Preguntas frecuentes de la Home ───────────────────────────────────────────

export interface FaqItem {
  id: string
  question: string
  answer: string
  order: number
  isActive: boolean
}

export async function getFaqItems(): Promise<FaqItem[]> {
  const { data } = await axiosClient.get<{ success: true; data: FaqItem[] }>('/admin/faq')
  return data.data
}

export async function createFaqItem(payload: { question: string; answer: string; order?: number }): Promise<FaqItem> {
  const { data } = await axiosClient.post<{ success: true; data: FaqItem }>('/admin/faq', payload)
  return data.data
}

export async function updateFaqItem(id: string, payload: Partial<Pick<FaqItem, 'question' | 'answer' | 'order' | 'isActive'>>): Promise<FaqItem> {
  const { data } = await axiosClient.patch<{ success: true; data: FaqItem }>(`/admin/faq/${id}`, payload)
  return data.data
}

export async function deleteFaqItem(id: string): Promise<void> {
  await axiosClient.delete(`/admin/faq/${id}`)
}

// ── Niveles de revendedora ───────────────────────────────────────────────────

export type ResellerLevel = 'INICIAL' | 'BRONCE' | 'PLATA' | 'ORO'

export interface LevelConfig {
  level: ResellerLevel
  thresholdAmount: string
  commissionPct: string
  maxMarkupPct: string
}

export async function getLevelConfigs(): Promise<LevelConfig[]> {
  const { data } = await axiosClient.get<{ success: true; data: LevelConfig[] }>('/admin/levels')
  return data.data
}

export async function updateLevelConfigs(levels: {
  level: ResellerLevel
  thresholdAmount: number
  commissionPct: number
  maxMarkupPct: number
}[]): Promise<LevelConfig[]> {
  const { data } = await axiosClient.patch<{ success: true; data: LevelConfig[] }>('/admin/levels', { levels })
  return data.data
}

// ── Recompensa por volumen del ciclo ──────────────────────────────────────────

export interface CycleBonusTier {
  id: string
  thresholdAmount: string
  bonusPct: string
}

export async function getBonusTiers(): Promise<CycleBonusTier[]> {
  const { data } = await axiosClient.get<{ success: true; data: CycleBonusTier[] }>('/admin/bonus-tiers')
  return data.data
}

export async function updateBonusTiers(tiers: { thresholdAmount: number; bonusPct: number }[]): Promise<CycleBonusTier[]> {
  const { data } = await axiosClient.patch<{ success: true; data: CycleBonusTier[] }>('/admin/bonus-tiers', { tiers })
  return data.data
}

// ── Ciclos de compra ─────────────────────────────────────────────────────────

export type CycleStatus = 'OPEN' | 'CLOSED' | 'PREPARING' | 'DISPATCHED'

export interface Cycle {
  id: string
  number: number
  closeAt: string
  dispatchAt: string
  status: CycleStatus
  createdAt: string
}

export interface CycleWithTotals extends Cycle {
  orderCount: number
  total: number
}

export async function getCycles(): Promise<CycleWithTotals[]> {
  const { data } = await axiosClient.get<{ success: true; data: CycleWithTotals[] }>('/admin/cycles')
  return data.data
}

export async function createCycle(closeAt: string, dispatchAt: string): Promise<Cycle> {
  const { data } = await axiosClient.post<{ success: true; data: Cycle }>('/admin/cycles', { closeAt, dispatchAt })
  return data.data
}

export async function updateCycleStatus(id: string, status: 'CLOSED' | 'PREPARING' | 'DISPATCHED'): Promise<Cycle> {
  const { data } = await axiosClient.patch<{ success: true; data: Cycle }>(`/admin/cycles/${id}/status`, { status })
  return data.data
}

export async function updateCycleDates(id: string, closeAt: string, dispatchAt: string): Promise<Cycle> {
  const { data } = await axiosClient.patch<{ success: true; data: Cycle }>(`/admin/cycles/${id}`, { closeAt, dispatchAt })
  return data.data
}

export interface CycleShippingEntry {
  resellerId: string
  storeName: string
  city: string | null
  address: string | null
  postalCode: string | null
  deliveryMethod: 'PICKUP' | 'SHIPPING'
  productCount: number
  total: number
}

export async function getCycleShipping(id: string): Promise<CycleShippingEntry[]> {
  const { data } = await axiosClient.get<{ success: true; data: CycleShippingEntry[] }>(`/admin/cycles/${id}/shipping`)
  return data.data
}

// ── Pedidos ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'PROOF_RECEIVED' | 'CONFIRMED' | 'DISPATCHED' | 'CANCELLED'

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
  buyerNote: string | null
  paymentMethod: 'TRANSFER' | 'CASH' | null
  cashDueDate: string | null
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

export async function confirmOrderPayment(id: string, opts?: {
  paymentMethod?: 'TRANSFER' | 'CASH'
}): Promise<{ order: Order; waLink: string | null }> {
  const { data } = await axiosClient.patch<{ success: true; data: { order: Order; waLink: string | null } }>(`/admin/orders/${id}/confirm`, opts ?? {})
  return data.data
}

/** Estira el plazo de una reserva pendiente para que la clienta pague en efectivo más adelante — NO confirma el pago. */
export async function extendCashPickup(id: string, cashDueDate: string): Promise<{ order: Order }> {
  const { data } = await axiosClient.patch<{ success: true; data: { order: Order } }>(`/admin/orders/${id}/extend-cash`, { cashDueDate })
  return data.data
}

export async function dispatchOrder(id: string, trackingNumber: string): Promise<Order> {
  const { data } = await axiosClient.patch<{ success: true; data: Order }>(`/admin/orders/${id}/dispatch`, { trackingNumber })
  return data.data
}

export async function cancelAdminOrder(id: string, cancelReason: string): Promise<{ order: Order; waLink: string | null }> {
  const { data } = await axiosClient.patch<{ success: true; data: { order: Order; waLink: string | null } }>(`/admin/orders/${id}/cancel`, { cancelReason })
  return data.data
}

export async function markOrderProofReceived(id: string): Promise<Order> {
  const { data } = await axiosClient.patch<{ success: true; data: Order }>(`/admin/orders/${id}/mark-proof`)
  return data.data
}

export async function rejectOrderPayment(id: string, cancelReason: string): Promise<{ order: Order; waLink: string | null }> {
  const { data } = await axiosClient.patch<{ success: true; data: { order: Order; waLink: string | null } }>(`/admin/orders/${id}/reject`, { cancelReason })
  return data.data
}

export async function cancelSingleItem(orderId: string, itemId: string): Promise<Order> {
  const { data } = await axiosClient.patch<{ success: true; data: Order }>(`/admin/orders/${orderId}/items/${itemId}/cancel`)
  return data.data
}

// ── Retiros pendientes ────────────────────────────────────────────────────────

export interface PendingPickup {
  id: string
  orderNumber: string
  buyerName: string
  buyerWhatsapp: string
  pickupBy: 'BUYER' | 'RESELLER'
  paymentMethod: 'TRANSFER' | 'CASH' | null
  cashDueDate: string | null
  pickupDeadline: string | null
  total: string
  reseller: { id: string; storeName: string; whatsapp: string }
  items: OrderItem[]
}

export async function getPendingPickups(): Promise<PendingPickup[]> {
  const { data } = await axiosClient.get<{ success: true; data: PendingPickup[] }>('/admin/pickups')
  return data.data
}

export async function markPickedUp(id: string): Promise<PendingPickup> {
  const { data } = await axiosClient.patch<{ success: true; data: PendingPickup }>(`/admin/pickups/${id}/picked-up`)
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
  dni: string | null
  whatsapp: string
  storeName: string
  storeSlug: string
  storePhoto: string | null
  storeBio: string | null
  storeTheme: StoreTheme
  referralCode: string
  cbu: string | null
  alias: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  isActive: boolean
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED'
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
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
}): Promise<ResellersResponse> {
  const { data } = await axiosClient.get<{ success: true; data: ResellersResponse }>('/admin/resellers', { params })
  return data.data
}

export async function toggleResellerActive(id: string): Promise<AdminReseller> {
  const { data } = await axiosClient.patch<{ success: true; data: AdminReseller }>(`/admin/resellers/${id}/toggle`)
  return data.data
}

export async function approveReseller(id: string): Promise<AdminReseller> {
  const { data } = await axiosClient.patch<{ success: true; data: AdminReseller }>(`/admin/resellers/${id}/approve`)
  return data.data
}

export async function rejectReseller(id: string): Promise<AdminReseller> {
  const { data } = await axiosClient.patch<{ success: true; data: AdminReseller }>(`/admin/resellers/${id}/reject`)
  return data.data
}

export async function createReseller(payload: {
  firstName: string
  lastName: string
  dni?: string
  email: string
  password: string
  whatsapp: string
  storeName: string
  storeBio?: string
  storeTheme?: StoreTheme
  cbu?: string
  alias?: string
  address?: string
  city?: string
  postalCode?: string
}): Promise<AdminReseller> {
  const { data } = await axiosClient.post<{ success: true; data: AdminReseller }>('/admin/resellers', payload)
  return data.data
}

export async function updateReseller(id: string, payload: {
  firstName?: string
  lastName?: string
  dni?: string
  email?: string
  whatsapp?: string
  storeName?: string
  storeBio?: string
  storeTheme?: StoreTheme
  cbu?: string
  alias?: string
  address?: string
  city?: string
  postalCode?: string
  confirmPassword?: string
}): Promise<AdminReseller> {
  const { data } = await axiosClient.patch<{ success: true; data: AdminReseller }>(`/admin/resellers/${id}`, payload)
  return data.data
}

export interface ResellerAuditEntry {
  id: string
  resellerId: string
  resellerName: string
  adminId: string
  adminName: string
  field: 'cbu' | 'alias' | 'dni' | 'address' | 'city' | 'postalCode'
  oldValue: string
  newValue: string
  ip: string | null
  createdAt: string
}

export async function getResellerAudit(id: string): Promise<ResellerAuditEntry[]> {
  const { data } = await axiosClient.get<{ success: true; data: ResellerAuditEntry[] }>(`/admin/resellers/${id}/audit`)
  return data.data
}

export async function resetResellerPassword(id: string, password: string): Promise<void> {
  await axiosClient.patch(`/admin/resellers/${id}/reset-password`, { password })
}

export async function deleteReseller(id: string): Promise<void> {
  await axiosClient.delete(`/admin/resellers/${id}`)
}

// ── Cursos para revendedoras (videos de YouTube) ──────────────────────────────

export interface CourseVideo {
  id: string
  title: string
  youtubeUrl: string
  description: string | null
  order: number
  isActive: boolean
}

export async function getCourseVideos(): Promise<CourseVideo[]> {
  const { data } = await axiosClient.get<{ success: true; data: CourseVideo[] }>('/admin/courses')
  return data.data
}

export async function createCourseVideo(payload: { title: string; youtubeUrl: string; description?: string; order?: number }): Promise<CourseVideo> {
  const { data } = await axiosClient.post<{ success: true; data: CourseVideo }>('/admin/courses', payload)
  return data.data
}

export async function updateCourseVideo(id: string, payload: Partial<Pick<CourseVideo, 'title' | 'youtubeUrl' | 'description' | 'order' | 'isActive'>>): Promise<CourseVideo> {
  const { data } = await axiosClient.patch<{ success: true; data: CourseVideo }>(`/admin/courses/${id}`, payload)
  return data.data
}

export async function deleteCourseVideo(id: string): Promise<void> {
  await axiosClient.delete(`/admin/courses/${id}`)
}
