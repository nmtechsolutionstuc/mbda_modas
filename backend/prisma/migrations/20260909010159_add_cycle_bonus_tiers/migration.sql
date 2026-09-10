-- CreateEnum
CREATE TYPE "CommissionKind" AS ENUM ('SALE', 'BONUS');

-- AlterTable
ALTER TABLE "commissions" ADD COLUMN     "kind" "CommissionKind" NOT NULL DEFAULT 'SALE';

-- CreateTable
CREATE TABLE "cycle_bonus_tiers" (
    "id" TEXT NOT NULL,
    "thresholdAmount" DECIMAL(12,2) NOT NULL,
    "bonusPct" DECIMAL(5,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_bonus_tiers_pkey" PRIMARY KEY ("id")
);
