-- Limpieza de alcance para el Prompt Maestro v2: elimina lo que quedó fuera del
-- nuevo modelo de negocio (checkout clásico con carrito, cotización/etiquetas de
-- envío vía Zipnova, feed "Prendas en Promo" y vales de cambio).

-- ── Feed "Prendas en Promo" ────────────────────────────────────────────────────
DROP TABLE IF EXISTS "user_listings";
DROP TYPE IF EXISTS "ListingStatus";
ALTER TABLE "products" DROP COLUMN IF EXISTS "showInFeed";
ALTER TABLE "config" DROP COLUMN IF EXISTS "feedEnabled";
ALTER TABLE "config" DROP COLUMN IF EXISTS "feedSectionName";
ALTER TABLE "config" DROP COLUMN IF EXISTS "feedMaxItems";
ALTER TABLE "config" DROP COLUMN IF EXISTS "feedMaxPerReseller";
ALTER TABLE "config" DROP COLUMN IF EXISTS "autoApproveListings";

-- ── Vales de cambio ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS "vouchers";
DROP TYPE IF EXISTS "VoucherStatus";

-- ── Checkout clásico (carrito público) + cotización/etiquetas Zipnova ────────
-- MBDA paga el envío y no calcula ni muestra su costo; la única venta posible
-- es la reserva que crea la revendedora. "trackingNumber" se conserva como
-- referencia opcional al despachar el pedido a la dirección de la revendedora.
ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingMethod";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingAddress";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingCity";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingProvince";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingZip";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingCost";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingQuoteData";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "zipnovaShipmentId";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "shippingLabel";
DROP TYPE IF EXISTS "ShippingMethod";

ALTER TABLE "config" DROP COLUMN IF EXISTS "shippingEnabled";
ALTER TABLE "config" DROP COLUMN IF EXISTS "zipnovaDiscountPctHome";
ALTER TABLE "config" DROP COLUMN IF EXISTS "zipnovaDiscountPctBranch";

-- Dimensiones/peso solo servían para cotizar envío; el default de comisión
-- global quedó reemplazado por LevelConfig.commissionPct.
ALTER TABLE "products" DROP COLUMN IF EXISTS "weightGrams";
ALTER TABLE "products" DROP COLUMN IF EXISTS "dimH";
ALTER TABLE "products" DROP COLUMN IF EXISTS "dimW";
ALTER TABLE "products" DROP COLUMN IF EXISTS "dimL";
ALTER TABLE "config" DROP COLUMN IF EXISTS "defaultWeightGrams";
ALTER TABLE "config" DROP COLUMN IF EXISTS "defaultDimH";
ALTER TABLE "config" DROP COLUMN IF EXISTS "defaultDimW";
ALTER TABLE "config" DROP COLUMN IF EXISTS "defaultDimL";
ALTER TABLE "config" DROP COLUMN IF EXISTS "defaultCommissionPct";
