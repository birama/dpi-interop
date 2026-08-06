-- Lot PTF : unité de dialogue avec un bailleur
-- Sollicitation : acte de proposer un lot à un partenaire
-- Cf. conception Phase 0 — 06/08/2026

-- Enums
CREATE TYPE "StatutLot" AS ENUM ('BROUILLON', 'ACTIF', 'CLOS');
CREATE TYPE "StatutSollicitation" AS ENUM ('BROUILLON', 'TRANSMISE', 'EN_ATTENTE', 'ACCEPTEE', 'REFUSEE', 'HORS_MANDAT', 'CLOTUREE');

-- Lot
CREATE TABLE "lots" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "objet" TEXT,
    "ptfId" TEXT,
    "natureAppuiAttendue" "NatureAppui",
    "statut" "StatutLot" NOT NULL DEFAULT 'BROUILLON',
    "estimationJH" INTEGER,
    "profilsExperts" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- Sollicitation
CREATE TABLE "sollicitations" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "ptfId" TEXT NOT NULL,
    "referenceDocument" TEXT,
    "dateEnvoi" TIMESTAMP(3),
    "statut" "StatutSollicitation" NOT NULL DEFAULT 'BROUILLON',
    "motifIssue" TEXT,
    "dateReponse" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sollicitations_pkey" PRIMARY KEY ("id")
);

-- LotCasUsage (N-N Lot ↔ CasUsageMVP)
CREATE TABLE "lot_cas_usage" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "casUsageId" TEXT NOT NULL,
    "reserve" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lot_cas_usage_pkey" PRIMARY KEY ("id")
);

-- LotLivrable
CREATE TABLE "lot_livrable" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lot_livrable_pkey" PRIMARY KEY ("id")
);

-- LotJalon
CREATE TABLE "lot_jalon" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "datePrevue" TIMESTAMP(3),
    "dateReelle" TIMESTAMP(3),
    "statut" "StatutJalon" NOT NULL DEFAULT 'PLANIFIE',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lot_jalon_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "lots_code_key" ON "lots"("code");
CREATE INDEX "sollicitations_lotId_idx" ON "sollicitations"("lotId");
CREATE INDEX "sollicitations_ptfId_idx" ON "sollicitations"("ptfId");
CREATE INDEX "sollicitations_statut_idx" ON "sollicitations"("statut");
CREATE UNIQUE INDEX "lot_cas_usage_lotId_casUsageId_key" ON "lot_cas_usage"("lotId", "casUsageId");
CREATE INDEX "lot_livrable_lotId_idx" ON "lot_livrable"("lotId");
CREATE INDEX "lot_jalon_lotId_idx" ON "lot_jalon"("lotId");

-- Foreign Keys
ALTER TABLE "lots" ADD CONSTRAINT "lots_ptfId_fkey"
  FOREIGN KEY ("ptfId") REFERENCES "ptf"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sollicitations" ADD CONSTRAINT "sollicitations_lotId_fkey"
  FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sollicitations" ADD CONSTRAINT "sollicitations_ptfId_fkey"
  FOREIGN KEY ("ptfId") REFERENCES "ptf"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lot_cas_usage" ADD CONSTRAINT "lot_cas_usage_lotId_fkey"
  FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lot_cas_usage" ADD CONSTRAINT "lot_cas_usage_casUsageId_fkey"
  FOREIGN KEY ("casUsageId") REFERENCES "cas_usage_mvp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lot_livrable" ADD CONSTRAINT "lot_livrable_lotId_fkey"
  FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lot_jalon" ADD CONSTRAINT "lot_jalon_lotId_fkey"
  FOREIGN KEY ("lotId") REFERENCES "lots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
