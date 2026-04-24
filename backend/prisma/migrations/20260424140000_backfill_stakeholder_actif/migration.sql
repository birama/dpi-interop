-- Migration : hotfix défensif après P7 (régression visibilité INITIATEUR sur PINS-CU-026)
-- Objectif : garantir que tout stakeholder préexistant a un actif explicitement TRUE,
-- peu importe comment il a été créé (avant ou après la migration P7).

-- 1. Backfill : toute ligne avec actif NULL (anomalie théorique) passe à TRUE
UPDATE "use_case_stakeholder"
SET "actif" = TRUE
WHERE "actif" IS NULL;

-- 2. Garantir actif=TRUE pour tous les INITIATEUR (un initiateur n'est jamais inactif,
--    et ne peut pas etre evince ni se retirer : sa presence comme stakeholder actif
--    est constitutive de l'existence du cas d'usage)
UPDATE "use_case_stakeholder"
SET "actif" = TRUE,
    "dateRetrait" = NULL,
    "motifRetrait" = NULL,
    "retireParUserId" = NULL,
    "evictionParDU" = FALSE,
    "evictionMotif" = NULL
WHERE "role" = 'INITIATEUR' AND (
  "actif" = FALSE
  OR "dateRetrait" IS NOT NULL
  OR "evictionParDU" = TRUE
);

-- 3. La colonne etait deja NOT NULL DEFAULT TRUE (cf. migration 20260422120000)
--    donc aucune modif de schema necessaire. Ce fichier n'est qu'un filet de securite data.
