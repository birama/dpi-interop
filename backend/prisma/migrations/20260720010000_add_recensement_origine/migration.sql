-- Recensement GouvNum — Ajoute la tracabilite de la source
-- (origine PUBLIQUE vs AUTHENTIFIEE) et le rattachement institutionnel.

-- CreateEnum
CREATE TYPE "Origine" AS ENUM ('PUBLIQUE', 'AUTHENTIFIEE');

-- AlterTable
ALTER TABLE "projets_recenses"
  ADD COLUMN "institutionId" TEXT,
  ADD COLUMN "origine" "Origine" NOT NULL DEFAULT 'PUBLIQUE';

-- AddForeignKey
ALTER TABLE "projets_recenses"
  ADD CONSTRAINT "projets_recenses_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "institutions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
