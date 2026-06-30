-- Enrichissement des 3 cas de la demo (5 mai 2026)
-- PINS-METIER-001, PINS-TECH-0002, PINS-TECH-0001
-- Source : Template_Flux_Interop_v2_PINS.xlsx
BEGIN;

-- ============================================================================
-- 1. PINS-METIER-001 — Creation d'entreprise au guichet unique APIX
-- ============================================================================

-- APIX (coordonnateur → INITIATEUR)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM institutions WHERE code = 'APIX'),
  'INITIATEUR',
  true,
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'APIX')
    AND role = 'INITIATEUR'
);

-- DGID (NINEA)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM institutions WHERE code = 'DGID'),
  'PARTIE_PRENANTE',
  true,
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'DGID')
    AND role = 'PARTIE_PRENANTE'
);

-- GREFFE (RCCM)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM institutions WHERE code = 'GREFFE'),
  'PARTIE_PRENANTE',
  true,
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'GREFFE')
    AND role = 'PARTIE_PRENANTE'
);

-- CSS
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM institutions WHERE code = 'CSS'),
  'PARTIE_PRENANTE',
  true,
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'CSS')
    AND role = 'PARTIE_PRENANTE'
);

-- IPRES
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM institutions WHERE code = 'IPRES'),
  'PARTIE_PRENANTE',
  true,
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'IPRES')
    AND role = 'PARTIE_PRENANTE'
);

-- ANSD
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM institutions WHERE code = 'ANSD'),
  'PARTIE_PRENANTE',
  true,
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'ANSD')
    AND role = 'PARTIE_PRENANTE'
);

-- ============================================================================
-- 2. PINS-TECH-0002 — Consultation declarations douanieres
-- ============================================================================

-- DGD (detenteur → FOURNISSEUR)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0002'),
  (SELECT id FROM institutions WHERE code = 'DGD'),
  'FOURNISSEUR',
  true,
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0002')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'DGD')
    AND role = 'FOURNISSEUR'
);

-- DGID (consommateur)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0002'),
  (SELECT id FROM institutions WHERE code = 'DGID'),
  'CONSOMMATEUR',
  true,
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0002')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'DGID')
    AND role = 'CONSOMMATEUR'
);

-- DGCPT (consommateur)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0002'),
  (SELECT id FROM institutions WHERE code = 'DGCPT'),
  'CONSOMMATEUR',
  true,
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0002')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'DGCPT')
    AND role = 'CONSOMMATEUR'
);

-- ============================================================================
-- 3. PINS-TECH-0001 — Verification eligibilite RNU
-- ============================================================================

-- DGPSN (detenteur → FOURNISSEUR)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0001'),
  (SELECT id FROM institutions WHERE code = 'DGPSN'),
  'FOURNISSEUR',
  true,
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0001')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'DGPSN')
    AND role = 'FOURNISSEUR'
);

-- SEN-CSU (consommateur)
INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, "actif", "dateAjout", "ajoutePar")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0001'),
  (SELECT id FROM institutions WHERE code = 'SEN-CSU'),
  'CONSOMMATEUR',
  true,
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM use_case_stakeholder
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0001')
    AND "institutionId" = (SELECT id FROM institutions WHERE code = 'SEN-CSU')
    AND role = 'CONSOMMATEUR'
);

-- ============================================================================
-- 4. RELATIONS — PINS-METIER-001 mobilise 4 services techniques
-- ============================================================================

-- PINS-TECH-0004 (Consultation NINEA)
INSERT INTO relation_cas_usage (id, "casUsageMetierId", "casUsageTechniqueId", ordre, obligatoire, commentaire, "createdAt", "createdBy")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004'),
  1, true, 'Consultation NINEA — prerequis a toute creation d''entreprise',
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM relation_cas_usage
  WHERE "casUsageMetierId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "casUsageTechniqueId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004')
);

-- PINS-TECH-0021 (Transmission RCCM)
INSERT INTO relation_cas_usage (id, "casUsageMetierId", "casUsageTechniqueId", ordre, obligatoire, commentaire, "createdAt", "createdBy")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0021'),
  2, true, 'Transmission RCCM Greffe → ANSD pour immatriculation',
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM relation_cas_usage
  WHERE "casUsageMetierId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "casUsageTechniqueId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0021')
);

-- PINS-TECH-0024 (Consultation casier judiciaire)
INSERT INTO relation_cas_usage (id, "casUsageMetierId", "casUsageTechniqueId", ordre, obligatoire, commentaire, "createdAt", "createdBy")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0024'),
  3, true, 'Verification casier judiciaire CNCJ pour inscription RCCM',
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM relation_cas_usage
  WHERE "casUsageMetierId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "casUsageTechniqueId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0024')
);

-- PINS-TECH-0025 (Transmission donnees sociales IPRES→CSS)
INSERT INTO relation_cas_usage (id, "casUsageMetierId", "casUsageTechniqueId", ordre, obligatoire, commentaire, "createdAt", "createdBy")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0025'),
  4, true, 'Affiliation sociale IPRES + CSS pour la nouvelle entreprise',
  NOW(),
  (SELECT id FROM users WHERE email = 'admin@senum.sn')
WHERE NOT EXISTS (
  SELECT 1 FROM relation_cas_usage
  WHERE "casUsageMetierId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "casUsageTechniqueId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0025')
);

-- Verification finale
DO $$
DECLARE
  v_metier_stakeholders int;
  v_tech2_stakeholders int;
  v_tech1_stakeholders int;
  v_relations int;
BEGIN
  SELECT COUNT(*) INTO v_metier_stakeholders FROM use_case_stakeholder
    WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001');
  SELECT COUNT(*) INTO v_tech2_stakeholders FROM use_case_stakeholder
    WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0002');
  SELECT COUNT(*) INTO v_tech1_stakeholders FROM use_case_stakeholder
    WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0001');
  SELECT COUNT(*) INTO v_relations FROM relation_cas_usage
    WHERE "casUsageMetierId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001');

  RAISE NOTICE 'PINS-METIER-001: % stakeholders', v_metier_stakeholders;
  RAISE NOTICE 'PINS-TECH-0002: % stakeholders', v_tech2_stakeholders;
  RAISE NOTICE 'PINS-TECH-0001: % stakeholders', v_tech1_stakeholders;
  RAISE NOTICE 'Relations PINS-METIER-001: %', v_relations;
END $$;

COMMIT;
