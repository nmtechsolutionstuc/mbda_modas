-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "mbda";

-- CreateEnum
CREATE TYPE "mbda"."ProductKind" AS ENUM ('PHYSICAL', 'SERVICE', 'DIGITAL');

-- CreateEnum
CREATE TYPE "mbda"."OrderStatus" AS ENUM ('PENDING', 'PROOF_RECEIVED', 'CONFIRMED', 'DISPATCHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "mbda"."SaleMode" AS ENUM ('PRESENCIAL', 'ONLINE');

-- CreateEnum
CREATE TYPE "mbda"."PickupBy" AS ENUM ('BUYER', 'RESELLER');

-- CreateEnum
CREATE TYPE "mbda"."PaymentMethod" AS ENUM ('TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "mbda"."CommissionStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "mbda"."CommissionKind" AS ENUM ('SALE', 'BONUS');

-- CreateEnum
CREATE TYPE "mbda"."AdminRole" AS ENUM ('ADMIN', 'SUBADMIN');

-- CreateEnum
CREATE TYPE "mbda"."ResellerLevel" AS ENUM ('INICIAL', 'BRONCE', 'PLATA', 'ORO');

-- CreateEnum
CREATE TYPE "mbda"."CycleStatus" AS ENUM ('OPEN', 'CLOSED', 'PREPARING', 'DISPATCHED');

-- CreateEnum
CREATE TYPE "mbda"."StoreTheme" AS ENUM ('ELEGANTE', 'VARONIL', 'NARANJA', 'ROSA', 'MINIMAL');

-- CreateEnum
CREATE TYPE "mbda"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "mbda"."DeliveryMethod" AS ENUM ('PICKUP', 'SHIPPING');

-- CreateTable
CREATE TABLE "mbda"."admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "mbda"."AdminRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."resellers" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dni" TEXT,
    "whatsapp" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "cbu" TEXT,
    "alias" TEXT,
    "storeName" TEXT NOT NULL,
    "storeSlug" TEXT NOT NULL,
    "storePhoto" TEXT,
    "storeBio" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "deliveryMethod" "mbda"."DeliveryMethod" NOT NULL DEFAULT 'SHIPPING',
    "level" "mbda"."ResellerLevel" NOT NULL DEFAULT 'INICIAL',
    "storeTheme" "mbda"."StoreTheme" NOT NULL DEFAULT 'ELEGANTE',
    "lifetimeRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "referralCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "approvalStatus" "mbda"."ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "onboardingSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."level_configs" (
    "level" "mbda"."ResellerLevel" NOT NULL,
    "thresholdAmount" DECIMAL(14,2) NOT NULL,
    "commissionPct" DECIMAL(5,2) NOT NULL,
    "maxMarkupPct" DECIMAL(5,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "level_configs_pkey" PRIMARY KEY ("level")
);

-- CreateTable
CREATE TABLE "mbda"."refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "photos" TEXT[],
    "youtubeVideoUrl" TEXT,
    "categoryId" TEXT NOT NULL,
    "commissionPct" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "kind" "mbda"."ProductKind" NOT NULL DEFAULT 'PHYSICAL',
    "ownerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "availableForResellers" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."catalog_items" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "saleMode" "mbda"."SaleMode" NOT NULL DEFAULT 'ONLINE',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."cycles" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "closeAt" TIMESTAMP(3) NOT NULL,
    "dispatchAt" TIMESTAMP(3) NOT NULL,
    "status" "mbda"."CycleStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "buyerWhatsapp" TEXT NOT NULL,
    "buyerEmail" TEXT,
    "buyerNote" TEXT,
    "trackingNumber" TEXT,
    "pickupBy" "mbda"."PickupBy" NOT NULL DEFAULT 'BUYER',
    "paymentMethod" "mbda"."PaymentMethod",
    "cashDueDate" TIMESTAMP(3),
    "pickupDeadline" TIMESTAMP(3),
    "cycleId" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "status" "mbda"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "cancelReason" TEXT,
    "reservedUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "commissionPct" DECIMAL(5,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."commissions" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "kind" "mbda"."CommissionKind" NOT NULL DEFAULT 'SALE',
    "status" "mbda"."CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."cycle_bonus_tiers" (
    "id" TEXT NOT NULL,
    "thresholdAmount" DECIMAL(12,2) NOT NULL,
    "bonusPct" DECIMAL(5,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cycle_bonus_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."config_audit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "config_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."reseller_audit_logs" (
    "id" TEXT NOT NULL,
    "resellerId" TEXT NOT NULL,
    "resellerName" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reseller_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."course_videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "cbu" TEXT NOT NULL DEFAULT '',
    "alias" TEXT NOT NULL DEFAULT '',
    "whatsapp" TEXT NOT NULL DEFAULT '',
    "dispatchDays" INTEGER NOT NULL DEFAULT 3,
    "stockReserveHours" INTEGER NOT NULL DEFAULT 24,
    "maxCashDeliveryDays" INTEGER NOT NULL DEFAULT 2,
    "pickupExpiryHours" INTEGER NOT NULL DEFAULT 48,
    "outfitBuilderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cityResellerLimitEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cityResellerLimitCount" INTEGER NOT NULL DEFAULT 5,
    "helpUrl" TEXT NOT NULL DEFAULT '',
    "termsContent" TEXT,
    "termsUpdatedAt" TIMESTAMP(3),
    "privacyPolicyContent" TEXT,
    "privacyPolicyUpdatedAt" TIMESTAMP(3),
    "changePolicyContent" TEXT,
    "changePolicyUpdatedAt" TIMESTAMP(3),
    "withdrawalRightContent" TEXT,
    "withdrawalRightUpdatedAt" TIMESTAMP(3),
    "landingHeroTitle" TEXT NOT NULL DEFAULT 'Tu tienda, tus precios',
    "landingHeroSubtitle" TEXT NOT NULL DEFAULT 'Armá tu catálogo gratis',
    "landingHeroDesc" TEXT NOT NULL DEFAULT 'Elegí productos de MBDA Modas, ponele tu precio y vendé a tus clientes.',
    "landingCta1Text" TEXT NOT NULL DEFAULT 'Quiero ser revendedor',
    "landingCta2Text" TEXT NOT NULL DEFAULT 'Ya tengo cuenta',
    "landingHowTitle" TEXT NOT NULL DEFAULT '¿Cómo funciona?',
    "landingStep1Title" TEXT NOT NULL DEFAULT 'Registrate gratis',
    "landingStep1Desc" TEXT NOT NULL DEFAULT 'Creá tu cuenta en minutos, sin costo.',
    "landingStep2Title" TEXT NOT NULL DEFAULT 'Armá tu catálogo',
    "landingStep2Desc" TEXT NOT NULL DEFAULT 'Elegí productos y definí tus precios.',
    "landingStep3Title" TEXT NOT NULL DEFAULT 'Compartí y vendé',
    "landingStep3Desc" TEXT NOT NULL DEFAULT 'Compartí tu link único y recibí pedidos.',
    "landingHeroImage" TEXT,
    "landingHeroVideo" TEXT,
    "landingAboutText" TEXT NOT NULL DEFAULT 'Creamos una forma simple de emprender: vos elegís qué vender y a qué precio, MBDA se encarga del stock. Sin locales, sin inversión, sin vueltas.',
    "landingManifesto" TEXT NOT NULL DEFAULT 'Creá tu emprendimiento de moda sin invertir un peso. Elegís los productos, ponés tu precio, nosotros nos ocupamos del resto.',
    "landingFeaturesImage" TEXT,
    "landingStep1Video" TEXT,
    "landingStep2Video" TEXT,
    "landingStep3Video" TEXT,
    "landingBenefit1Title" TEXT NOT NULL DEFAULT 'Precios mayoristas',
    "landingBenefit1Desc" TEXT NOT NULL DEFAULT 'Accedé al catálogo de MBDA al precio de fábrica y definí vos cuánto ganás en cada venta.',
    "landingBenefit2Title" TEXT NOT NULL DEFAULT 'Catálogo siempre actualizado',
    "landingBenefit2Desc" TEXT NOT NULL DEFAULT 'Nuevos productos y colecciones disponibles para sumar a tu selección cuando quieras.',
    "landingBenefit3Title" TEXT NOT NULL DEFAULT 'Pedidos simples y directos',
    "landingBenefit3Desc" TEXT NOT NULL DEFAULT 'Cargás la reserva, MBDA confirma el pago y se encarga de tenerlo listo para tu clienta.',
    "landingBenefit4Title" TEXT NOT NULL DEFAULT 'Acompañamiento real',
    "landingBenefit4Desc" TEXT NOT NULL DEFAULT 'No estás sola: hay soporte para resolver dudas en cada paso de tu emprendimiento.',
    "landingShowBenefits" BOOLEAN NOT NULL DEFAULT true,
    "landingShowProcess" BOOLEAN NOT NULL DEFAULT true,
    "landingShowCollection" BOOLEAN NOT NULL DEFAULT true,
    "landingShowResellerStory" BOOLEAN NOT NULL DEFAULT true,
    "landingShowTestimonials" BOOLEAN NOT NULL DEFAULT true,
    "landingShowFaq" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."testimonials" (
    "id" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mbda"."faq_items" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "mbda"."admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "resellers_email_key" ON "mbda"."resellers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "resellers_storeSlug_key" ON "mbda"."resellers"("storeSlug");

-- CreateIndex
CREATE UNIQUE INDEX "resellers_referralCode_key" ON "mbda"."resellers"("referralCode");

-- CreateIndex
CREATE INDEX "resellers_referralCode_idx" ON "mbda"."resellers"("referralCode");

-- CreateIndex
CREATE INDEX "resellers_storeSlug_idx" ON "mbda"."resellers"("storeSlug");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "mbda"."refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_resellerId_idx" ON "mbda"."refresh_tokens"("resellerId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "mbda"."categories"("name");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "mbda"."products"("categoryId");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "mbda"."products"("isActive");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "mbda"."product_variants"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_productId_size_color_key" ON "mbda"."product_variants"("productId", "size", "color");

-- CreateIndex
CREATE INDEX "catalog_items_resellerId_idx" ON "mbda"."catalog_items"("resellerId");

-- CreateIndex
CREATE INDEX "catalog_items_productId_idx" ON "mbda"."catalog_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_items_resellerId_productId_saleMode_key" ON "mbda"."catalog_items"("resellerId", "productId", "saleMode");

-- CreateIndex
CREATE UNIQUE INDEX "cycles_number_key" ON "mbda"."cycles"("number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "mbda"."orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_resellerId_idx" ON "mbda"."orders"("resellerId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "mbda"."orders"("status");

-- CreateIndex
CREATE INDEX "orders_cycleId_idx" ON "mbda"."orders"("cycleId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "mbda"."order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_variantId_idx" ON "mbda"."order_items"("variantId");

-- CreateIndex
CREATE INDEX "commissions_resellerId_idx" ON "mbda"."commissions"("resellerId");

-- CreateIndex
CREATE INDEX "commissions_orderId_idx" ON "mbda"."commissions"("orderId");

-- CreateIndex
CREATE INDEX "config_audit_logs_field_idx" ON "mbda"."config_audit_logs"("field");

-- CreateIndex
CREATE INDEX "reseller_audit_logs_resellerId_idx" ON "mbda"."reseller_audit_logs"("resellerId");

-- CreateIndex
CREATE INDEX "reseller_audit_logs_field_idx" ON "mbda"."reseller_audit_logs"("field");

-- AddForeignKey
ALTER TABLE "mbda"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "mbda"."resellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbda"."products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "mbda"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbda"."product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "mbda"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbda"."catalog_items" ADD CONSTRAINT "catalog_items_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "mbda"."resellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbda"."catalog_items" ADD CONSTRAINT "catalog_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "mbda"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbda"."orders" ADD CONSTRAINT "orders_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "mbda"."resellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbda"."orders" ADD CONSTRAINT "orders_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "mbda"."cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbda"."order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "mbda"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbda"."order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "mbda"."product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbda"."commissions" ADD CONSTRAINT "commissions_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "mbda"."resellers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mbda"."commissions" ADD CONSTRAINT "commissions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "mbda"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

