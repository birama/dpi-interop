-- CreateEnum
CREATE TYPE "EtatServeurSecurite" AS ENUM ('EXISTANT', 'SOUS_SYSTEME_A_CREER', 'AUCUN');

-- CreateEnum
CREATE TYPE "EtatApi" AS ENUM ('EXISTANTE', 'A_CREER', 'A_CONFIRMER');

-- CreateEnum
CREATE TYPE "TypeDocumentation" AS ENUM ('SWAGGER_OPENAPI', 'WSDL', 'AUTRE', 'AUCUNE');

-- CreateEnum
CREATE TYPE "StatutEngagement" AS ENUM ('A_QUALIFIER', 'EN_ATTENTE_AGENCE', 'EN_PREPARATION_AGENCE', 'PRET_A_INTEGRER', 'INTEGRE', 'BLOQUE');

-- CreateEnum
CREATE TYPE "SourceEngagement" AS ENUM ('COURRIER_OFFICIEL', 'PROCES_VERBAL_COMITE', 'PROCES_VERBAL_ATELIER', 'EMAIL_NOMINATIF', 'DECLARATION_ORALE', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeMouvementEngagement" AS ENUM ('CREATION', 'STATUT', 'DATE_ANNONCEE', 'RESPONSABLE', 'DOC', 'API', 'SERVEUR', 'BLOCAGE');

-- CreateTable
CREATE TABLE "engagement_integration" (
    "id" TEXT NOT NULL,
    "casUsageMVPId" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "systemeSourceId" TEXT NOT NULL,
    "serveurSecurite" "EtatServeurSecurite" NOT NULL DEFAULT 'AUCUN',
    "sousSystemeCode" TEXT,
    "etatApi" "EtatApi" NOT NULL DEFAULT 'A_CONFIRMER',
    "protocole" TEXT,
    "authentification" TEXT,
    "docType" "TypeDocumentation" NOT NULL DEFAULT 'AUCUNE',
    "docReference" TEXT,
    "docDatePublication" TIMESTAMP(3),
    "responsableNom" TEXT,
    "responsableFonction" TEXT,
    "responsableEmail" TEXT,
    "dateAnnonceeDisponibilite" TIMESTAMP(3),
    "sourceEngagement" "SourceEngagement",
    "sourceReference" TEXT,
    "statut" "StatutEngagement" NOT NULL DEFAULT 'A_QUALIFIER',
    "motifBlocage" TEXT,
    "dernierMouvementAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dernierMouvementPar" TEXT,
    "dernierMouvementType" "TypeMouvementEngagement" NOT NULL DEFAULT 'CREATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engagement_integration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engagement_integration_history" (
    "id" TEXT NOT NULL,
    "engagementIntegrationId" TEXT NOT NULL,
    "champ" TEXT NOT NULL,
    "valeurAvant" TEXT,
    "valeurApres" TEXT,
    "typeMouvement" "TypeMouvementEngagement" NOT NULL,
    "auteurUserId" TEXT,
    "auteurNom" TEXT NOT NULL,
    "auteurEmail" TEXT,
    "motif" TEXT,
    "dateChangement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "engagement_integration_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "engagement_integration_statut_idx" ON "engagement_integration"("statut");

-- CreateIndex
CREATE INDEX "engagement_integration_institutionId_idx" ON "engagement_integration"("institutionId");

-- CreateIndex
CREATE INDEX "engagement_integration_casUsageMVPId_idx" ON "engagement_integration"("casUsageMVPId");

-- CreateIndex
CREATE INDEX "engagement_integration_systemeSourceId_idx" ON "engagement_integration"("systemeSourceId");

-- CreateIndex
CREATE INDEX "engagement_integration_dernierMouvementAt_idx" ON "engagement_integration"("dernierMouvementAt");

-- CreateIndex
CREATE INDEX "engagement_integration_dateAnnonceeDisponibilite_idx" ON "engagement_integration"("dateAnnonceeDisponibilite");

-- CreateIndex
CREATE UNIQUE INDEX "engagement_integration_casUsageMVPId_institutionId_systemeS_key" ON "engagement_integration"("casUsageMVPId", "institutionId", "systemeSourceId");

-- CreateIndex
CREATE INDEX "engagement_integration_history_engagementIntegrationId_idx" ON "engagement_integration_history"("engagementIntegrationId");

-- CreateIndex
CREATE INDEX "engagement_integration_history_dateChangement_idx" ON "engagement_integration_history"("dateChangement");

-- CreateIndex
CREATE INDEX "engagement_integration_history_typeMouvement_idx" ON "engagement_integration_history"("typeMouvement");

-- AddForeignKey
ALTER TABLE "engagement_integration" ADD CONSTRAINT "engagement_integration_casUsageMVPId_fkey" FOREIGN KEY ("casUsageMVPId") REFERENCES "cas_usage_mvp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_integration" ADD CONSTRAINT "engagement_integration_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_integration" ADD CONSTRAINT "engagement_integration_systemeSourceId_fkey" FOREIGN KEY ("systemeSourceId") REFERENCES "systemes_source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engagement_integration_history" ADD CONSTRAINT "engagement_integration_history_engagementIntegrationId_fkey" FOREIGN KEY ("engagementIntegrationId") REFERENCES "engagement_integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

