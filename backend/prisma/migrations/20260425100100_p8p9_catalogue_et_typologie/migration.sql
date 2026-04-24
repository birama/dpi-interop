-- Migration P8 (catalogue des propositions) + P9 (typologie des cas d'usage)
-- Etape 2 : nouvelles enums, colonnes, tables et index.
-- (Les nouvelles valeurs de l'enum UseCaseStatus ont ete ajoutees dans la
-- migration precedente 20260425100000_p8p9_enum_values.)

-- =========================================================================
-- 1. NOUVELLES ENUMS
-- =========================================================================

CREATE TYPE "TypologieCasUsage" AS ENUM ('METIER', 'TECHNIQUE');

CREATE TYPE "SourceProposition" AS ENUM (
  'ATELIER_CADRAGE',
  'ETUDE_SENUM',
  'RECOMMANDATION',
  'CADRAGE_STRATEGIQUE',
  'PROPOSITION_INSTITUTIONNELLE'
);

CREATE TYPE "NiveauMaturite" AS ENUM (
  'ESQUISSE',
  'PRE_CADREE',
  'PRETE_A_ADOPTER'
);

CREATE TYPE "RolePressenti" AS ENUM (
  'INITIATEUR_PRESSENTI',
  'FOURNISSEUR_PRESSENTI',
  'CONSOMMATEUR_PRESSENTI',
  'PARTIE_PRENANTE_PRESSENTIE'
);

CREATE TYPE "AdoptionRequestStatus" AS ENUM (
  'EN_ATTENTE',
  'VALIDEE',
  'REFUSEE'
);

-- =========================================================================
-- 2. ENRICHISSEMENT DE cas_usage_mvp (catalogue + typologie + convention liee)
-- =========================================================================

ALTER TABLE "cas_usage_mvp"
  ADD COLUMN "sourceProposition"       "SourceProposition",
  ADD COLUMN "sourceDetail"            TEXT,
  ADD COLUMN "niveauMaturite"          "NiveauMaturite",
  ADD COLUMN "dateAdoption"            TIMESTAMP(3),
  ADD COLUMN "adopteParInstitutionId"  TEXT,
  ADD COLUMN "adopteParUserId"         TEXT,
  ADD COLUMN "fusionneVersId"          TEXT,
  ADD COLUMN "typologie"               "TypologieCasUsage" NOT NULL DEFAULT 'TECHNIQUE',
  ADD COLUMN "reclassementsTypologie"  JSONB,
  ADD COLUMN "conventionLieeId"        TEXT;

-- FKs
ALTER TABLE "cas_usage_mvp"
  ADD CONSTRAINT "cas_usage_mvp_adopteParInstitutionId_fkey"
    FOREIGN KEY ("adopteParInstitutionId") REFERENCES "institutions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cas_usage_mvp"
  ADD CONSTRAINT "cas_usage_mvp_adopteParUserId_fkey"
    FOREIGN KEY ("adopteParUserId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cas_usage_mvp"
  ADD CONSTRAINT "cas_usage_mvp_fusionneVersId_fkey"
    FOREIGN KEY ("fusionneVersId") REFERENCES "cas_usage_mvp"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "cas_usage_mvp"
  ADD CONSTRAINT "cas_usage_mvp_conventionLieeId_fkey"
    FOREIGN KEY ("conventionLieeId") REFERENCES "conventions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "cas_usage_mvp_typologie_idx" ON "cas_usage_mvp"("typologie");
CREATE INDEX "cas_usage_mvp_adopteParInstitutionId_idx" ON "cas_usage_mvp"("adopteParInstitutionId");

-- =========================================================================
-- 3. TABLE institution_pressentie (P8)
-- =========================================================================

CREATE TABLE "institution_pressentie" (
  "id"             TEXT          NOT NULL,
  "casUsageId"     TEXT          NOT NULL,
  "institutionId"  TEXT          NOT NULL,
  "rolePressenti" "RolePressenti" NOT NULL,
  "commentaire"    TEXT,
  "createdAt"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "institution_pressentie_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "institution_pressentie_casUsageId_institutionId_key" UNIQUE ("casUsageId", "institutionId"),
  CONSTRAINT "institution_pressentie_casUsageId_fkey"
    FOREIGN KEY ("casUsageId") REFERENCES "cas_usage_mvp"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "institution_pressentie_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "institutions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "institution_pressentie_institutionId_idx" ON "institution_pressentie"("institutionId");

-- =========================================================================
-- 4. TABLE relation_cas_usage (P9 — metier -> technique)
-- =========================================================================

CREATE TABLE "relation_cas_usage" (
  "id"                  TEXT         NOT NULL,
  "casUsageMetierId"    TEXT         NOT NULL,
  "casUsageTechniqueId" TEXT         NOT NULL,
  "ordre"               INTEGER,
  "obligatoire"         BOOLEAN      NOT NULL DEFAULT TRUE,
  "commentaire"         TEXT,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy"           TEXT         NOT NULL,

  CONSTRAINT "relation_cas_usage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "relation_cas_usage_metier_technique_key" UNIQUE ("casUsageMetierId", "casUsageTechniqueId"),
  CONSTRAINT "relation_cas_usage_casUsageMetierId_fkey"
    FOREIGN KEY ("casUsageMetierId") REFERENCES "cas_usage_mvp"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relation_cas_usage_casUsageTechniqueId_fkey"
    FOREIGN KEY ("casUsageTechniqueId") REFERENCES "cas_usage_mvp"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "relation_cas_usage_createdBy_fkey"
    FOREIGN KEY ("createdBy") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "relation_cas_usage_casUsageMetierId_idx" ON "relation_cas_usage"("casUsageMetierId");
CREATE INDEX "relation_cas_usage_casUsageTechniqueId_idx" ON "relation_cas_usage"("casUsageTechniqueId");

-- =========================================================================
-- 5. TABLE adoption_request (P8)
-- =========================================================================

CREATE TABLE "adoption_request" (
  "id"                      TEXT                    NOT NULL,
  "casUsageId"              TEXT                    NOT NULL,
  "institutionDemandeuseId" TEXT                    NOT NULL,
  "userDemandeurId"         TEXT                    NOT NULL,
  "motif"                   TEXT                    NOT NULL,
  "status"                  "AdoptionRequestStatus" NOT NULL DEFAULT 'EN_ATTENTE',
  "ajustements"             JSONB,
  "dateDemande"             TIMESTAMP(3)            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dateTraitement"          TIMESTAMP(3),
  "userValideurId"          TEXT,
  "motifTraitement"         TEXT,

  CONSTRAINT "adoption_request_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "adoption_request_casUsageId_fkey"
    FOREIGN KEY ("casUsageId") REFERENCES "cas_usage_mvp"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "adoption_request_institutionDemandeuseId_fkey"
    FOREIGN KEY ("institutionDemandeuseId") REFERENCES "institutions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "adoption_request_userDemandeurId_fkey"
    FOREIGN KEY ("userDemandeurId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "adoption_request_userValideurId_fkey"
    FOREIGN KEY ("userValideurId") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "adoption_request_casUsageId_idx" ON "adoption_request"("casUsageId");
CREATE INDEX "adoption_request_institutionDemandeuseId_idx" ON "adoption_request"("institutionDemandeuseId");
CREATE INDEX "adoption_request_status_idx" ON "adoption_request"("status");
