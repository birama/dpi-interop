-- Correspondant désigné sur une partie prenante d'un cas d'usage (atelier 01/09/2026).
-- Un seul jeu de champs par ligne (unicité existante : casUsageId × institutionId × role).
-- Pas de contrainte @unique sur l'email : une personne peut être correspondante sur plusieurs cas.

ALTER TABLE "use_case_stakeholder" ADD COLUMN "correspondantNom" TEXT;
ALTER TABLE "use_case_stakeholder" ADD COLUMN "correspondantFonction" TEXT;
ALTER TABLE "use_case_stakeholder" ADD COLUMN "correspondantEmail" TEXT;
ALTER TABLE "use_case_stakeholder" ADD COLUMN "correspondantTelephone" TEXT;
ALTER TABLE "use_case_stakeholder" ADD COLUMN "correspondantDateDesignation" TIMESTAMP(3);
