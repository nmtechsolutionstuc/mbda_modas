-- Ciclos de compra: agrupan los pedidos confirmados entre un cierre y el
-- siguiente despacho, tal como pide el prompt maestro.

DO $$ BEGIN
  CREATE TYPE "CycleStatus" AS ENUM ('OPEN', 'CLOSED', 'PREPARING', 'DISPATCHED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE SEQUENCE IF NOT EXISTS "cycles_number_seq";

CREATE TABLE IF NOT EXISTS "cycles" (
  "id"         TEXT NOT NULL,
  "number"     INTEGER NOT NULL DEFAULT nextval('cycles_number_seq'),
  "closeAt"    TIMESTAMP(3) NOT NULL,
  "dispatchAt" TIMESTAMP(3) NOT NULL,
  "status"     "CycleStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cycles_pkey" PRIMARY KEY ("id")
);

ALTER SEQUENCE "cycles_number_seq" OWNED BY "cycles"."number";

DO $$ BEGIN
  CREATE UNIQUE INDEX "cycles_number_key" ON "cycles"("number");
EXCEPTION WHEN duplicate_table THEN null; END $$;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cycleId" TEXT;
CREATE INDEX IF NOT EXISTS "orders_cycleId_idx" ON "orders"("cycleId");

DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
