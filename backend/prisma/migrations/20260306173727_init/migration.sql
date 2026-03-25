-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'INSTITUTION');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'VALIDATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('COMPILATION', 'MATRICE_FLUX', 'STATISTIQUES', 'EXPORT_INSTITUTION', 'EXPORT_COMPLET');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'INSTITUTION',
    "institutionId" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ministere" TEXT NOT NULL,
    "responsableNom" TEXT NOT NULL,
    "responsableFonction" TEXT NOT NULL,
    "responsableEmail" TEXT NOT NULL,
    "responsableTel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "infrastructure" JSONB,
    "contraintesJuridiques" TEXT,
    "contraintesTechniques" TEXT,
    "maturiteInfra" SMALLINT NOT NULL DEFAULT 3,
    "maturiteDonnees" SMALLINT NOT NULL DEFAULT 3,
    "maturiteCompetences" SMALLINT NOT NULL DEFAULT 3,
    "maturiteGouvernance" SMALLINT NOT NULL DEFAULT 3,
    "forces" TEXT,
    "faiblesses" TEXT,
    "attentes" TEXT,
    "contributions" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "editeur" TEXT,
    "anneeInstallation" INTEGER,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registres" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "volumetrie" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donnees_consommer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "donnee" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "usage" TEXT,
    "priorite" SMALLINT NOT NULL DEFAULT 3,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donnees_consommer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donnees_fournir" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "donnee" TEXT NOT NULL,
    "destinataires" TEXT,
    "frequence" TEXT,
    "format" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "donnees_fournir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flux_existants" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "donnee" TEXT,
    "mode" TEXT,
    "frequence" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flux_existants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cas_usage" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "acteurs" TEXT,
    "priorite" SMALLINT NOT NULL DEFAULT 3,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cas_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "format" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT,
    "filesize" INTEGER,
    "generatedBy" TEXT,
    "parameters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_code_key" ON "institutions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "institutions_responsableEmail_key" ON "institutions"("responsableEmail");

-- CreateIndex
CREATE INDEX "institutions_code_idx" ON "institutions"("code");

-- CreateIndex
CREATE INDEX "submissions_institutionId_status_idx" ON "submissions"("institutionId", "status");

-- CreateIndex
CREATE INDEX "submissions_submittedAt_idx" ON "submissions"("submittedAt");

-- CreateIndex
CREATE INDEX "applications_submissionId_idx" ON "applications"("submissionId");

-- CreateIndex
CREATE INDEX "registres_submissionId_idx" ON "registres"("submissionId");

-- CreateIndex
CREATE INDEX "donnees_consommer_submissionId_idx" ON "donnees_consommer"("submissionId");

-- CreateIndex
CREATE INDEX "donnees_fournir_submissionId_idx" ON "donnees_fournir"("submissionId");

-- CreateIndex
CREATE INDEX "flux_existants_submissionId_idx" ON "flux_existants"("submissionId");

-- CreateIndex
CREATE INDEX "cas_usage_submissionId_priorite_idx" ON "cas_usage"("submissionId", "priorite");

-- CreateIndex
CREATE INDEX "reports_type_createdAt_idx" ON "reports"("type", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registres" ADD CONSTRAINT "registres_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donnees_consommer" ADD CONSTRAINT "donnees_consommer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donnees_fournir" ADD CONSTRAINT "donnees_fournir_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flux_existants" ADD CONSTRAINT "flux_existants_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cas_usage" ADD CONSTRAINT "cas_usage_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
