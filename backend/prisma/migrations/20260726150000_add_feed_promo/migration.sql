-- Agregado nuevo: feed público "Prendas en Promo" (MBDA + tiendas externas)

-- Toggles independientes por producto
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "showInFeed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "availableForResellers" BOOLEAN NOT NULL DEFAULT true;

DO $$ BEGIN
  CREATE TYPE "ListingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "user_listings" (
  "id"          TEXT NOT NULL,
  "resellerId"  TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "price"       DECIMAL(12,2) NOT NULL,
  "photos"      TEXT[],
  "status"      "ListingStatus" NOT NULL DEFAULT 'PENDING',
  "sold"        BOOLEAN NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL,

  CONSTRAINT "user_listings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_listings_resellerId_idx" ON "user_listings"("resellerId");
CREATE INDEX IF NOT EXISTS "user_listings_status_idx" ON "user_listings"("status");

DO $$ BEGIN
  ALTER TABLE "user_listings" ADD CONSTRAINT "user_listings_resellerId_fkey"
    FOREIGN KEY ("resellerId") REFERENCES "resellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Config del feed
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "feedEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "feedSectionName" TEXT NOT NULL DEFAULT 'Prendas en Promo';
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "feedMaxItems" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "feedMaxPerReseller" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "autoApproveListings" BOOLEAN NOT NULL DEFAULT false;
