-- Migration: add_partenaire_technique_role
-- Ajoute PARTENAIRE_TECHNIQUE au Role enum, crée organisations, ajoute organisationId à users

-- 1. Ajouter la valeur à l'enum Role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PARTENAIRE_TECHNIQUE';

-- 2. Créer les enums OrganisationType et OrganisationStatus
DO $$ BEGIN
  CREATE TYPE "OrganisationType" AS ENUM ('CABINET_CONSEIL', 'INTEGRATEUR', 'EDITEUR', 'EXPERT_INDEPENDANT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OrganisationStatus" AS ENUM ('ACTIF', 'INACTIF', 'ARCHIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Créer la table organisations
CREATE TABLE IF NOT EXISTS "organisations" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "OrganisationType" NOT NULL,
    "secteurAccompagnement" TEXT,
    "dateRattachement" TIMESTAMP(3),
    "dateFinPrevue" TIMESTAMP(3),
    "statut" "OrganisationStatus" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organisations_pkey" PRIMARY KEY ("id")
);

-- 4. Ajouter organisationId à users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "organisationId" TEXT;

-- 5. FK users → organisations
ALTER TABLE "users" ADD CONSTRAINT "users_organisationId_fkey"
    FOREIGN KEY ("organisationId") REFERENCES "organisations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. Index
CREATE INDEX IF NOT EXISTS "users_organisationId_idx" ON "users"("organisationId");
