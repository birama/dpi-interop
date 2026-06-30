-- Migration: add_new_deal_projets_nationaux
-- Ajoute ProgrammePrioritaire, ProjetNational, CasUsageProjet

CREATE TABLE IF NOT EXISTS "programme_prioritaire" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "domaine" TEXT,
    "finalite" TEXT,
    CONSTRAINT "programme_prioritaire_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "programme_prioritaire_code_key" ON "programme_prioritaire"("code");

CREATE TABLE IF NOT EXISTS "projet_national" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "programmePrioritaireId" TEXT NOT NULL,
    "budgetEstimatif" DOUBLE PRECISION,
    "finalite" TEXT,
    CONSTRAINT "projet_national_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "projet_national_code_key" ON "projet_national"("code");
CREATE INDEX IF NOT EXISTS "projet_national_programmePrioritaireId_idx" ON "projet_national"("programmePrioritaireId");

ALTER TABLE "projet_national" ADD CONSTRAINT "projet_national_programmePrioritaireId_fkey"
    FOREIGN KEY ("programmePrioritaireId") REFERENCES "programme_prioritaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "cas_usage_projet" (
    "id" TEXT NOT NULL,
    "casUsageMVPId" TEXT NOT NULL,
    "projetNationalId" TEXT NOT NULL,
    CONSTRAINT "cas_usage_projet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "cas_usage_projet_casUsageMVPId_projetNationalId_key"
    ON "cas_usage_projet"("casUsageMVPId", "projetNationalId");

ALTER TABLE "cas_usage_projet" ADD CONSTRAINT "cas_usage_projet_casUsageMVPId_fkey"
    FOREIGN KEY ("casUsageMVPId") REFERENCES "cas_usage_mvp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cas_usage_projet" ADD CONSTRAINT "cas_usage_projet_projetNationalId_fkey"
    FOREIGN KEY ("projetNationalId") REFERENCES "projet_national"("id") ON DELETE CASCADE ON UPDATE CASCADE;
