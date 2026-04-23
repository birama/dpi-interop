-- =============================================================================
--  MIGRATION SQL ADDITIONNELLE — DPI-INTEROP
--  Lien Cas d'usage ↔ Référentiels nationaux
--  Addendum : MCTN/DU/APP-DPI-INTEROP/CONC-2026-02-A1
--  Version  : 1.1 — 22 avril 2026
--  Base     : PostgreSQL 14+
--
--  À rejouer APRÈS la migration principale (migration.sql).
--  Présuppose l'existence de la table RegistreNational dans le schéma existant.
--  Idempotente et non destructive.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
--  1. ÉNUMÉRATION
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "RegistreUsageMode" AS ENUM ('CONSOMME', 'ALIMENTE', 'CREE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- -----------------------------------------------------------------------------
--  2. TABLE cas_usage_registre
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "cas_usage_registre" (
  "id"               TEXT PRIMARY KEY,
  "casUsageId"       TEXT NOT NULL,
  "registreId"       TEXT NOT NULL,
  "mode"             "RegistreUsageMode" NOT NULL,
  "champsConcernes"  JSONB,
  "commentaire"      TEXT,
  "volumetrieEst"    TEXT,
  "criticite"        TEXT,
  "dateAjout"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ajoutePar"        TEXT,

  CONSTRAINT "cas_usage_registre_unique"
    UNIQUE ("casUsageId", "registreId", "mode"),

  CONSTRAINT "fk_cur_casusage"
    FOREIGN KEY ("casUsageId") REFERENCES "CasUsageMVP"("id") ON DELETE CASCADE,

  CONSTRAINT "fk_cur_registre"
    FOREIGN KEY ("registreId") REFERENCES "RegistreNational"("id"),

  CONSTRAINT "fk_cur_ajoutepar"
    FOREIGN KEY ("ajoutePar") REFERENCES "User"("id"),

  CONSTRAINT "chk_cur_criticite"
    CHECK (criticite IS NULL OR criticite IN ('FAIBLE','MOYENNE','CRITIQUE'))
);

CREATE INDEX IF NOT EXISTS "idx_cur_registre_mode"
  ON "cas_usage_registre" ("registreId", "mode");

CREATE INDEX IF NOT EXISTS "idx_cur_casusage"
  ON "cas_usage_registre" ("casUsageId");

-- -----------------------------------------------------------------------------
--  3. VUE DE COUVERTURE PAR RÉFÉRENTIEL (helper de reporting)
-- -----------------------------------------------------------------------------
--  Facilite les requêtes du dashboard "Couverture par référentiel".
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW "v_couverture_registre" AS
SELECT
  r."id"                                            AS registre_id,
  r."code"                                          AS registre_code,
  r."libelle"                                       AS registre_libelle,
  cur."mode",
  COUNT(DISTINCT cur."casUsageId")                  AS nb_cas_usage,
  COUNT(DISTINCT c."institutionInitiatriceId")      AS nb_initiateurs,
  ARRAY_AGG(DISTINCT c."id")                        AS cas_usage_ids
FROM "RegistreNational" r
LEFT JOIN "cas_usage_registre" cur ON cur."registreId" = r."id"
LEFT JOIN "CasUsageMVP" c          ON c."id" = cur."casUsageId"
GROUP BY r."id", r."code", r."libelle", cur."mode";

-- NOTE : adapter les noms de colonnes (code, libelle, institutionInitiatriceId)
-- aux conventions réelles du schéma existant si différentes.

COMMIT;

-- =============================================================================
--  REQUÊTES DE CONTRÔLE
-- =============================================================================
--
--  -- Combien de cas d'usage touchent chaque référentiel ?
--  SELECT registre_code, mode, nb_cas_usage
--    FROM v_couverture_registre
--    ORDER BY nb_cas_usage DESC;
--
--  -- Quels cas d'usage consomment NINEA ?
--  SELECT c.id, c.titre, cur."mode", cur."champsConcernes"
--    FROM cas_usage_registre cur
--    JOIN "CasUsageMVP" c ON c.id = cur."casUsageId"
--    JOIN "RegistreNational" r ON r.id = cur."registreId"
--    WHERE r.code = 'NINEA';
--
--  -- Détection de doublons potentiels : deux cas d'usage touchant les mêmes
--  -- champs du même référentiel en mode CONSOMME
--  SELECT r.code, a."casUsageId" AS uc1, b."casUsageId" AS uc2
--    FROM cas_usage_registre a
--    JOIN cas_usage_registre b
--      ON a."registreId" = b."registreId"
--     AND a."mode" = b."mode"
--     AND a."casUsageId" < b."casUsageId"
--     AND a."champsConcernes" ?| (SELECT jsonb_array_elements_text(b."champsConcernes"))
--    JOIN "RegistreNational" r ON r.id = a."registreId";
-- =============================================================================
