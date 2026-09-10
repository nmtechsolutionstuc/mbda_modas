-- Registro de cambios sensibles hechos por el admin sobre la cuenta de una
-- revendedora (CBU/alias propios, DNI, dirección) — mismo patrón que
-- config_audit_logs pero por revendedora.
CREATE TABLE IF NOT EXISTS "reseller_audit_logs" (
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

CREATE INDEX IF NOT EXISTS "reseller_audit_logs_resellerId_idx" ON "reseller_audit_logs"("resellerId");
CREATE INDEX IF NOT EXISTS "reseller_audit_logs_field_idx" ON "reseller_audit_logs"("field");
