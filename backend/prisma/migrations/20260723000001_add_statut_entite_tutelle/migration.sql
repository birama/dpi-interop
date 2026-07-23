-- Ajoute le statut (EN_VIGUEUR / CLOTUREE) pour distinguer les entités
-- historiques dont la date de clôture n'est pas documentée.
-- Règle : dateFin renseignée → CLOTUREE. Sinon, le statut fait foi.

-- CreateEnum
CREATE TYPE "StatutEntiteTutelle" AS ENUM ('EN_VIGUEUR', 'CLOTUREE');

-- AlterTable
ALTER TABLE "entites_tutelle" ADD COLUMN "statut" "StatutEntiteTutelle" NOT NULL DEFAULT 'EN_VIGUEUR';

-- Données : clôturer les entités historiques
UPDATE "entites_tutelle" SET "statut" = 'CLOTUREE' WHERE "code" IN (
  'MCTN-HIST', 'MCTDAT-HIST', 'MITTD-HIST', 'MAER-HIST', 'MUCTAT-HIST', 'MFPTCT-HIST'
);
