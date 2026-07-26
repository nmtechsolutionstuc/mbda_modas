-- Modificación 9: onboarding y ayuda
ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "onboardingSeenAt" TIMESTAMP(3);
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "helpUrl" TEXT NOT NULL DEFAULT '';
