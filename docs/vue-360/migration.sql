-- =============================================================================
--  MIGRATION SQL — DPI-INTEROP
--  Vue 360° des cas d'usage PINS
--  Référence : MCTN/DU/APP-DPI-INTEROP/CONC-2026-02
--  Version   : 1.0 - 22 avril 2026
--  Base      : PostgreSQL 14+
--
--  Cette migration est IDEMPOTENTE et NON DESTRUCTIVE.
--  Elle ne modifie aucune table existante en dehors de l'ajout de colonnes
--  optionnelles à CasUsageMVP (statut Vue 360° dédié).
--
--  À rejouer via :
--    psql -U <user> -d <db> -f migration.sql
--  ou via Prisma Migrate :
--    npx prisma migrate dev --name vue_360_use_cases
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
--  1. ÉNUMÉRATIONS
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "UseCaseRole" AS ENUM (
    'INITIATEUR', 'FOURNISSEUR', 'CONSOMMATEUR', 'PARTIE_PRENANTE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "UseCaseStatus" AS ENUM (
    'DECLARE', 'EN_CONSULTATION', 'VALIDATION_CONJOINTE',
    'QUALIFIE', 'PRIORISE', 'FINANCEMENT_OK', 'CONVENTIONNE',
    'EN_PRODUCTION', 'SUSPENDU', 'RETIRE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "FeedbackType" AS ENUM (
    'VALIDATION', 'RESERVE', 'REFUS_MOTIVE', 'QUESTION', 'CONTRE_PROPOSITION'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ConsultationStatus" AS ENUM (
    'EN_ATTENTE', 'REPONDU', 'ECHU', 'ANNULE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
--  2. TABLE use_case_stakeholder
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "use_case_stakeholder" (
  "id"             TEXT PRIMARY KEY,
  "casUsageId"     TEXT NOT NULL,
  "institutionId"  TEXT NOT NULL,
  "role"           "UseCaseRole" NOT NULL,
  "autoSaisine"    BOOLEAN NOT NULL DEFAULT FALSE,
  "dateAjout"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ajoutePar"      TEXT,
  "actif"          BOOLEAN NOT NULL DEFAULT TRUE,
  "dateRetrait"    TIMESTAMP(3),
  "motifRetrait"   TEXT,

  CONSTRAINT "use_case_stakeholder_unique"
    UNIQUE ("casUsageId", "institutionId", "role"),

  CONSTRAINT "fk_stakeholder_casusage"
    FOREIGN KEY ("casUsageId") REFERENCES "CasUsageMVP"("id") ON DELETE CASCADE,

  CONSTRAINT "fk_stakeholder_institution"
    FOREIGN KEY ("institutionId") REFERENCES "Institution"("id"),

  CONSTRAINT "fk_stakeholder_ajoutepar"
    FOREIGN KEY ("ajoutePar") REFERENCES "User"("id")
);

CREATE INDEX IF NOT EXISTS "idx_stakeholder_inst_role_actif"
  ON "use_case_stakeholder" ("institutionId", "role", "actif");

CREATE INDEX IF NOT EXISTS "idx_stakeholder_casusage_actif"
  ON "use_case_stakeholder" ("casUsageId", "actif");

-- -----------------------------------------------------------------------------
--  3. TABLE use_case_consultation
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "use_case_consultation" (
  "id"               TEXT PRIMARY KEY,
  "stakeholderId"    TEXT NOT NULL,
  "dateDemande"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dateEcheance"     TIMESTAMP(3) NOT NULL,
  "status"           "ConsultationStatus" NOT NULL DEFAULT 'EN_ATTENTE',
  "relances"         INTEGER NOT NULL DEFAULT 0,
  "derniereRelance"  TIMESTAMP(3),
  "ouvertePar"       TEXT NOT NULL,
  "motifSollicit"    TEXT,

  CONSTRAINT "fk_consultation_stakeholder"
    FOREIGN KEY ("stakeholderId") REFERENCES "use_case_stakeholder"("id") ON DELETE CASCADE,

  CONSTRAINT "fk_consultation_ouvertepar"
    FOREIGN KEY ("ouvertePar") REFERENCES "User"("id")
);

CREATE INDEX IF NOT EXISTS "idx_consultation_stakeholder"
  ON "use_case_consultation" ("stakeholderId");

CREATE INDEX IF NOT EXISTS "idx_consultation_status_echeance"
  ON "use_case_consultation" ("status", "dateEcheance");

-- -----------------------------------------------------------------------------
--  4. TABLE use_case_feedback
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "use_case_feedback" (
  "id"                    TEXT PRIMARY KEY,
  "consultationId"        TEXT,
  "stakeholderId"         TEXT NOT NULL,
  "type"                  "FeedbackType" NOT NULL,
  "motivation"            TEXT NOT NULL,
  "piecesJointes"         JSONB,
  "auteurUserId"          TEXT NOT NULL,
  "auteurNom"             TEXT NOT NULL,
  "auteurFonction"        TEXT,
  "auteurInstitutionNom"  TEXT NOT NULL,
  "dateAvis"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "amendeDe"              TEXT,

  CONSTRAINT "fk_feedback_consultation"
    FOREIGN KEY ("consultationId") REFERENCES "use_case_consultation"("id"),

  CONSTRAINT "fk_feedback_stakeholder"
    FOREIGN KEY ("stakeholderId") REFERENCES "use_case_stakeholder"("id") ON DELETE CASCADE,

  CONSTRAINT "fk_feedback_auteur"
    FOREIGN KEY ("auteurUserId") REFERENCES "User"("id"),

  CONSTRAINT "fk_feedback_amendede"
    FOREIGN KEY ("amendeDe") REFERENCES "use_case_feedback"("id"),

  CONSTRAINT "chk_feedback_motivation_length"
    CHECK (
      (type IN ('VALIDATION', 'CONTRE_PROPOSITION') AND LENGTH(motivation) >= 1)
      OR (type IN ('RESERVE', 'REFUS_MOTIVE', 'QUESTION') AND LENGTH(motivation) >= 50)
    )
);

CREATE INDEX IF NOT EXISTS "idx_feedback_stakeholder_date"
  ON "use_case_feedback" ("stakeholderId", "dateAvis" DESC);

CREATE INDEX IF NOT EXISTS "idx_feedback_auteur"
  ON "use_case_feedback" ("auteurUserId");

CREATE INDEX IF NOT EXISTS "idx_feedback_consultation"
  ON "use_case_feedback" ("consultationId");

-- -----------------------------------------------------------------------------
--  5. TABLE use_case_status_history
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "use_case_status_history" (
  "id"                TEXT PRIMARY KEY,
  "casUsageId"        TEXT NOT NULL,
  "statusFrom"        "UseCaseStatus",
  "statusTo"          "UseCaseStatus" NOT NULL,
  "motif"             TEXT,
  "auteurUserId"      TEXT NOT NULL,
  "auteurNom"         TEXT NOT NULL,
  "auteurInstitution" TEXT NOT NULL,
  "dateTransition"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pieceJustif"       TEXT,

  CONSTRAINT "fk_statushistory_casusage"
    FOREIGN KEY ("casUsageId") REFERENCES "CasUsageMVP"("id") ON DELETE CASCADE,

  CONSTRAINT "fk_statushistory_auteur"
    FOREIGN KEY ("auteurUserId") REFERENCES "User"("id")
);

CREATE INDEX IF NOT EXISTS "idx_statushistory_casusage_date"
  ON "use_case_status_history" ("casUsageId", "dateTransition" DESC);

CREATE INDEX IF NOT EXISTS "idx_statushistory_auteur"
  ON "use_case_status_history" ("auteurUserId");

-- Trigger d'inaltérabilité : aucune UPDATE ni DELETE autorisée sur le journal
CREATE OR REPLACE FUNCTION prevent_status_history_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'use_case_status_history est inalterable : UPDATE/DELETE interdit';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_statushistory_update ON "use_case_status_history";
CREATE TRIGGER trg_prevent_statushistory_update
  BEFORE UPDATE OR DELETE ON "use_case_status_history"
  FOR EACH ROW EXECUTE FUNCTION prevent_status_history_modification();

-- -----------------------------------------------------------------------------
--  6. TABLE notification
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "notification" (
  "id"            TEXT PRIMARY KEY,
  "userId"        TEXT NOT NULL,
  "institutionId" TEXT,
  "type"          TEXT NOT NULL,
  "titre"         TEXT NOT NULL,
  "message"       TEXT NOT NULL,
  "lienUrl"       TEXT,
  "refType"       TEXT,
  "refId"         TEXT,
  "lu"            BOOLEAN NOT NULL DEFAULT FALSE,
  "dateLu"        TIMESTAMP(3),
  "dateCreation"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "fk_notification_user"
    FOREIGN KEY ("userId") REFERENCES "User"("id"),

  CONSTRAINT "fk_notification_institution"
    FOREIGN KEY ("institutionId") REFERENCES "Institution"("id")
);

CREATE INDEX IF NOT EXISTS "idx_notification_user_lu_date"
  ON "notification" ("userId", "lu", "dateCreation" DESC);

CREATE INDEX IF NOT EXISTS "idx_notification_institution_date"
  ON "notification" ("institutionId", "dateCreation" DESC);

-- -----------------------------------------------------------------------------
--  7. COLONNE ADDITIONNELLE SUR CasUsageMVP (optionnelle)
-- -----------------------------------------------------------------------------
--  Si le modèle CasUsageMVP existant ne possède pas déjà un champ de statut
--  couvrant les 10 états du workflow Vue 360°, on peut ajouter une colonne
--  dédiée pour ne pas altérer la sémantique existante.

DO $$ BEGIN
  ALTER TABLE "CasUsageMVP"
    ADD COLUMN IF NOT EXISTS "statutVueSection" "UseCaseStatus" NOT NULL DEFAULT 'DECLARE';
EXCEPTION
  WHEN undefined_table THEN RAISE NOTICE 'Table CasUsageMVP introuvable — vérifier le nom réel';
  WHEN duplicate_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "idx_casusage_statutvue"
  ON "CasUsageMVP" ("statutVueSection");

-- -----------------------------------------------------------------------------
--  8. MIGRATION FONCTIONNELLE DES DONNÉES EXISTANTES
-- -----------------------------------------------------------------------------
--  Pour chaque CasUsageMVP existant, créer les UseCaseStakeholder à partir
--  des FluxInstitution.
--
--  ATTENTION : adapter les noms de colonnes aux conventions réelles du schéma
--  existant (institutionInitiatriceId, sourceInstitutionId, cibleInstitutionId).
--  À vérifier avant exécution — le bloc est fourni à titre indicatif.
-- -----------------------------------------------------------------------------

-- 8.1 Initiateurs
-- INSERT INTO "use_case_stakeholder" ("id", "casUsageId", "institutionId", "role", "autoSaisine", "actif")
-- SELECT
--   md5(random()::text || clock_timestamp()::text),
--   c."id",
--   c."institutionInitiatriceId",
--   'INITIATEUR'::"UseCaseRole",
--   FALSE,
--   TRUE
-- FROM "CasUsageMVP" c
-- WHERE c."institutionInitiatriceId" IS NOT NULL
-- ON CONFLICT ("casUsageId", "institutionId", "role") DO NOTHING;

-- 8.2 Fournisseurs (via FluxInstitution.sourceInstitutionId)
-- INSERT INTO "use_case_stakeholder" ("id", "casUsageId", "institutionId", "role", "autoSaisine", "actif")
-- SELECT DISTINCT
--   md5(random()::text || clock_timestamp()::text || f."id"),
--   f."casUsageId",
--   f."sourceInstitutionId",
--   'FOURNISSEUR'::"UseCaseRole",
--   FALSE,
--   TRUE
-- FROM "FluxInstitution" f
-- WHERE f."sourceInstitutionId" IS NOT NULL
-- ON CONFLICT ("casUsageId", "institutionId", "role") DO NOTHING;

-- 8.3 Consommateurs (via FluxInstitution.cibleInstitutionId)
-- INSERT INTO "use_case_stakeholder" ("id", "casUsageId", "institutionId", "role", "autoSaisine", "actif")
-- SELECT DISTINCT
--   md5(random()::text || clock_timestamp()::text || f."id"),
--   f."casUsageId",
--   f."cibleInstitutionId",
--   'CONSOMMATEUR'::"UseCaseRole",
--   FALSE,
--   TRUE
-- FROM "FluxInstitution" f
-- WHERE f."cibleInstitutionId" IS NOT NULL
-- ON CONFLICT ("casUsageId", "institutionId", "role") DO NOTHING;

-- Les blocs de migration fonctionnelle sont COMMENTÉS par défaut.
-- Les décommenter après vérification des noms de colonnes réels.

COMMIT;

-- =============================================================================
--  VALIDATIONS POST-MIGRATION
-- =============================================================================
--  Rejouer les requêtes suivantes pour vérifier le résultat :
--
--  SELECT COUNT(*) AS nb_stakeholders FROM use_case_stakeholder;
--  SELECT role, COUNT(*) FROM use_case_stakeholder GROUP BY role;
--  SELECT c.id, c.titre, COUNT(s.id) AS nb_parties
--    FROM "CasUsageMVP" c LEFT JOIN use_case_stakeholder s ON s."casUsageId" = c.id
--    GROUP BY c.id, c.titre ORDER BY nb_parties DESC LIMIT 20;
-- =============================================================================
