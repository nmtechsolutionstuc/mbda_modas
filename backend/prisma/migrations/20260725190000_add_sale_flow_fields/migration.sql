-- Nuevo flujo de venta: reserva por WhatsApp + modo presencial/online + pago transferencia/efectivo

DO $$ BEGIN
  CREATE TYPE "SaleMode" AS ENUM ('PRESENCIAL', 'ONLINE');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PickupBy" AS ENUM ('BUYER', 'RESELLER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('TRANSFER', 'CASH');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- catalog_items: modo de venta por ítem, permite el mismo producto en los dos modos
ALTER TABLE "catalog_items" ADD COLUMN IF NOT EXISTS "saleMode" "SaleMode" NOT NULL DEFAULT 'ONLINE';

DROP INDEX IF EXISTS "catalog_items_resellerId_productId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "catalog_items_resellerId_productId_saleMode_key"
  ON "catalog_items"("resellerId", "productId", "saleMode");

-- orders: quién retira y cómo pagó
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickupBy" "PickupBy" NOT NULL DEFAULT 'BUYER';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod";
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cashDueDate" TIMESTAMP(3);

-- config: tope de días para entrega/cobro en efectivo
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "maxCashDeliveryDays" INTEGER NOT NULL DEFAULT 2;
