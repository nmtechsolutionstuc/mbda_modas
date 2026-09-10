-- AlterTable
ALTER TABLE "config" ADD COLUMN     "landingBenefit1Desc" TEXT NOT NULL DEFAULT 'Accedé al catálogo de MBDA al precio de fábrica y definí vos cuánto ganás en cada venta.',
ADD COLUMN     "landingBenefit1Title" TEXT NOT NULL DEFAULT 'Precios mayoristas',
ADD COLUMN     "landingBenefit2Desc" TEXT NOT NULL DEFAULT 'Nuevos productos y colecciones disponibles para sumar a tu selección cuando quieras.',
ADD COLUMN     "landingBenefit2Title" TEXT NOT NULL DEFAULT 'Catálogo siempre actualizado',
ADD COLUMN     "landingBenefit3Desc" TEXT NOT NULL DEFAULT 'Cargás la reserva, MBDA confirma el pago y se encarga de tenerlo listo para tu clienta.',
ADD COLUMN     "landingBenefit3Title" TEXT NOT NULL DEFAULT 'Pedidos simples y directos',
ADD COLUMN     "landingBenefit4Desc" TEXT NOT NULL DEFAULT 'No estás sola: hay soporte para resolver dudas en cada paso de tu emprendimiento.',
ADD COLUMN     "landingBenefit4Title" TEXT NOT NULL DEFAULT 'Acompañamiento real',
ADD COLUMN     "landingShowBenefits" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "landingShowCollection" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "landingShowFaq" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "landingShowProcess" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "landingShowResellerStory" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "landingShowTestimonials" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "testimonials" (
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
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);
