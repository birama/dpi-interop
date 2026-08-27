-- Module Pilotage — champs de qualification du portefeuille suivi + table Blocage

-- Champs de qualification sur cas_usage_mvp
ALTER TABLE "cas_usage_mvp" ADD COLUMN "pilote" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "cas_usage_mvp" ADD COLUMN "identifiantPivot" TEXT;
ALTER TABLE "cas_usage_mvp" ADD COLUMN "serviceXroad" TEXT;
ALTER TABLE "cas_usage_mvp" ADD COLUMN "dateStatutImpl" TIMESTAMP(3);

-- Enum NatureBlocage
CREATE TYPE "NatureBlocage" AS ENUM ('JURIDIQUE', 'TECHNIQUE', 'ORGANISATIONNEL', 'DONNEES', 'CONTRACTUEL', 'ARBITRAGE');

-- Table blocages
CREATE TABLE "blocages" (
    "id" TEXT NOT NULL,
    "casUsageId" TEXT NOT NULL,
    "nature" "NatureBlocage" NOT NULL,
    "libelle" TEXT NOT NULL,
    "entiteAttendue" TEXT,
    "personneAttendue" TEXT,
    "dateOuverture" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "echeance" TIMESTAMP(3),
    "dateResolution" TIMESTAMP(3),
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocages_pkey" PRIMARY KEY ("id")
);

-- Index
CREATE INDEX "blocages_casUsageId_idx" ON "blocages"("casUsageId");
CREATE INDEX "blocages_echeance_idx" ON "blocages"("echeance");
CREATE INDEX "cas_usage_mvp_pilote_idx" ON "cas_usage_mvp"("pilote");

-- Un seul blocage ouvert par cas d'usage (garantie DB)
CREATE UNIQUE INDEX "blocages_unique_ouvert_par_cas" ON "blocages"("casUsageId") WHERE "dateResolution" IS NULL;

-- FK
ALTER TABLE "blocages" ADD CONSTRAINT "blocages_casUsageId_fkey"
  FOREIGN KEY ("casUsageId") REFERENCES "cas_usage_mvp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill : à défaut d'historique, l'ancienneté dans le statut courant démarre à la
-- dernière mise à jour connue du cas.
UPDATE "cas_usage_mvp" SET "dateStatutImpl" = "updatedAt" WHERE "dateStatutImpl" IS NULL;
