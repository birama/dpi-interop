-- Enrichissement PINS-TECH-0004 — Consultation NINEA (ANSD detenteur)
-- Source: Template Excel + mapping Birama
BEGIN;

-- ANSD (detenteur → FOURNISSEUR)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004'),
  (SELECT id FROM institutions WHERE code = 'ANSD'),
  'FOURNISSEUR',
  true, NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'ANSD')
    AND role = 'FOURNISSEUR'
);

-- DGID (consommateur)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004'),
  (SELECT id FROM institutions WHERE code = 'DGID'),
  'CONSOMMATEUR',
  true, NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'DGID')
    AND role = 'CONSOMMATEUR'
);

-- DGD (consommateur)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004'),
  (SELECT id FROM institutions WHERE code = 'DGD'),
  'CONSOMMATEUR',
  true, NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'DGD')
    AND role = 'CONSOMMATEUR'
);

-- DGCPT (consommateur)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004'),
  (SELECT id FROM institutions WHERE code = 'DGCPT'),
  'CONSOMMATEUR',
  true, NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'DGCPT')
    AND role = 'CONSOMMATEUR'
);

-- IPRES (consommateur)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004'),
  (SELECT id FROM institutions WHERE code = 'IPRES'),
  'CONSOMMATEUR',
  true, NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'IPRES')
    AND role = 'CONSOMMATEUR'
);

-- CSS (consommateur)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004'),
  (SELECT id FROM institutions WHERE code = 'CSS'),
  'CONSOMMATEUR',
  true, NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'CSS')
    AND role = 'CONSOMMATEUR'
);

-- APIX (consommateur)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004'),
  (SELECT id FROM institutions WHERE code = 'APIX'),
  'CONSOMMATEUR',
  true, NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'APIX')
    AND role = 'CONSOMMATEUR'
);

-- ARCOP (consommateur)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004'),
  (SELECT id FROM institutions WHERE code = 'ARCOP'),
  'CONSOMMATEUR',
  true, NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'ARCOP')
    AND role = 'CONSOMMATEUR'
);

-- Verification
SELECT c.code, COUNT(s.id) AS nb
FROM cas_usage_mvp c
LEFT JOIN use_case_stakeholder s ON s."casUsageId" = c.id AND s.actif = true
WHERE c.code IN ('PINS-METIER-001','PINS-TECH-0001','PINS-TECH-0002','PINS-TECH-0004')
GROUP BY c.code ORDER BY c.code;

COMMIT;
