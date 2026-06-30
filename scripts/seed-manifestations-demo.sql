-- Seed 3 manifestations EN_VALIDATION pour démo atelier 19/05/2026
-- Idempotent : INSERT ... ON CONFLICT DO NOTHING via filtre WHERE NOT EXISTS

BEGIN;

-- Identifiants de référence
WITH
  giz_user AS (SELECT u.id AS user_id, u."ptfId" FROM users u JOIN ptf p ON p.id=u."ptfId" WHERE p.code='GIZ' AND u.role='BAILLEUR' LIMIT 1),
  jica_user AS (SELECT u.id AS user_id, u."ptfId" FROM users u JOIN ptf p ON p.id=u."ptfId" WHERE p.code='JICA' AND u.role='BAILLEUR' LIMIT 1),
  gates_user AS (SELECT u.id AS user_id, u."ptfId" FROM users u JOIN ptf p ON p.id=u."ptfId" WHERE p.code='GATES' AND u.role='BAILLEUR' LIMIT 1),
  cas_giz AS (SELECT id FROM cas_usage_mvp WHERE code='PINS-METIER-001'),
  cas_jica AS (SELECT id FROM cas_usage_mvp WHERE code='PINS-METIER-010'),
  cas_gates AS (SELECT id FROM cas_usage_mvp WHERE code='PINS-METIER-009')

-- GIZ — CLIMAT_AFFAIRES → Création entreprise APIX (FINANCEMENT 1.5 M EUR Don)
INSERT INTO manifestation_interet
  (id, "casUsageId", "ptfId", "userId", type, statut, commentaire, "montantEstime", devise, "instrumentFinancier", "createdAt", "updatedAt")
SELECT
  'demo_manif_giz_apix',
  c.id, g."ptfId", g.user_id,
  'FINANCEMENT', 'EN_VALIDATION',
  'Fenêtre temporelle: S2 2026' || E'\n\n' ||
  'La GIZ Sénégal souhaite accompagner la modernisation du guichet unique APIX dans le cadre du programme "Climat des affaires Sahel". Périmètre envisagé : assistance technique sur l''interconnexion APIX↔DGID↔Greffe + financement de l''infrastructure d''interopérabilité. Conditions préalables : signature de la convention APIX-ANSD-DGD, qualification DU finalisée. Co-financement possible avec BM. Contact technique : équipe Gouvernance Économique de la GIZ à Dakar.',
  1500000, 'EUR', 'DON',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'
FROM cas_giz c, giz_user g
WHERE NOT EXISTS (
  SELECT 1 FROM manifestation_interet m
  WHERE m."ptfId"=g."ptfId" AND m."casUsageId"=c.id AND m.statut IN ('DRAFT','EN_VALIDATION','PUBLIE')
);

-- JICA — EDUCATION → CAMPUSEN (FINANCEMENT 800k USD Prêt concessionnel)
WITH
  jica_user AS (SELECT u.id AS user_id, u."ptfId" FROM users u JOIN ptf p ON p.id=u."ptfId" WHERE p.code='JICA' AND u.role='BAILLEUR' LIMIT 1),
  cas_jica AS (SELECT id FROM cas_usage_mvp WHERE code='PINS-METIER-010')
INSERT INTO manifestation_interet
  (id, "casUsageId", "ptfId", "userId", type, statut, commentaire, "montantEstime", devise, "instrumentFinancier", "createdAt", "updatedAt")
SELECT
  'demo_manif_jica_campusen',
  c.id, j."ptfId", j.user_id,
  'FINANCEMENT', 'EN_VALIDATION',
  'Fenêtre temporelle: Q1 2027' || E'\n\n' ||
  'La JICA propose un financement pour digitaliser l''orientation post-bac via CAMPUSEN, en cohérence avec sa stratégie pays Éducation. L''appui couvre : assistance technique (experts JICA/Accenture sur l''interopérabilité X-Road), équipement des serveurs universitaires, formation des équipes. Lien fort avec le programme X-Road piloté par JICA. Cible de mise en production : rentrée universitaire 2027-2028.',
  800000, 'USD', 'PRET_CONCESSIONNEL',
  NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days'
FROM cas_jica c, jica_user j
WHERE NOT EXISTS (
  SELECT 1 FROM manifestation_interet m
  WHERE m."ptfId"=j."ptfId" AND m."casUsageId"=c.id AND m.statut IN ('DRAFT','EN_VALIDATION','PUBLIE')
);

-- GATES — SANTE_NUMERIQUE → CMU (FINANCEMENT 3.2 M USD Assistance technique + Don)
WITH
  gates_user AS (SELECT u.id AS user_id, u."ptfId" FROM users u JOIN ptf p ON p.id=u."ptfId" WHERE p.code='GATES' AND u.role='BAILLEUR' LIMIT 1),
  cas_gates AS (SELECT id FROM cas_usage_mvp WHERE code='PINS-METIER-009')
INSERT INTO manifestation_interet
  (id, "casUsageId", "ptfId", "userId", type, statut, commentaire, "montantEstime", devise, "instrumentFinancier", "createdAt", "updatedAt")
SELECT
  'demo_manif_gates_cmu',
  c.id, g."ptfId", g.user_id,
  'FINANCEMENT', 'EN_VALIDATION',
  'Fenêtre temporelle: S1 2027' || E'\n\n' ||
  'La Fondation Bill & Melinda Gates positionne un appui significatif sur l''Inscription à la Couverture Maladie Universelle, dans la continuité de son programme "Universal Health Coverage Africa". Périmètre : interopérabilité ANACMU↔RNU↔DGID↔Pharmacies, plateforme de paiement social, dashboard de suivi temps réel. L''engagement Gates est conditionné à la validation conjointe MCTN/MSHP du périmètre fonctionnel et à la convention de financement tripartite.',
  3200000, 'USD', 'MIXTE',
  NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'
FROM cas_gates c, gates_user g
WHERE NOT EXISTS (
  SELECT 1 FROM manifestation_interet m
  WHERE m."ptfId"=g."ptfId" AND m."casUsageId"=c.id AND m.statut IN ('DRAFT','EN_VALIDATION','PUBLIE')
);

-- Trace audit pour cohérence (création + soumission pour chaque)
INSERT INTO journal_audit_ptf (id, "userId", action, "objetType", "objetId", "createdAt")
SELECT
  'demo_audit_' || m.id || '_creation',
  m."userId", 'CREATION_MANIFESTATION', 'manifestation', m.id, m."createdAt"
FROM manifestation_interet m
WHERE m.id IN ('demo_manif_giz_apix','demo_manif_jica_campusen','demo_manif_gates_cmu')
ON CONFLICT (id) DO NOTHING;

INSERT INTO journal_audit_ptf (id, "userId", action, "objetType", "objetId", "createdAt")
SELECT
  'demo_audit_' || m.id || '_soumission',
  m."userId", 'SOUMISSION_MANIFESTATION', 'manifestation', m.id, m."createdAt" + INTERVAL '5 minutes'
FROM manifestation_interet m
WHERE m.id IN ('demo_manif_giz_apix','demo_manif_jica_campusen','demo_manif_gates_cmu')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Vérification
SELECT p.code, m.type, m.statut, cu.code AS cas, m."montantEstime", m.devise, m."instrumentFinancier"
FROM manifestation_interet m
JOIN ptf p ON p.id=m."ptfId"
JOIN cas_usage_mvp cu ON cu.id=m."casUsageId"
ORDER BY m."createdAt" DESC;
