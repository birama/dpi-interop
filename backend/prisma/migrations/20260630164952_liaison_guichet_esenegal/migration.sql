-- ============================================================================
-- Liaison guichet e-sénégal — Frontière backbone/front
--
-- Crée :
--   - enum PublicCible (CITOYEN, ENTREPRISE, MIXTE)
--   - table service_guichet (référentiel des démarches e-sénégal / TELEDAC)
--   - table liaison_guichet (N:N CasUsageMVP <-> ServiceGuichet, qualifiée)
--
-- Convention héritée de cas_usage_registre : mode / dateAjout / ajoutePar
-- (pas de createdAt / updatedAt).
--
-- IMPORTANT : migration additive uniquement. Aucune donnée existante
-- modifiée. Le seed PINS_referentiel_guichet_esenegal.json sera importé en
-- étape 2 via un script séparé idempotent (clé naturelle code).
--
-- Réf : MCTN/DU/PROMPTS-PINS-LIAISON-GUICHET-2026 — Étape 1.
-- Réversibilité : voir rollback.sql à côté de ce fichier.
-- ============================================================================

-- CreateEnum
CREATE TYPE "PublicCible" AS ENUM ('CITOYEN', 'ENTREPRISE', 'MIXTE');

-- CreateTable
CREATE TABLE "service_guichet" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "evenementDeVie" TEXT,
    "secteur" TEXT,
    "publicCible" "PublicCible",
    "statutEsenegal" TEXT,
    "ministere" TEXT,
    "pointFocalSiTiers" TEXT,
    "besoinSiTiers" TEXT,
    "priorisationJson" JSONB,
    "mode" TEXT,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ajoutePar" TEXT,

    CONSTRAINT "service_guichet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liaison_guichet" (
    "id" TEXT NOT NULL,
    "casUsageId" TEXT NOT NULL,
    "serviceGuichetId" TEXT NOT NULL,
    "note" TEXT,
    "mode" TEXT,
    "dateAjout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ajoutePar" TEXT,

    CONSTRAINT "liaison_guichet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_guichet_code_key" ON "service_guichet"("code");

-- CreateIndex
CREATE INDEX "service_guichet_secteur_idx" ON "service_guichet"("secteur");

-- CreateIndex
CREATE INDEX "liaison_guichet_serviceGuichetId_idx" ON "liaison_guichet"("serviceGuichetId");

-- CreateIndex
CREATE UNIQUE INDEX "liaison_guichet_casUsageId_serviceGuichetId_key" ON "liaison_guichet"("casUsageId", "serviceGuichetId");

-- AddForeignKey
ALTER TABLE "liaison_guichet" ADD CONSTRAINT "liaison_guichet_casUsageId_fkey" FOREIGN KEY ("casUsageId") REFERENCES "cas_usage_mvp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liaison_guichet" ADD CONSTRAINT "liaison_guichet_serviceGuichetId_fkey" FOREIGN KEY ("serviceGuichetId") REFERENCES "service_guichet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
