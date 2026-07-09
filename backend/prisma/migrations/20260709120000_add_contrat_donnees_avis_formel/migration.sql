-- CreateEnum
CREATE TYPE "AvisFormelSens" AS ENUM ('FAVORABLE', 'RESERVE', 'DEFAVORABLE');

-- AlterTable
ALTER TABLE "cas_usage_mvp" ADD COLUMN     "dureeRetention" TEXT;

-- CreateTable
CREATE TABLE "contrat_donnees_version" (
    "id" TEXT NOT NULL,
    "casUsageId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "donneesEntree" TEXT,
    "donneesSortie" TEXT,
    "donneesLecture" TEXT,
    "baseLegale" TEXT,
    "dureeRetention" TEXT,
    "auteurUserId" TEXT NOT NULL,
    "auteurNom" TEXT NOT NULL,
    "auteurInstitution" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contrat_donnees_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avis_formel" (
    "id" TEXT NOT NULL,
    "casUsageId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "sens" "AvisFormelSens" NOT NULL,
    "commentaire" TEXT NOT NULL,
    "auteurUserId" TEXT NOT NULL,
    "auteurNom" TEXT NOT NULL,
    "auteurFonction" TEXT,
    "auteurInstitutionNom" TEXT NOT NULL,
    "dateDepot" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avis_formel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contrat_donnees_version_casUsageId_createdAt_idx" ON "contrat_donnees_version"("casUsageId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "contrat_donnees_version_casUsageId_versionNumber_key" ON "contrat_donnees_version"("casUsageId", "versionNumber");

-- CreateIndex
CREATE INDEX "avis_formel_casUsageId_dateDepot_idx" ON "avis_formel"("casUsageId", "dateDepot");

-- CreateIndex
CREATE INDEX "avis_formel_institutionId_idx" ON "avis_formel"("institutionId");

-- AddForeignKey
ALTER TABLE "contrat_donnees_version" ADD CONSTRAINT "contrat_donnees_version_casUsageId_fkey" FOREIGN KEY ("casUsageId") REFERENCES "cas_usage_mvp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_formel" ADD CONSTRAINT "avis_formel_casUsageId_fkey" FOREIGN KEY ("casUsageId") REFERENCES "cas_usage_mvp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_formel" ADD CONSTRAINT "avis_formel_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis_formel" ADD CONSTRAINT "avis_formel_auteurUserId_fkey" FOREIGN KEY ("auteurUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
