/**
 * Validación de CBU argentino (estándar BCRA).
 * El CBU tiene 22 dígitos numéricos divididos en dos bloques:
 *  - Bloque 1 (8 dígitos): banco(3) + sucursal(4) + verificador(1)
 *  - Bloque 2 (14 dígitos): cuenta(13) + verificador(1)
 */

function calcVerifier(digits: number[], weights: number[]): number {
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i]!, 0)
  return (10 - (sum % 10)) % 10
}

export function validateCbu(cbu: string): { valid: boolean; error?: string } {
  if (!/^\d{22}$/.test(cbu)) {
    return { valid: false, error: 'El CBU debe tener exactamente 22 dígitos numéricos' }
  }

  const digits = cbu.split('').map(Number)

  // Bloque 1: primeros 8 dígitos (verificador en posición 7)
  const block1 = digits.slice(0, 7)
  const v1 = calcVerifier(block1, [7, 1, 3, 9, 7, 1, 3])
  if (v1 !== digits[7]) {
    return { valid: false, error: 'CBU inválido (verificador del bloque bancario incorrecto)' }
  }

  // Bloque 2: siguientes 14 dígitos (verificador en posición 21)
  const block2 = digits.slice(8, 21)
  const v2 = calcVerifier(block2, [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3])
  if (v2 !== digits[21]) {
    return { valid: false, error: 'CBU inválido (verificador de cuenta incorrecto)' }
  }

  return { valid: true }
}

/** Enmascara el CBU mostrando solo los últimos 4 dígitos: ••••••••••••••••1234 */
export function maskCbu(cbu: string): string {
  if (!cbu || cbu.length < 4) return '****'
  return '•'.repeat(cbu.length - 4) + cbu.slice(-4)
}
