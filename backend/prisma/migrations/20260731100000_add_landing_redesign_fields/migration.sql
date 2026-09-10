-- Rediseño del home ("fashion premium"): imagen de hero + textos nuevos configurables
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "landingHeroImage" TEXT;
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "landingAboutText" TEXT NOT NULL DEFAULT 'Creamos una forma simple de emprender: vos elegís qué vender y a qué precio, MBDA se encarga del stock. Sin locales, sin inversión, sin vueltas.';
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "landingManifesto" TEXT NOT NULL DEFAULT 'Creá tu emprendimiento de moda sin invertir un peso. Elegís los productos, ponés tu precio, nosotros nos ocupamos del resto.';
