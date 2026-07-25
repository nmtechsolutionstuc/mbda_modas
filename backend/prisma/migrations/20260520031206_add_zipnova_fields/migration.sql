-- AlterTable
ALTER TABLE "config" ADD COLUMN     "zipnovaAccountId" INTEGER,
ADD COLUMN     "zipnovaOriginAddress" TEXT,
ADD COLUMN     "zipnovaToken" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shippingQuoteData" TEXT,
ADD COLUMN     "zipnovaShipmentId" INTEGER;
