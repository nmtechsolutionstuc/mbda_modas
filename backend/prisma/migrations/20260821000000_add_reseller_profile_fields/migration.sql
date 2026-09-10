-- Datos de la revendedora que pide el Prompt Maestro (DNI, dirección física para
-- despacho fuera de Concepción, y slug para la tienda pública /tienda/:slug).

ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "dni" TEXT;
ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "storeSlug" TEXT;

-- Backfill de storeSlug para revendedoras existentes: slugifica storeName y le
-- agrega un sufijo corto del id para garantizar unicidad aunque dos tiendas
-- tengan nombres iguales o muy parecidos.
UPDATE "resellers"
SET "storeSlug" = trim(both '-' from regexp_replace(lower(regexp_replace("storeName", '[^a-zA-Z0-9\s-]', '', 'g')), '\s+', '-', 'g'))
  || '-' || substr(replace(id::text, '-', ''), 1, 6)
WHERE "storeSlug" IS NULL;

ALTER TABLE "resellers" ALTER COLUMN "storeSlug" SET NOT NULL;

DO $$ BEGIN
  CREATE UNIQUE INDEX "resellers_storeSlug_key" ON "resellers"("storeSlug");
EXCEPTION WHEN duplicate_table THEN null; END $$;

CREATE INDEX IF NOT EXISTS "resellers_storeSlug_idx" ON "resellers"("storeSlug");
