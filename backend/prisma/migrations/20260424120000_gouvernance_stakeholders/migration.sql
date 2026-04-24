-- Migration : gouvernance des parties prenantes
-- Ajout des champs pour auto-saisine motivee + retrait spontane + eviction DU

-- 1. Enum typologie du concernement
CREATE TYPE "TypeConcernement" AS ENUM (
  'DONNEES_DETENUES',
  'PROCESSUS_IMPACTE',
  'GOUVERNANCE_TRANSVERSE',
  'AUTRE'
);

-- 2. Colonnes sur use_case_stakeholder
ALTER TABLE "use_case_stakeholder"
  ADD COLUMN "motifAutoSaisine"  TEXT,
  ADD COLUMN "typeConcernement"  "TypeConcernement",
  ADD COLUMN "retireParUserId"   TEXT,
  ADD COLUMN "evictionParDU"     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "evictionMotif"     TEXT;

-- 3. FK sur retireParUserId (SET NULL si user supprime)
ALTER TABLE "use_case_stakeholder"
  ADD CONSTRAINT "use_case_stakeholder_retireParUserId_fkey"
  FOREIGN KEY ("retireParUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
