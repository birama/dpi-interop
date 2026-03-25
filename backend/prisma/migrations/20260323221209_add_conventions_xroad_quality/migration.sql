-- CreateEnum
CREATE TYPE "ConventionStatus" AS ENUM ('NON_INITIEE', 'EN_COURS_REDACTION', 'EN_ATTENTE_SIGNATURE_A', 'EN_ATTENTE_SIGNATURE_B', 'SIGNEE', 'ACTIVE', 'EXPIREE', 'SUSPENDUE');

-- CreateEnum
CREATE TYPE "JalonStatus" AS ENUM ('NON_DEMARRE', 'EN_COURS', 'BLOQUE', 'TERMINE');

-- AlterTable
ALTER TABLE "registres" ADD COLUMN     "dernierNettoyage" TIMESTAMP(3),
ADD COLUMN     "frequenceAudit" TEXT,
ADD COLUMN     "planQualiteExiste" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "processusCorrection" TEXT,
ADD COLUMN     "tauxCompletude" INTEGER,
ADD COLUMN     "tauxDoublons" INTEGER;

-- CreateTable
CREATE TABLE "conventions" (
    "id" TEXT NOT NULL,
    "institutionAId" TEXT NOT NULL,
    "institutionBId" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "donneesVisees" TEXT,
    "statut" "ConventionStatus" NOT NULL DEFAULT 'NON_INITIEE',
    "dateInitiation" TIMESTAMP(3),
    "dateRedaction" TIMESTAMP(3),
    "dateSignatureA" TIMESTAMP(3),
    "dateSignatureB" TIMESTAMP(3),
    "dateActivation" TIMESTAMP(3),
    "dateExpiration" TIMESTAMP(3),
    "referenceDocument" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "conventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xroad_readiness" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "serveurDedie" "JalonStatus" NOT NULL DEFAULT 'NON_DEMARRE',
    "serveurDedieDate" TIMESTAMP(3),
    "connectiviteReseau" "JalonStatus" NOT NULL DEFAULT 'NON_DEMARRE',
    "connectiviteDate" TIMESTAMP(3),
    "certificatsSSL" "JalonStatus" NOT NULL DEFAULT 'NON_DEMARRE',
    "certificatsDate" TIMESTAMP(3),
    "securityServerInstall" "JalonStatus" NOT NULL DEFAULT 'NON_DEMARRE',
    "securityServerDate" TIMESTAMP(3),
    "premierServicePublie" "JalonStatus" NOT NULL DEFAULT 'NON_DEMARRE',
    "premierServiceDate" TIMESTAMP(3),
    "premierEchangeReussi" "JalonStatus" NOT NULL DEFAULT 'NON_DEMARRE',
    "premierEchangeDate" TIMESTAMP(3),
    "observations" TEXT,
    "blocage" TEXT,
    "prochainJalon" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "xroad_readiness_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conventions_institutionAId_idx" ON "conventions"("institutionAId");

-- CreateIndex
CREATE INDEX "conventions_institutionBId_idx" ON "conventions"("institutionBId");

-- CreateIndex
CREATE UNIQUE INDEX "xroad_readiness_institutionId_key" ON "xroad_readiness"("institutionId");

-- AddForeignKey
ALTER TABLE "conventions" ADD CONSTRAINT "conventions_institutionAId_fkey" FOREIGN KEY ("institutionAId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conventions" ADD CONSTRAINT "conventions_institutionBId_fkey" FOREIGN KEY ("institutionBId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xroad_readiness" ADD CONSTRAINT "xroad_readiness_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
