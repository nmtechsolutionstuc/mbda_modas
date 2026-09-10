ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "privacyPolicyContent" TEXT;
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "privacyPolicyUpdatedAt" TIMESTAMP(3);
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "changePolicyContent" TEXT;
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "changePolicyUpdatedAt" TIMESTAMP(3);
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "withdrawalRightContent" TEXT;
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "withdrawalRightUpdatedAt" TIMESTAMP(3);
