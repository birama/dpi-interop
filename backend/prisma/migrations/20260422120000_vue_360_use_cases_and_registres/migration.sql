-- =============================================================================
--  MIGRATION — Vue 360° des cas d'usage PINS + Registres (addendum v1.1)
--  Référence : MCTN/DU/APP-DPI-INTEROP/CONC-2026-02
--  Version   : 1.0+1.1 - 22 avril 2026
--  Base      : PostgreSQL 14+
--  IDEMPOTENTE et NON DESTRUCTIVE
-- =============================================================================

-- -----------------------------------------------------------------------------
--  1. ÉNUMÉRATIONS
-- -----------------------------------------------------------------------------

CREATE TYPE "UseCaseRole" AS ENUM ('INITIATEUR', 'FOURNISSEUR', 'CONSOMMATEUR', 'PARTIE_PRENANTE');

CREATE TYPE "UseCaseStatus" AS ENUM (
  'DECLARE', 'EN_CONSULTATION', 'VALIDATION_CONJOINTE',
  'QUALIFIE', 'PRIORISE', 'FINANCEMENT_OK', 'CONVENTIONNE',
  'EN_PRODUCTION_360', 'SUSPENDU_360', 'RETIRE'
);

CREATE TYPE "FeedbackType" AS ENUM (
  'VALIDATION', 'RESERVE', 'REFUS_MOTIVE', 'QUESTION', 'CONTRE_PROPOSITION'
);

CREATE TYPE "ConsultationStatus" AS ENUM ('EN_ATTENTE', 'REPONDU', 'ECHU', 'ANNULE');

CREATE TYPE "RegistreUsageMode" AS ENUM ('CONSOMME', 'ALIMENTE', 'CREE');

-- -----------------------------------------------------------------------------
--  2. COLONNE statutVueSection + resumeMetier + baseLegale SUR CasUsageMVP
-- -----------------------------------------------------------------------------

ALTER TABLE "cas_usage_mvp" ADD COLUMN "statutVueSection" "UseCaseStatus" NOT NULL DEFAULT 'DECLARE';
ALTER TABLE "cas_usage_mvp" ADD COLUMN "resumeMetier" TEXT;
ALTER TABLE "cas_usage_mvp" ADD COLUMN "baseLegale" TEXT;

CREATE INDEX "cas_usage_mvp_statutVueSection_idx" ON "cas_usage_mvp"("statutVueSection");

-- -----------------------------------------------------------------------------
--  3. TABLE use_case_stakeholder
-- -----------------------------------------------------------------------------

CREATE TABLE "use_case_stakeholder" (
  "id"             TEXT NOT NULL,
  "casUsageId"     TEXT NOT NULL,
  "institutionId"  TEXT NOT NULL,
  "role"           "UseCaseRole" NOT NULL,
  "autoSaisine"    BOOLEAN NOT NULL DEFAULT FALSE,
  "dateAjout"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ajoutePar"      TEXT,
  "actif"          BOOLEAN NOT NULL DEFAULT TRUE,
  "dateRetrait"    TIMESTAMP(3),
  "motifRetrait"   TEXT,

  CONSTRAINT "use_case_stakeholder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "use_case_stakeholder_casUsageId_institutionId_role_key" UNIQUE ("casUsageId", "institutionId", "role"),
  CONSTRAINT "use_case_stakeholder_casUsageId_fkey" FOREIGN KEY ("casUsageId") REFERENCES "cas_usage_mvp"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "use_case_stakeholder_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "use_case_stakeholder_ajoutePar_fkey" FOREIGN KEY ("ajoutePar") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "use_case_stakeholder_institutionId_role_actif_idx" ON "use_case_stakeholder"("institutionId", "role", "actif");
CREATE INDEX "use_case_stakeholder_casUsageId_actif_idx" ON "use_case_stakeholder"("casUsageId", "actif");

-- -----------------------------------------------------------------------------
--  4. TABLE use_case_consultation
-- -----------------------------------------------------------------------------

CREATE TABLE "use_case_consultation" (
  "id"               TEXT NOT NULL,
  "stakeholderId"    TEXT NOT NULL,
  "dateDemande"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dateEcheance"     TIMESTAMP(3) NOT NULL,
  "status"           "ConsultationStatus" NOT NULL DEFAULT 'EN_ATTENTE',
  "relances"         INTEGER NOT NULL DEFAULT 0,
  "derniereRelance"  TIMESTAMP(3),
  "ouvertePar"       TEXT NOT NULL,
  "motifSollicit"    TEXT,

  CONSTRAINT "use_case_consultation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "use_case_consultation_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "use_case_stakeholder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "use_case_consultation_ouvertePar_fkey" FOREIGN KEY ("ouvertePar") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "use_case_consultation_stakeholderId_idx" ON "use_case_consultation"("stakeholderId");
CREATE INDEX "use_case_consultation_status_dateEcheance_idx" ON "use_case_consultation"("status", "dateEcheance");

-- -----------------------------------------------------------------------------
--  5. TABLE use_case_feedback
-- -----------------------------------------------------------------------------

CREATE TABLE "use_case_feedback" (
  "id"                    TEXT NOT NULL,
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

  CONSTRAINT "use_case_feedback_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "use_case_feedback_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "use_case_consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "use_case_feedback_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "use_case_stakeholder"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "use_case_feedback_auteurUserId_fkey" FOREIGN KEY ("auteurUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "use_case_feedback_amendeDe_fkey" FOREIGN KEY ("amendeDe") REFERENCES "use_case_feedback"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "chk_feedback_motivation_length" CHECK (
    ("type" IN ('VALIDATION', 'CONTRE_PROPOSITION') AND LENGTH("motivation") >= 1)
    OR ("type" IN ('RESERVE', 'REFUS_MOTIVE', 'QUESTION') AND LENGTH("motivation") >= 50)
  )
);

CREATE INDEX "use_case_feedback_stakeholderId_dateAvis_idx" ON "use_case_feedback"("stakeholderId", "dateAvis" DESC);
CREATE INDEX "use_case_feedback_auteurUserId_idx" ON "use_case_feedback"("auteurUserId");
CREATE INDEX "use_case_feedback_consultationId_idx" ON "use_case_feedback"("consultationId");

-- -----------------------------------------------------------------------------
--  6. TABLE use_case_status_history (JOURNAL INALTÉRABLE)
-- -----------------------------------------------------------------------------

CREATE TABLE "use_case_status_history" (
  "id"                TEXT NOT NULL,
  "casUsageId"        TEXT NOT NULL,
  "statusFrom"        "UseCaseStatus",
  "statusTo"          "UseCaseStatus" NOT NULL,
  "motif"             TEXT,
  "auteurUserId"      TEXT NOT NULL,
  "auteurNom"         TEXT NOT NULL,
  "auteurInstitution" TEXT NOT NULL,
  "dateTransition"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pieceJustif"       TEXT,

  CONSTRAINT "use_case_status_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "use_case_status_history_casUsageId_fkey" FOREIGN KEY ("casUsageId") REFERENCES "cas_usage_mvp"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "use_case_status_history_auteurUserId_fkey" FOREIGN KEY ("auteurUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "use_case_status_history_casUsageId_dateTransition_idx" ON "use_case_status_history"("casUsageId", "dateTransition" DESC);
CREATE INDEX "use_case_status_history_auteurUserId_idx" ON "use_case_status_history"("auteurUserId");

-- Trigger d'inaltérabilité : aucune UPDATE ni DELETE autorisée sur le journal
CREATE OR REPLACE FUNCTION prevent_status_history_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'use_case_status_history est inalterable : UPDATE/DELETE interdit';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_statushistory_update
  BEFORE UPDATE OR DELETE ON "use_case_status_history"
  FOR EACH ROW EXECUTE FUNCTION prevent_status_history_modification();

-- -----------------------------------------------------------------------------
--  7. TABLE notification
-- -----------------------------------------------------------------------------

CREATE TABLE "notification" (
  "id"            TEXT NOT NULL,
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

  CONSTRAINT "notification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "notification_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "notification_userId_lu_dateCreation_idx" ON "notification"("userId", "lu", "dateCreation" DESC);
CREATE INDEX "notification_institutionId_dateCreation_idx" ON "notification"("institutionId", "dateCreation" DESC);

-- -----------------------------------------------------------------------------
--  8. TABLE cas_usage_registre (Addendum v1.1)
-- -----------------------------------------------------------------------------

CREATE TABLE "cas_usage_registre" (
  "id"               TEXT NOT NULL,
  "casUsageId"       TEXT NOT NULL,
  "registreId"       TEXT NOT NULL,
  "mode"             "RegistreUsageMode" NOT NULL,
  "champsConcernes"  JSONB,
  "commentaire"      TEXT,
  "volumetrieEst"    TEXT,
  "criticite"        TEXT,
  "dateAjout"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ajoutePar"        TEXT,

  CONSTRAINT "cas_usage_registre_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "cas_usage_registre_casUsageId_registreId_mode_key" UNIQUE ("casUsageId", "registreId", "mode"),
  CONSTRAINT "cas_usage_registre_casUsageId_fkey" FOREIGN KEY ("casUsageId") REFERENCES "cas_usage_mvp"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "cas_usage_registre_registreId_fkey" FOREIGN KEY ("registreId") REFERENCES "registres_nationaux"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "cas_usage_registre_ajoutePar_fkey" FOREIGN KEY ("ajoutePar") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "chk_cur_criticite" CHECK ("criticite" IS NULL OR "criticite" IN ('FAIBLE','MOYENNE','CRITIQUE'))
);

CREATE INDEX "cas_usage_registre_registreId_mode_idx" ON "cas_usage_registre"("registreId", "mode");
CREATE INDEX "cas_usage_registre_casUsageId_idx" ON "cas_usage_registre"("casUsageId");

-- -----------------------------------------------------------------------------
--  9. VUE DE COUVERTURE PAR RÉFÉRENTIEL (helper de reporting)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW "v_couverture_registre" AS
SELECT
  r."id"                                      AS registre_id,
  r."code"                                    AS registre_code,
  r."nom"                                     AS registre_nom,
  r."institutionCode"                         AS detenteur_code,
  r."institutionNom"                          AS detenteur_nom,
  cur."mode",
  COUNT(DISTINCT cur."casUsageId")            AS nb_cas_usage,
  ARRAY_AGG(DISTINCT cu."institutionSourceCode") FILTER (WHERE cu."institutionSourceCode" IS NOT NULL) AS institutions_source
FROM "registres_nationaux" r
LEFT JOIN "cas_usage_registre" cur ON cur."registreId" = r."id"
LEFT JOIN "cas_usage_mvp" cu      ON cu."id" = cur."casUsageId"
GROUP BY r."id", r."code", r."nom", r."institutionCode", r."institutionNom", cur."mode";
