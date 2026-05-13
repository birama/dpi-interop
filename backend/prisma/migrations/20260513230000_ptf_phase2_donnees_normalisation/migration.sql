-- ============================================================================
-- PTF Phase 2 — Modèle de données + normalisation
--
-- Crée :
--   - 4 nouveaux enums : Domaine, ManifestationType, ManifestationStatus, AuditAction
--   - Étend l'enum SourceProposition avec la valeur BAILLEUR
--   - Ajoute 2 colonnes à cas_usage_mvp : aFinancer (bool), domaine (Domaine?)
--   - Crée 3 tables : bailleur_domaine_interet, manifestation_interet, journal_audit_ptf
--
-- IMPORTANT : migration additive uniquement. Aucune donnée existante n'est
-- modifiée. La normalisation des valeurs `axePrioritaire` (texte libre) vers
-- `domaine` (enum) est faite dans un script séparé (nivellement/normalize_domaines.cjs)
-- après validation Birama du mapping.
--
-- Réf : MCTN/DU/PROMPTS-PINS-PTF-2026 — Prompt PTF-02.
-- ============================================================================

-- 1. Création de l'enum Domaine
CREATE TYPE "Domaine" AS ENUM (
  'FINANCES_PUBLIQUES',
  'CLIMAT_AFFAIRES',
  'PROTECTION_SOCIALE',
  'SANTE_NUMERIQUE',
  'EDUCATION',
  'IDENTITE_NUMERIQUE',
  'JUSTICE_ETAT_CIVIL',
  'FONCIER_CADASTRE',
  'AGRICULTURE_NUMERIQUE',
  'EMPLOI_FORMATION',
  'SERVICES_CITOYENS',
  'GOUVERNANCE_DONNEES',
  'CYBERSECURITE',
  'TRANSVERSAL'
);

-- 2. Enum ManifestationType
CREATE TYPE "ManifestationType" AS ENUM ('INTERET', 'FINANCEMENT');

-- 3. Enum ManifestationStatus
CREATE TYPE "ManifestationStatus" AS ENUM ('DRAFT', 'EN_VALIDATION', 'PUBLIE', 'REJETE', 'RETIRE');

-- 4. Enum AuditAction
CREATE TYPE "AuditAction" AS ENUM (
  'CONSULTATION_FICHE',
  'CREATION_MANIFESTATION',
  'MODIFICATION_MANIFESTATION',
  'SOUMISSION_MANIFESTATION',
  'RETRAIT_MANIFESTATION',
  'VALIDATION_MANIFESTATION',
  'REJET_MANIFESTATION',
  'DEMANDE_COMPLEMENT',
  'CREATION_PROPOSITION',
  'MODIFICATION_DOMAINES_PTF',
  'EXPORT_DONNEES',
  'TELECHARGEMENT_DOCUMENT',
  'CONNEXION',
  'ACCEPTATION_CGU'
);

-- 5. Extension SourceProposition (ajout BAILLEUR)
ALTER TYPE "SourceProposition" ADD VALUE IF NOT EXISTS 'BAILLEUR';

-- 6. Extension cas_usage_mvp (aFinancer + domaine)
ALTER TABLE "cas_usage_mvp"
  ADD COLUMN IF NOT EXISTS "aFinancer" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "domaine" "Domaine";

CREATE INDEX IF NOT EXISTS "cas_usage_mvp_aFinancer_idx" ON "cas_usage_mvp"("aFinancer");
CREATE INDEX IF NOT EXISTS "cas_usage_mvp_domaine_idx" ON "cas_usage_mvp"("domaine");

-- 7. Table bailleur_domaine_interet
CREATE TABLE "bailleur_domaine_interet" (
  "id"          TEXT NOT NULL,
  "ptfId"       TEXT NOT NULL,
  "domaine"     "Domaine" NOT NULL,
  "declaresPar" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bailleur_domaine_interet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "bailleur_domaine_interet_ptfId_domaine_key"
  ON "bailleur_domaine_interet"("ptfId", "domaine");
CREATE INDEX "bailleur_domaine_interet_ptfId_idx" ON "bailleur_domaine_interet"("ptfId");
CREATE INDEX "bailleur_domaine_interet_domaine_idx" ON "bailleur_domaine_interet"("domaine");

ALTER TABLE "bailleur_domaine_interet"
  ADD CONSTRAINT "bailleur_domaine_interet_ptfId_fkey"
  FOREIGN KEY ("ptfId") REFERENCES "ptf"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Table manifestation_interet
CREATE TABLE "manifestation_interet" (
  "id"                  TEXT NOT NULL,
  "casUsageId"          TEXT NOT NULL,
  "ptfId"               TEXT NOT NULL,
  "userId"              TEXT NOT NULL,
  "type"                "ManifestationType" NOT NULL,
  "statut"              "ManifestationStatus" NOT NULL DEFAULT 'DRAFT',
  "commentaire"         TEXT,
  "montantEstime"       DOUBLE PRECISION,
  "devise"              TEXT,
  "instrumentFinancier" TEXT,
  "valideParUserId"     TEXT,
  "dateValidation"      TIMESTAMP(3),
  "motifRejet"          TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,

  CONSTRAINT "manifestation_interet_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "manifestation_interet_casUsageId_idx" ON "manifestation_interet"("casUsageId");
CREATE INDEX "manifestation_interet_ptfId_idx" ON "manifestation_interet"("ptfId");
CREATE INDEX "manifestation_interet_statut_idx" ON "manifestation_interet"("statut");

ALTER TABLE "manifestation_interet"
  ADD CONSTRAINT "manifestation_interet_casUsageId_fkey"
  FOREIGN KEY ("casUsageId") REFERENCES "cas_usage_mvp"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "manifestation_interet"
  ADD CONSTRAINT "manifestation_interet_ptfId_fkey"
  FOREIGN KEY ("ptfId") REFERENCES "ptf"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "manifestation_interet"
  ADD CONSTRAINT "manifestation_interet_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "manifestation_interet"
  ADD CONSTRAINT "manifestation_interet_valideParUserId_fkey"
  FOREIGN KEY ("valideParUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 9. Table journal_audit_ptf
CREATE TABLE "journal_audit_ptf" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "action"    "AuditAction" NOT NULL,
  "objetType" TEXT,
  "objetId"   TEXT,
  "details"   JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "journal_audit_ptf_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "journal_audit_ptf_userId_idx" ON "journal_audit_ptf"("userId");
CREATE INDEX "journal_audit_ptf_action_idx" ON "journal_audit_ptf"("action");
CREATE INDEX "journal_audit_ptf_createdAt_idx" ON "journal_audit_ptf"("createdAt");

ALTER TABLE "journal_audit_ptf"
  ADD CONSTRAINT "journal_audit_ptf_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
