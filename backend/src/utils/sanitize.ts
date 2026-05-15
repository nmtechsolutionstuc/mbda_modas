/**
 * Elimina etiquetas HTML de un string para prevenir XSS almacenado en DB.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim()
}

/**
 * Sanitiza todos los valores string de un objeto plano.
 */
export function sanitizeStrings<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === 'string' ? stripHtml(value) : value
  }
  return result as T
}

/**
 * Valida que un número de WhatsApp tenga formato argentino.
 * Acepta: 549XXXXXXXXXX (13 dígitos) o variantes con/sin 549.
 * Siempre normaliza a 549XXXXXXXXXX para consistencia.
 */
export function validateArgentinaPhone(phone: string): { valid: boolean; normalized?: string; error?: string } {
  // Eliminar caracteres no numéricos
  const digits = phone.replace(/\D/g, '')

  // Formato esperado: 549 + 10 dígitos = 13 total
  // O sin código de país: 10 dígitos (lo agregamos)
  // O con 0 adelante: 011XXXXXXXX → normalizamos
  if (digits.length === 13 && digits.startsWith('549')) {
    return { valid: true, normalized: digits }
  }
  if (digits.length === 10) {
    return { valid: true, normalized: `549${digits}` }
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    // 0 + área + número → quitar el 0 y agregar 549
    return { valid: true, normalized: `549${digits.slice(1)}` }
  }

  return {
    valid: false,
    error: 'Formato de WhatsApp inválido. Usá: 549XXXXXXXXXX (ej: 5493812345678)',
  }
}
