-- Modificación 1: ocultar módulo de envíos detrás de un toggle admin ("Envíos activos").
-- Por defecto desactivado: el flujo de venta por defecto es la reserva por WhatsApp (sin envío).
ALTER TABLE "config" ADD COLUMN IF NOT EXISTS "shippingEnabled" BOOLEAN NOT NULL DEFAULT false;
