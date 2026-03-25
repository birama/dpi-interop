-- CreateEnum
CREATE TYPE "CoucheDPI" AS ENUM ('FONDATION', 'INTEGRATION', 'INFRASTRUCTURE', 'APPLICATION');

-- CreateEnum
CREATE TYPE "StatutBB" AS ENUM ('OPERATIONNEL', 'EN_DEPLOIEMENT', 'PLANIFIE', 'NON_DEMARRE');

-- CreateTable
CREATE TABLE "building_blocks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "couche" "CoucheDPI" NOT NULL,
    "statut" "StatutBB" NOT NULL DEFAULT 'NON_DEMARRE',
    "operateur" TEXT,
    "compatibleXRoad" BOOLEAN NOT NULL DEFAULT false,
    "urlDocumentation" TEXT,
    "technologie" TEXT,
    "dateDeploiement" TIMESTAMP(3),
    "observations" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "building_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "building_blocks_code_key" ON "building_blocks"("code");

-- CreateIndex
CREATE INDEX "building_blocks_couche_idx" ON "building_blocks"("couche");
