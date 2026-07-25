/**
 * Servicio de cotización y etiquetas de envío via Zipnova
 * Docs: https://docs.zipnova.com.ar
 *
 * Base URL: https://api.zipnova.com.ar/v2
 * Auth:     Basic base64(apiKey:apiSecret)
 *
 * Credenciales leídas desde variables de entorno:
 *   ZIPNOVA_API_KEY, ZIPNOVA_API_SECRET, ZIPNOVA_ACCOUNT_ID
 *
 * Se devuelven TODOS los carriers disponibles para el destino
 * (OCA, Correo Argentino, Andreani, Cruz del Sur, etc.)
 * ordenados por precio (sort_by: 'price').
 */

import { env } from '../config/env'

const ZIPNOVA_BASE = 'https://api.zipnova.com.ar/v2'
const TIMEOUT_MS  = 10_000

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface ZipnovaQuote {
  /** Clave única por opción: `${carrierId}_${serviceTypeCode}` */
  quoteKey:        string
  /** Valor guardado en Order.shippingMethod (enum DB) */
  shippingMethod:  'CORREO_ARGENTINO' | 'ANDREANI' | 'OTHER_CARRIER'
  carrierId:       number
  carrierName:     string
  /** Código interno Zipnova, ej: "standard_delivery", "pickup_point" */
  serviceType:     string
  /** Nombre legible del tipo de entrega, ej: "Entrega a domicilio" */
  serviceTypeName: string
  logisticType:    string
  cost:            number
  estimatedDays:   { min: number; max: number } | null
}

// JSON que se guarda en Order.shippingQuoteData al confirmar el pedido
export interface ShippingQuoteSnapshot {
  carrierId:    number
  carrierName:  string
  serviceType:  string
  logisticType: string
  cost:         number
}

// ── Config interna (solo se usa en este módulo) ───────────────────────────────

interface ZipnovaConfig {
  apiKey:    string
  apiSecret: string
  accountId: number
}

/** Retorna `true` si las 3 variables de entorno de Zipnova están presentes */
export function isZipnovaConfigured(): boolean {
  return !!(env.zipnovaApiKey && env.zipnovaApiSecret && env.zipnovaAccountId)
}

/** Lee las credenciales del entorno o lanza si faltan */
function requireZipnovaConfig(): ZipnovaConfig {
  const { zipnovaApiKey: apiKey, zipnovaApiSecret: apiSecret, zipnovaAccountId: accountId } = env
  if (!apiKey || !apiSecret || !accountId) {
    throw new Error(
      'Zipnova no está configurado. Definí ZIPNOVA_API_KEY, ZIPNOVA_API_SECRET y ZIPNOVA_ACCOUNT_ID en las variables de entorno.',
    )
  }
  return { apiKey, apiSecret, accountId }
}

// ── Helpers internos ──────────────────────────────────────────────────────────

function parseDays(iso?: string): number | null {
  if (!iso) return null
  const m = iso.match(/P(\d+)D/)
  return m ? parseInt(m[1]) : null
}

function basicAuth(apiKey: string, apiSecret: string): string {
  return 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
}

async function zipnovaFetch<T>(
  url: string,
  config: ZipnovaConfig,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        Authorization:  basicAuth(config.apiKey, config.apiSecret),
        'Content-Type': 'application/json',
        Accept:         'application/json',
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Zipnova HTTP ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ── Tipos internos de la respuesta de Zipnova ─────────────────────────────────

interface ZipnovaServiceType {
  code: string
  name?: string
}

interface ZipnovaQuoteResult {
  carrier:       { id: number; name: string }
  service_type:  ZipnovaServiceType
  logistic_type: string
  amounts:       { price: number; price_incl_tax: number }
  delivery_time?: {
    times?: {
      total?: { min?: string; max?: string }
    }
  }
}

interface ZipnovaQuoteResponse {
  all_results?: ZipnovaQuoteResult[]
  results?:     Record<string, ZipnovaQuoteResult>
}

// ── Helpers de mapeo ──────────────────────────────────────────────────────────

function mapShippingMethod(r: ZipnovaQuoteResult): 'CORREO_ARGENTINO' | 'ANDREANI' | 'OTHER_CARRIER' {
  const name = r.carrier.name?.toLowerCase() ?? ''
  if (r.carrier.id === 5 || name.includes('correo')) return 'CORREO_ARGENTINO'
  if (name.includes('andreani'))                      return 'ANDREANI'
  return 'OTHER_CARRIER'
}

/** Nombre legible del tipo de servicio (nuestro mapeo tiene prioridad para codes conocidos) */
function resolveServiceTypeName(serviceType: ZipnovaServiceType): string {
  switch (serviceType.code) {
    case 'standard_delivery': return 'Entrega a domicilio'
    case 'express_delivery':  return 'Entrega express'
    case 'pickup_point':      return 'Entrega en sucursal'
    case 'locker':            return 'Locker'
    default:                  return serviceType.name ?? serviceType.code
  }
}

// ── Cotizar envío ─────────────────────────────────────────────────────────────

export interface QuoteInput {
  zipDestino:     string
  city?:          string   // localidad/ciudad del destino (requerido por Zipnova)
  state?:         string   // provincia del destino (requerido por Zipnova)
  weightGrams:    number
  declaredValue?: number
  dimH?:          number   // cm
  dimW?:          number
  dimL?:          number
}

export async function getZipnovaQuotes(input: QuoteInput): Promise<ZipnovaQuote[]> {
  const config = requireZipnovaConfig()

  const body = {
    account_id:      config.accountId,
    declared_value:  input.declaredValue ?? 0,
    destination: {
      zipcode: input.zipDestino,
      ...(input.city  && { city:  input.city  }),
      ...(input.state && { state: input.state }),
    },
    items: [
      {
        sku:         'CART-001',
        weight:      Math.max(1, Math.round(input.weightGrams)),
        height:      Math.round(input.dimH ?? 10),
        width:       Math.round(input.dimW ?? 15),
        length:      Math.round(input.dimL ?? 20),
        description: 'Productos MBDA Modas',
      },
    ],
    type_packaging: 'dynamic',
    sort_by:        'price',
  }

  const data = await zipnovaFetch<ZipnovaQuoteResponse>(
    `${ZIPNOVA_BASE}/shipments/quote`,
    config,
    { method: 'POST', body: JSON.stringify(body) },
  )

  // La API puede devolver all_results (array) o results (objeto por service_type)
  const allResults: ZipnovaQuoteResult[] =
    data.all_results ?? Object.values(data.results ?? {})

  // Ordenamos explícitamente por price ascendente — no confiamos en el sort de la API
  const sorted = [...allResults].sort((a, b) => a.amounts.price - b.amounts.price)

  return sorted.map((r): ZipnovaQuote => {
    const minD = parseDays(r.delivery_time?.times?.total?.min)
    const maxD = parseDays(r.delivery_time?.times?.total?.max)
    return {
      quoteKey:        `${r.carrier.id}_${r.service_type.code}`,
      shippingMethod:  mapShippingMethod(r),
      carrierId:       r.carrier.id,
      carrierName:     r.carrier.name,
      serviceType:     r.service_type.code,
      serviceTypeName: resolveServiceTypeName(r.service_type),
      logisticType:    r.logistic_type,
      cost:            r.amounts.price,   // ex-IVA: más cercano a la tarifa real del transportista
      estimatedDays:   (minD !== null && maxD !== null) ? { min: minD, max: maxD } : null,
    }
  })
}

// ── Crear envío en Zipnova (para generar etiqueta) ────────────────────────────

export interface CreateShipmentInput {
  orderNumber:      string
  declaredValue:    number
  buyerName:        string
  buyerEmail?:      string
  buyerPhone:       string
  shippingAddress:  string   // "Calle 123" o "Av. Italia 610"
  shippingCity:     string
  shippingProvince: string
  shippingZip:      string
  weightGrams:      number
  quoteSnapshot:    ShippingQuoteSnapshot
}

export async function createZipnovaShipment(
  input: CreateShipmentInput,
): Promise<{ shipmentId: number; trackingNumber: string | null }> {
  const config = requireZipnovaConfig()

  // Parsear calle y número de la dirección (ej: "Av. Italia 610" → street="Av. Italia", number="610")
  const addrMatch = input.shippingAddress.match(/^(.+?)\s+(\d+\w*)\s*$/)
  const street       = addrMatch?.[1] ?? input.shippingAddress
  const streetNumber = addrMatch?.[2] ?? 's/n'

  const body = {
    account_id:     config.accountId,
    external_id:    input.orderNumber.slice(0, 30),
    service_type:   input.quoteSnapshot.serviceType,
    logistic_type:  input.quoteSnapshot.logisticType,
    carrier_id:     input.quoteSnapshot.carrierId,
    declared_value: input.declaredValue,
    type_packaging: 'dynamic',
    destination: {
      name:          input.buyerName,
      email:         input.buyerEmail,
      phone:         input.buyerPhone,
      street,
      street_number: streetNumber,
      city:          input.shippingCity,
      state:         input.shippingProvince,
      zipcode:       input.shippingZip,
    },
    packages: [
      {
        weight: Math.max(1, Math.round(input.weightGrams)),
        height: 10,
        width:  15,
        length: 20,
      },
    ],
  }

  const data = await zipnovaFetch<{
    id: number
    carrier_tracking_id?: string
    tracking?: string
  }>(
    `${ZIPNOVA_BASE}/shipments`,
    config,
    { method: 'POST', body: JSON.stringify(body) },
  )

  return {
    shipmentId:     data.id,
    trackingNumber: data.carrier_tracking_id ?? null,
  }
}

// ── Descargar etiqueta PDF ────────────────────────────────────────────────────

export async function downloadZipnovaLabel(shipmentId: number): Promise<Buffer> {
  const config = requireZipnovaConfig()

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(
      `${ZIPNOVA_BASE}/shipments/${shipmentId}/label.pdf`,
      {
        headers: {
          Authorization: basicAuth(config.apiKey, config.apiSecret),
          Accept:        'application/pdf',
        },
        signal: controller.signal,
      },
    )
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Zipnova label HTTP ${res.status}: ${text}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
