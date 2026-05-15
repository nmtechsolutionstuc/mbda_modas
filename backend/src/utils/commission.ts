/**
 * Calcula la comisión del revendedor para un ítem del pedido.
 *
 * Regla:
 *   sellingPrice === basePrice → comision = basePrice × (commissionPct / 100)
 *   sellingPrice  >  basePrice → comision = sellingPrice - basePrice
 *   sellingPrice  <  basePrice → ERROR (precio de venta no puede ser menor al base)
 *
 * @param sellingPrice  Precio al que el revendedor vende (CatalogItem.sellingPrice)
 * @param basePrice     Precio base de MBDA (Product.basePrice)
 * @param commissionPct Porcentaje de comisión del producto (Product.commissionPct)
 * @returns Monto de comisión con 2 decimales
 */
export function calcularComision(
  sellingPrice: number,
  basePrice: number,
  commissionPct: number,
): number {
  if (sellingPrice < basePrice) {
    throw new Error('El precio de venta no puede ser menor al precio base')
  }
  if (sellingPrice === basePrice) {
    return parseFloat((basePrice * (commissionPct / 100)).toFixed(2))
  }
  // sellingPrice > basePrice
  return parseFloat((sellingPrice - basePrice).toFixed(2))
}
