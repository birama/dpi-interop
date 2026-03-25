-- AlterTable
ALTER TABLE "flux_institutions" ADD COLUMN     "beneficeAttendu" TEXT,
ADD COLUMN     "complexiteTechnique" "ImpactLevel",
ADD COLUMN     "dateQualification" TIMESTAMP(3),
ADD COLUMN     "impactEstime" "ImpactLevel",
ADD COLUMN     "impactValide" "ImpactLevel",
ADD COLUMN     "justificationMetier" TEXT,
ADD COLUMN     "noteQualification" TEXT,
ADD COLUMN     "prerequisAPI" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prerequisAutre" TEXT,
ADD COLUMN     "prerequisConvention" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prerequisNettoyage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prerequisSecurityServer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pretTechniquement" TEXT,
ADD COLUMN     "problemeActuel" TEXT,
ADD COLUMN     "qualifie" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualifiePar" TEXT,
ADD COLUMN     "scoreTotal" INTEGER,
ADD COLUMN     "urgence" SMALLINT;

-- CreateIndex
CREATE INDEX "flux_institutions_qualifie_idx" ON "flux_institutions"("qualifie");
