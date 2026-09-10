-- Niveles de revendedora (Inicial/Bronce/Plata/Oro): comisión, tope de aumento y
-- facturación acumulada histórica, con valores de prueba del prompt maestro.

DO $$ BEGIN
  CREATE TYPE "ResellerLevel" AS ENUM ('INICIAL', 'BRONCE', 'PLATA', 'ORO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "level" "ResellerLevel" NOT NULL DEFAULT 'INICIAL';
ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "lifetimeRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "level_configs" (
  "level"           "ResellerLevel" NOT NULL,
  "thresholdAmount" DECIMAL(14,2)   NOT NULL,
  "commissionPct"   DECIMAL(5,2)    NOT NULL,
  "maxMarkupPct"    DECIMAL(5,2)    NOT NULL,
  "updatedAt"       TIMESTAMP(3)    NOT NULL,
  CONSTRAINT "level_configs_pkey" PRIMARY KEY ("level")
);

INSERT INTO "level_configs" ("level", "thresholdAmount", "commissionPct", "maxMarkupPct", "updatedAt") VALUES
  ('INICIAL', 0,       10, 20, now()),
  ('BRONCE',  200000,  12, 25, now()),
  ('PLATA',   600000,  15, 30, now()),
  ('ORO',     1500000, 18, 40, now())
ON CONFLICT ("level") DO NOTHING;
