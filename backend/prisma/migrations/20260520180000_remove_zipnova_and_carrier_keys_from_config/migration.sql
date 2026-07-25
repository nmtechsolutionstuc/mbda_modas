-- Move Zipnova credentials to environment variables (ZIPNOVA_API_KEY, ZIPNOVA_API_SECRET, ZIPNOVA_ACCOUNT_ID)
-- Remove all carrier API key columns from the config table

ALTER TABLE "config" DROP COLUMN IF EXISTS "correoApiKey";
ALTER TABLE "config" DROP COLUMN IF EXISTS "andreaniApiKey";
ALTER TABLE "config" DROP COLUMN IF EXISTS "zipnovaApiKey";
ALTER TABLE "config" DROP COLUMN IF EXISTS "zipnovaApiSecret";
ALTER TABLE "config" DROP COLUMN IF EXISTS "zipnovaAccountId";
ALTER TABLE "config" DROP COLUMN IF EXISTS "zipnovaOriginAddress";
