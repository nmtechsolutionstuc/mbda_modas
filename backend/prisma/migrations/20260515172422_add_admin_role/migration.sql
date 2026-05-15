-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'SUBADMIN');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "role" "AdminRole" NOT NULL DEFAULT 'ADMIN';
