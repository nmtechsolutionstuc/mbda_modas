-- Modificación 3 + 7: vencimiento del retiro en el local y "Retiros pendientes" en el admin
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "pickupDeadline" TIMESTAMP(3);
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "pickupExpiryHours" INTEGER NOT NULL DEFAULT 48;
