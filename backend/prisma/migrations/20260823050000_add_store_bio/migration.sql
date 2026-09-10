-- Frase corta editable por la revendedora, mostrada en el hero de su tienda pública
-- (antes era un texto fijo idéntico para todas las tiendas).
ALTER TABLE "resellers" ADD COLUMN IF NOT EXISTS "storeBio" TEXT;
