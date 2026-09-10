-- Aprobación manual de nuevas revendedoras: el autoregistro nace PENDING,
-- el alta manual desde admin y las cuentas ya existentes quedan APPROVED
-- (el DEFAULT cubre el backfill de las filas existentes).
DO $$ BEGIN
  CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED';

-- Video de YouTube por producto, embebido en el detalle de la prenda.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "youtubeVideoUrl" TEXT;
