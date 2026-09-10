-- Home fiel al spec de Drift: video de fondo en el hero, imagen fija en features, video por card
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "landingHeroVideo" TEXT;
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "landingFeaturesImage" TEXT;
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "landingStep1Video" TEXT;
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "landingStep2Video" TEXT;
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "landingStep3Video" TEXT;
