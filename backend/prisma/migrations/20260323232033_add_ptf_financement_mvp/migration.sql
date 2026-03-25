-- CreateEnum
CREATE TYPE "PTFType" AS ENUM ('BILATERAL', 'MULTILATERAL', 'FONDATION', 'ETAT', 'PRIVE');

-- CreateEnum
CREATE TYPE "ProgrammeStatus" AS ENUM ('EN_PREPARATION', 'ACTIF', 'EN_CLOTURE', 'CLOTURE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('PLANIFIE', 'EN_COURS', 'TERMINE', 'REPORTE');

-- CreateEnum
CREATE TYPE "ImpactLevel" AS ENUM ('FAIBLE', 'MOYEN', 'ELEVE', 'CRITIQUE');

-- CreateEnum
CREATE TYPE "StatutImplementation" AS ENUM ('IDENTIFIE', 'PRIORISE', 'EN_PREPARATION', 'EN_DEVELOPPEMENT', 'EN_TEST', 'EN_PRODUCTION', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "FinancementStatus" AS ENUM ('IDENTIFIE', 'DEMANDE', 'EN_NEGOCIATION', 'ACCORDE', 'EN_COURS', 'CLOTURE', 'REFUSE');

-- AlterTable
ALTER TABLE "cas_usage" ADD COLUMN     "casUsageMVPId" TEXT;

-- CreateTable
CREATE TABLE "ptf" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "acronyme" TEXT NOT NULL,
    "type" "PTFType" NOT NULL,
    "pays" TEXT,
    "contactNom" TEXT,
    "contactEmail" TEXT,
    "contactTel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ptf_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programmes" (
    "id" TEXT NOT NULL,
    "ptfId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "consortium" TEXT,
    "partenaireTechnique" TEXT,
    "montantTotal" DOUBLE PRECISION,
    "devise" TEXT NOT NULL DEFAULT 'FCFA',
    "montantDecaisse" DOUBLE PRECISION,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "statut" "ProgrammeStatus" NOT NULL DEFAULT 'ACTIF',
    "composantsDPI" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expertises" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "profil" TEXT NOT NULL,
    "role" TEXT,
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "prestataire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expertises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phases_mvp" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "dateDebutPrevue" TIMESTAMP(3),
    "dateFinPrevue" TIMESTAMP(3),
    "dateDebutEffective" TIMESTAMP(3),
    "dateFinEffective" TIMESTAMP(3),
    "statut" "PhaseStatus" NOT NULL DEFAULT 'PLANIFIE',
    "livrablesCles" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phases_mvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cas_usage_mvp" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "institutionSourceCode" TEXT,
    "institutionCibleCode" TEXT,
    "autresInstitutions" TEXT,
    "donneesEchangees" TEXT,
    "registresConcernes" TEXT,
    "axePrioritaire" TEXT,
    "impact" "ImpactLevel" NOT NULL DEFAULT 'MOYEN',
    "complexite" "ImpactLevel" NOT NULL DEFAULT 'MOYEN',
    "phaseMVPId" TEXT,
    "statutImpl" "StatutImplementation" NOT NULL DEFAULT 'IDENTIFIE',
    "prerequis" TEXT,
    "conventionRequise" BOOLEAN NOT NULL DEFAULT true,
    "conventionSignee" BOOLEAN NOT NULL DEFAULT false,
    "dateIdentification" TIMESTAMP(3),
    "dateLancement" TIMESTAMP(3),
    "dateMiseEnProd" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cas_usage_mvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financements" (
    "id" TEXT NOT NULL,
    "casUsageMVPId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "montantAlloue" DOUBLE PRECISION,
    "typeFinancement" TEXT,
    "statut" "FinancementStatus" NOT NULL DEFAULT 'DEMANDE',
    "dateDemande" TIMESTAMP(3),
    "dateAccord" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ptf_code_key" ON "ptf"("code");

-- CreateIndex
CREATE UNIQUE INDEX "programmes_code_key" ON "programmes"("code");

-- CreateIndex
CREATE INDEX "programmes_ptfId_idx" ON "programmes"("ptfId");

-- CreateIndex
CREATE INDEX "expertises_programmeId_idx" ON "expertises"("programmeId");

-- CreateIndex
CREATE UNIQUE INDEX "phases_mvp_code_key" ON "phases_mvp"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cas_usage_mvp_code_key" ON "cas_usage_mvp"("code");

-- CreateIndex
CREATE INDEX "cas_usage_mvp_phaseMVPId_idx" ON "cas_usage_mvp"("phaseMVPId");

-- CreateIndex
CREATE INDEX "cas_usage_mvp_axePrioritaire_idx" ON "cas_usage_mvp"("axePrioritaire");

-- CreateIndex
CREATE INDEX "financements_casUsageMVPId_idx" ON "financements"("casUsageMVPId");

-- CreateIndex
CREATE INDEX "financements_programmeId_idx" ON "financements"("programmeId");

-- CreateIndex
CREATE UNIQUE INDEX "financements_casUsageMVPId_programmeId_key" ON "financements"("casUsageMVPId", "programmeId");

-- AddForeignKey
ALTER TABLE "cas_usage" ADD CONSTRAINT "cas_usage_casUsageMVPId_fkey" FOREIGN KEY ("casUsageMVPId") REFERENCES "cas_usage_mvp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_ptfId_fkey" FOREIGN KEY ("ptfId") REFERENCES "ptf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expertises" ADD CONSTRAINT "expertises_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_usage_mvp" ADD CONSTRAINT "cas_usage_mvp_phaseMVPId_fkey" FOREIGN KEY ("phaseMVPId") REFERENCES "phases_mvp"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financements" ADD CONSTRAINT "financements_casUsageMVPId_fkey" FOREIGN KEY ("casUsageMVPId") REFERENCES "cas_usage_mvp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financements" ADD CONSTRAINT "financements_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
