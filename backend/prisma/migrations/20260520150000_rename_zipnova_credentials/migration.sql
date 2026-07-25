-- Rename zipnovaToken → zipnovaApiKey and add zipnovaApiSecret
ALTER TABLE "config" RENAME COLUMN "zipnovaToken" TO "zipnovaApiKey";
ALTER TABLE "config" ADD COLUMN "zipnovaApiSecret" TEXT;
