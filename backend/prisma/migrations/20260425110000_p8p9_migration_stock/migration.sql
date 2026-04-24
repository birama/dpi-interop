-- Migration data P8+P9 — basculement du stock historique
--
-- Critere d'identification d'un cas d'usage "actif" (a NE PAS migrer en PROPOSE) :
--   (a) code explicitement preserve : PINS-CU-008, 011, 012, 019, 026
--   (b) statutVueSection differe de DECLARE (pipeline a deja avance)
--   (c) statutImpl differe de IDENTIFIE (implementation a demarre)
--   (d) au moins 1 stakeholder actif avec role INITIATEUR/FOURNISSEUR/CONSOMMATEUR
--   (e) au moins 1 consultation ouverte (quel que soit son status)
--   (f) au moins 1 feedback emis
--
-- Tout CU ne correspondant a AUCUN de ces criteres est considere comme dormant
-- et bascule en PROPOSE + sourceProposition='ETUDE_SENUM' + niveauMaturite='ESQUISSE'.
-- La typologie reste TECHNIQUE (deja defaut). Une transition inalterable est tracee.

-- =========================================================================
-- 1. BACKFILL TYPOLOGIE SUR LES CU EXISTANTS
-- =========================================================================
-- Le DEFAULT 'TECHNIQUE' sur l'ALTER TABLE a deja rempli les lignes.
-- On re-applique par securite au cas ou des NULL seraient presents
-- (theoriquement impossible car la colonne est NOT NULL).
UPDATE "cas_usage_mvp"
SET "typologie" = 'TECHNIQUE'
WHERE "typologie" IS NULL;

-- =========================================================================
-- 2. BASCULEMENT DES CU DORMANTS VERS PROPOSE
-- =========================================================================

WITH cu_actifs AS (
  SELECT DISTINCT cu.id
  FROM "cas_usage_mvp" cu
  WHERE
    -- (a) whitelist explicite
    cu."code" IN ('PINS-CU-008', 'PINS-CU-011', 'PINS-CU-012', 'PINS-CU-019', 'PINS-CU-026')
    -- (b) pipeline Vue 360 a avance
    OR cu."statutVueSection" <> 'DECLARE'
    -- (c) implementation a demarre
    OR cu."statutImpl" <> 'IDENTIFIE'
    -- (d) stakeholder actif avec role operationnel
    OR EXISTS (
      SELECT 1 FROM "use_case_stakeholder" s
      WHERE s."casUsageId" = cu."id"
        AND s."actif" = TRUE
        AND s."role" IN ('INITIATEUR', 'FOURNISSEUR', 'CONSOMMATEUR')
    )
    -- (e) consultation ouverte
    OR EXISTS (
      SELECT 1 FROM "use_case_consultation" c
      JOIN "use_case_stakeholder" s ON c."stakeholderId" = s."id"
      WHERE s."casUsageId" = cu."id"
    )
    -- (f) feedback emis
    OR EXISTS (
      SELECT 1 FROM "use_case_feedback" f
      JOIN "use_case_stakeholder" s ON f."stakeholderId" = s."id"
      WHERE s."casUsageId" = cu."id"
    )
)
UPDATE "cas_usage_mvp"
SET
  "statutVueSection"     = 'PROPOSE',
  "sourceProposition"    = 'ETUDE_SENUM',
  "sourceDetail"         = 'Cas d''usage issu du seed MVP 0, catalogue historique',
  "niveauMaturite"       = 'ESQUISSE'
WHERE
  "id" NOT IN (SELECT id FROM cu_actifs)
  -- Idempotence : ne pas re-migrer ce qui l'est deja
  AND "statutVueSection" <> 'PROPOSE';

-- =========================================================================
-- 3. TRACE INALTERABLE : une transition par CU migre
-- =========================================================================
-- NB : le trigger prevent_status_history_modification bloque UPDATE/DELETE
-- sur use_case_status_history mais autorise INSERT. C'est voulu.
-- Auteur technique : premier ADMIN du systeme (admin@senum.sn en prod).

INSERT INTO "use_case_status_history" (
  "id", "casUsageId", "statusFrom", "statusTo", "motif",
  "auteurUserId", "auteurNom", "auteurInstitution", "dateTransition"
)
SELECT
  -- CUID-like id (fallback via gen_random_uuid si pgcrypto dispo, sinon hash)
  CONCAT('mig-p8p9-', SUBSTRING(MD5(RANDOM()::TEXT || cu."id"), 1, 20)),
  cu."id",
  'DECLARE'::"UseCaseStatus",
  'PROPOSE'::"UseCaseStatus",
  'Migration — basculement en catalogue des propositions (livraison du 25/04/2026)',
  COALESCE(
    (SELECT "id" FROM "users" WHERE "email" = 'admin@senum.sn' LIMIT 1),
    (SELECT "id" FROM "users" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1)
  ),
  'Système — Migration catalogue',
  'Delivery Unit — MCTN',
  NOW()
FROM "cas_usage_mvp" cu
WHERE
  cu."statutVueSection" = 'PROPOSE'
  -- Idempotence : ne pas re-tracer si deja trace
  AND NOT EXISTS (
    SELECT 1 FROM "use_case_status_history" h
    WHERE h."casUsageId" = cu."id"
      AND h."statusTo" = 'PROPOSE'
      AND h."motif" LIKE 'Migration — basculement en catalogue%'
  )
  -- Safety : si aucun ADMIN n'existe, on n'insere rien (migration data ok mais
  -- pas de trace, user pourra la re-generer manuellement apres seed admin)
  AND EXISTS (SELECT 1 FROM "users" WHERE "role" = 'ADMIN');

-- =========================================================================
-- 4. RAPPEL DES REQUETES DE VERIFICATION (a lancer apres migration)
-- =========================================================================
-- SELECT "typologie", COUNT(*) FROM "cas_usage_mvp" GROUP BY "typologie";
-- SELECT "sourceProposition", COUNT(*) FROM "cas_usage_mvp" GROUP BY "sourceProposition";
-- SELECT "statutVueSection", COUNT(*) FROM "cas_usage_mvp" GROUP BY "statutVueSection";
--
-- Sanity check whitelist :
-- SELECT "code", "statutVueSection", "typologie", "sourceProposition"
-- FROM "cas_usage_mvp"
-- WHERE "code" IN ('PINS-CU-008','PINS-CU-011','PINS-CU-012','PINS-CU-019','PINS-CU-026');
-- => 5 lignes, AUCUNE en statut PROPOSE
