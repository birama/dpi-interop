-- Qualification des 3 cas d'usage du MVP 2.0 JICA/Accenture
-- Source : atelier du 30 juillet 2026 (Introduction_Meeting_0_2_FR.pptx)
-- Idempotent : chaque bloc vérifie l'état cible avant d'agir.

-- ============================================================================
-- CU1 — PINS-METIER-001 — Accélération de l'immatriculation des entreprises
-- ============================================================================

UPDATE cas_usage_mvp SET "statutImpl" = 'EN_DEVELOPPEMENT',
  description = 'Dépôt en ligne du dossier APIX, vérification casier des dirigeants, immatriculation RCCM, attribution NINEA, déclaration fiscale initiale, affiliation CSS et IPRES. Problème : duplication de saisie, partage manuel ANSD, déplacements multiples. Délais observés : 2 à 5 jours, 1 à 3 jours, 1 à 2 jours selon l''étape.'
WHERE code = 'PINS-METIER-001' AND ("statutImpl" != 'EN_DEVELOPPEMENT' OR description IS NULL OR description NOT LIKE '%duplication de saisie%');

-- Stakeholders CU1 : supprimer puis recréer (idempotent via DELETE conditionnel)
DELETE FROM use_case_stakeholder
WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001');

INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, actif, "dateAjout")
SELECT gen_random_uuid(), cu.id, i.id, r.role::"UseCaseRole", true, NOW()
FROM (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001') cu
CROSS JOIN (VALUES
  ('APIX', 'INITIATEUR'), ('APIX', 'FOURNISSEUR'),
  ('MJ', 'CONSOMMATEUR'), ('GREFFE', 'CONSOMMATEUR'),
  ('ANSD', 'CONSOMMATEUR'), ('DGID', 'CONSOMMATEUR'),
  ('CSS', 'PARTIE_PRENANTE'), ('IPRES', 'PARTIE_PRENANTE')
) AS r(inst_code, role)
JOIN institutions i ON i.code = r.inst_code;

-- Registre REG-CASIER pour CU1
INSERT INTO cas_usage_registre (id, "casUsageId", "registreId", mode, "dateAjout")
SELECT gen_random_uuid(), (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
       (SELECT id FROM registres_nationaux WHERE code = 'REG-CASIER'), 'CONSOMME', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM cas_usage_registre
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "registreId" = (SELECT id FROM registres_nationaux WHERE code = 'REG-CASIER')
    AND mode = 'CONSOMME'
);

-- ============================================================================
-- CU2 — PINS-METIER-550 — Audits fiscaux et douaniers des entités juridiques
-- ============================================================================

UPDATE cas_usage_mvp SET "statutImpl" = 'EN_DEVELOPPEMENT',
  description = 'Croisement des données NINEA (ANSD), RCCM et Casier judiciaire (Ministère de la Justice) pour les audits fiscaux (DGID) et douaniers (DGD). ⚠️ ÉLARGISSEMENT À RISQUE : l''ajout de la Justice comme fournisseur est l''extension la plus risquée du MVP 2.0 — aucun canal d''échange n''existe aujourd''hui entre PINS et les systèmes du Ministère de la Justice (ORBUS RCCM, SIGNAS Casier). Vérification actuellement fragmentée et manuelle.'
WHERE code = 'PINS-METIER-550' AND ("statutImpl" != 'EN_DEVELOPPEMENT' OR description NOT LIKE '%ÉLARGISSEMENT À RISQUE%');

-- Stakeholders CU2
DELETE FROM use_case_stakeholder
WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-550');

INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, actif, "dateAjout")
SELECT gen_random_uuid(), cu.id, i.id, r.role::"UseCaseRole", true, NOW()
FROM (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-550') cu
CROSS JOIN (VALUES
  ('ANSD', 'FOURNISSEUR'), ('MJ', 'FOURNISSEUR'),
  ('DGID', 'CONSOMMATEUR'), ('DGD', 'CONSOMMATEUR')
) AS r(inst_code, role)
JOIN institutions i ON i.code = r.inst_code;

-- Registres RCCM et REG-CASIER pour CU2
INSERT INTO cas_usage_registre (id, "casUsageId", "registreId", mode, "dateAjout")
SELECT gen_random_uuid(), (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-550'),
       (SELECT id FROM registres_nationaux WHERE code = 'RCCM'), 'CONSOMME', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM cas_usage_registre
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-550')
    AND "registreId" = (SELECT id FROM registres_nationaux WHERE code = 'RCCM')
);

INSERT INTO cas_usage_registre (id, "casUsageId", "registreId", mode, "dateAjout")
SELECT gen_random_uuid(), (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-550'),
       (SELECT id FROM registres_nationaux WHERE code = 'REG-CASIER'), 'CONSOMME', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM cas_usage_registre
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-550')
    AND "registreId" = (SELECT id FROM registres_nationaux WHERE code = 'REG-CASIER')
);

-- ============================================================================
-- CU3 — PINS-METIER-611 — Conformité fiscale et sociale des revenus salariaux
-- ============================================================================

UPDATE cas_usage_mvp SET "statutImpl" = 'EN_DEVELOPPEMENT',
  description = 'Échange et rapprochement des données employeurs, salariés, salaires et cotisations entre la DGID (SENTAX) et les caisses de protection sociale (IPRES, CSS). Détection des divergences entre déclarations fiscales et sociales. Seul des trois cas sans dépendance vers les deux autres et sans sous-système à créer. Candidat à la première livraison.'
WHERE code = 'PINS-METIER-611' AND ("statutImpl" != 'EN_DEVELOPPEMENT' OR description IS NULL OR description NOT LIKE '%Candidat à la première livraison%');

-- Stakeholders CU3
DELETE FROM use_case_stakeholder
WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-611');

INSERT INTO use_case_stakeholder (id, "casUsageId", "institutionId", role, actif, "dateAjout")
SELECT gen_random_uuid(), cu.id, i.id, r.role::"UseCaseRole", true, NOW()
FROM (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-611') cu
CROSS JOIN (VALUES
  ('DGID', 'FOURNISSEUR'), ('IPRES', 'CONSOMMATEUR'), ('CSS', 'CONSOMMATEUR')
) AS r(inst_code, role)
JOIN institutions i ON i.code = r.inst_code;
