-- AdhesionInstitution : statut d'engagement des institutions envers PINS
-- Niveaux : juridique (convention) → technique (raccordement) → service (API)
-- Distinct de XRoadReadiness (suivi technique fin des 6 jalons)

CREATE TYPE "StatutAdhesion" AS ENUM ('NON_ENGAGEE', 'CONVENTION_EN_COURS', 'CONVENTION_SIGNEE', 'RACCORDEE', 'EN_SERVICE');
CREATE TYPE "TypeRaccordement" AS ENUM ('NOEUD_PROPRE', 'SOUS_SYSTEME_SENUM', 'AUCUN');
CREATE TYPE "DetenteurCles" AS ENUM ('INSTITUTION', 'SENUM', 'NON_ETABLI');

CREATE TABLE "adhesion_institution" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "statut" "StatutAdhesion" NOT NULL DEFAULT 'NON_ENGAGEE',
    "referenceConvention" TEXT,
    "dateConvention" TIMESTAMP(3),
    "typeRaccordement" "TypeRaccordement" NOT NULL DEFAULT 'AUCUN',
    "dateMiseEnService" TIMESTAMP(3),
    "detenteurCles" "DetenteurCles" NOT NULL DEFAULT 'NON_ETABLI',
    "dateDernierChangement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adhesion_institution_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "adhesion_institution_institutionId_key" ON "adhesion_institution"("institutionId");

ALTER TABLE "adhesion_institution" ADD CONSTRAINT "adhesion_institution_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
