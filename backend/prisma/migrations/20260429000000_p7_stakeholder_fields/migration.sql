-- P7 — Gouvernance des parties prenantes (prompts 28/04/2026)
-- Ajoute les champs manquants dans use_case_stakeholder
-- et l'enum TypeConcernement.

-- Colonnes pour l'auto-saisine motivée
ALTER TABLE "use_case_stakeholder"
  ADD COLUMN "motifAutoSaisine" TEXT,
  ADD COLUMN "typeConcernement" TEXT,
  ADD COLUMN "retireParUserId" TEXT,
  ADD COLUMN "evictionParDU" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "evictionMotif" TEXT;

-- FK pour retireParUserId
ALTER TABLE "use_case_stakeholder"
  ADD CONSTRAINT "use_case_stakeholder_retireParUserId_fkey"
    FOREIGN KEY ("retireParUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
