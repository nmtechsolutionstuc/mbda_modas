-- Modificación 8: cancelaciones, política de cambio y vales

-- Agregar CANCELLED al enum de estado de comisión
ALTER TYPE "CommissionStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

DO $$ BEGIN
  CREATE TYPE "VoucherStatus" AS ENUM ('ACTIVE', 'USED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "vouchers" (
  "id"                 TEXT NOT NULL,
  "buyerName"          TEXT NOT NULL,
  "buyerWhatsapp"      TEXT NOT NULL,
  "amount"             DECIMAL(12,2) NOT NULL,
  "status"             "VoucherStatus" NOT NULL DEFAULT 'ACTIVE',
  "note"               TEXT,
  "relatedOrderNumber" TEXT,
  "createdByAdminId"   TEXT NOT NULL,
  "createdByAdminName" TEXT NOT NULL,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL,
  "usedAt"             TIMESTAMP(3),
  "cancelledAt"        TIMESTAMP(3),

  CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "vouchers_buyerWhatsapp_idx" ON "vouchers"("buyerWhatsapp");
