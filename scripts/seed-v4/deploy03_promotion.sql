-- DEPLOY-03 — Promotion 9 cas démo atelier 19 mai 2026
-- 6 cas métier (PINS-PROP-MET-*) → PINS-METIER-* + PRIORISE + aFinancer=true
-- 3 cas tech  (PINS-PROP-TECH-*) → PINS-TECH-*   + PRIORISE + aFinancer=true
-- Transaction atomique, rollback automatique en cas d'échec

BEGIN;

-- ===== 6 CAS MÉTIER =====
WITH next_metier AS (
  SELECT COALESCE(MAX(CAST(substring(code from 'PINS-METIER-(\d+)') AS INTEGER)), 0) AS m
  FROM cas_usage_mvp WHERE code LIKE 'PINS-METIER-%'
),
cas_met AS (
  SELECT id, code, ROW_NUMBER() OVER (ORDER BY code) AS rn
  FROM cas_usage_mvp
  WHERE code IN (
    'PINS-PROP-MET-042','PINS-PROP-MET-044','PINS-PROP-MET-046',
    'PINS-PROP-MET-050','PINS-PROP-MET-061','PINS-PROP-MET-065'
  )
)
UPDATE cas_usage_mvp c
SET
  code = 'PINS-METIER-' || lpad(((SELECT m FROM next_metier) + cm.rn)::text, 3, '0'),
  "codeHistorique" = CASE
    WHEN c."codeHistorique" IS NULL OR c."codeHistorique" = '' THEN c.code
    ELSE c."codeHistorique" || ', ' || c.code
  END,
  "statutVueSection" = 'PRIORISE',
  "aFinancer" = true,
  "updatedAt" = NOW()
FROM cas_met cm
WHERE c.id = cm.id;

-- ===== 3 CAS TECHNIQUE =====
WITH next_tech AS (
  SELECT COALESCE(MAX(CAST(substring(code from 'PINS-TECH-(\d+)') AS INTEGER)), 0) AS m
  FROM cas_usage_mvp WHERE code LIKE 'PINS-TECH-%'
),
cas_tech AS (
  SELECT id, code, ROW_NUMBER() OVER (ORDER BY code) AS rn
  FROM cas_usage_mvp
  WHERE code IN (
    'PINS-PROP-TECH-040','PINS-PROP-TECH-110','PINS-PROP-TECH-130'
  )
)
UPDATE cas_usage_mvp c
SET
  code = 'PINS-TECH-' || lpad(((SELECT m FROM next_tech) + ct.rn)::text, 4, '0'),
  "codeHistorique" = CASE
    WHEN c."codeHistorique" IS NULL OR c."codeHistorique" = '' THEN c.code
    ELSE c."codeHistorique" || ', ' || c.code
  END,
  "statutVueSection" = 'PRIORISE',
  "aFinancer" = true,
  "updatedAt" = NOW()
FROM cas_tech ct
WHERE c.id = ct.id;

COMMIT;

-- ===== VÉRIFICATIONS POST =====
SELECT 'PRIORISE_TOTAL' AS m, COUNT(*)::text AS v FROM cas_usage_mvp WHERE "statutVueSection" = 'PRIORISE'
UNION ALL SELECT 'AFINANCER', COUNT(*)::text FROM cas_usage_mvp WHERE "aFinancer" = true
UNION ALL SELECT 'DOMAINES_PRIORISES', COUNT(DISTINCT domaine)::text FROM cas_usage_mvp WHERE "statutVueSection" = 'PRIORISE' AND domaine IS NOT NULL;
