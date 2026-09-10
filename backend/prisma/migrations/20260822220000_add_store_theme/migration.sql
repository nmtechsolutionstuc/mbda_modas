-- La revendedora puede elegir la paleta de colores + tipografía de su tienda pública.
DO $$ BEGIN
  CREATE TYPE "StoreTheme" AS ENUM ('ELEGANTE', 'VARONIL', 'NARANJA', 'ROSA', 'MINIMAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "storeTheme" "StoreTheme" NOT NULL DEFAULT 'ELEGANTE';
