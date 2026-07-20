-- Recensement des projets numeriques de l'Etat (GouvNum)
-- Ajoute la table projets_recenses et 9 enums associes.

-- CreateEnum
CREATE TYPE "TypeStructure" AS ENUM ('MINISTERE', 'DIRECTION', 'AGENCE', 'ETABLISSEMENT_PUBLIC', 'SOCIETE_NATIONALE', 'PROJET_PROGRAMME', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutAvancement" AS ENUM ('IDEE_CONCEPTION', 'ETUDE_CADRAGE', 'EN_REALISATION', 'EN_PRODUCTION', 'EN_REFONTE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "BudgetFourchette" AS ENUM ('MOINS_50_MILLIONS', 'DE_50_A_200_MILLIONS', 'DE_200_MILLIONS_A_1_MILLIARD', 'PLUS_1_MILLIARD', 'NON_CHIFFRE');

-- CreateEnum
CREATE TYPE "SourceFinancement" AS ENUM ('BUDGET_NATIONAL', 'PARTENAIRE_TECHNIQUE_FINANCIER', 'PARTENARIAT_PUBLIC_PRIVE', 'RESSOURCES_PROPRES', 'NON_FINANCE', 'AUTRE');

-- CreateEnum
CREATE TYPE "OuiNonPrevu" AS ENUM ('OUI', 'NON', 'PREVU');

-- CreateEnum
CREATE TYPE "HebergementProjet" AS ENUM ('CLOUD_SOUVERAIN_SENUM', 'DATACENTER_STRUCTURE', 'CLOUD_ETRANGER', 'NON_DEFINI');

-- CreateEnum
CREATE TYPE "OuiNonEnCours" AS ENUM ('OUI', 'NON', 'EN_COURS');

-- CreateEnum
CREATE TYPE "OuiNonADeterminer" AS ENUM ('OUI', 'NON', 'A_DETERMINER');

-- CreateEnum
CREATE TYPE "StatutTraitement" AS ENUM ('A_QUALIFIER', 'QUALIFIE', 'RETENU_COMITE', 'ECARTE');

-- CreateTable
CREATE TABLE "projets_recenses" (
    "id" TEXT NOT NULL,
    "ministereTutelle" TEXT NOT NULL,
    "ministereAutre" TEXT,
    "structureNom" TEXT NOT NULL,
    "typeStructure" "TypeStructure" NOT NULL,
    "contactNom" TEXT NOT NULL,
    "contactFonction" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactTelephone" TEXT,
    "intitule" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "natures" TEXT[],
    "statutAvancement" "StatutAvancement" NOT NULL,
    "anneeDebut" INTEGER,
    "anneeFin" INTEGER,
    "budgetFourchette" "BudgetFourchette" NOT NULL,
    "budgetMontant" DOUBLE PRECISION,
    "sourceFinancement" "SourceFinancement" NOT NULL,
    "sourceFinancementPrecision" TEXT,
    "echangeDonnees" "OuiNonPrevu",
    "echangeDonneesDetail" TEXT,
    "registresConcernes" TEXT[],
    "hebergement" "HebergementProjet",
    "dossierArchitecture" "OuiNonEnCours",
    "souhaitAccompagnement" "OuiNonADeterminer",
    "observations" TEXT,
    "dateSoumission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipTronquee" TEXT,
    "sessionRef" TEXT NOT NULL,
    "statutTraitement" "StatutTraitement" NOT NULL DEFAULT 'A_QUALIFIER',
    "notesInternes" TEXT,

    CONSTRAINT "projets_recenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projets_recenses_dateSoumission_idx" ON "projets_recenses"("dateSoumission");

-- CreateIndex
CREATE INDEX "projets_recenses_ministereTutelle_idx" ON "projets_recenses"("ministereTutelle");

-- CreateIndex
CREATE INDEX "projets_recenses_statutAvancement_idx" ON "projets_recenses"("statutAvancement");

-- CreateIndex
CREATE INDEX "projets_recenses_statutTraitement_idx" ON "projets_recenses"("statutTraitement");

-- CreateIndex
CREATE INDEX "projets_recenses_sessionRef_idx" ON "projets_recenses"("sessionRef");

-- CreateIndex
CREATE INDEX "projets_recenses_contactEmail_idx" ON "projets_recenses"("contactEmail");
