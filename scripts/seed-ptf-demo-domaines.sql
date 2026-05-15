-- Seed des domaines d'intérêt pour les 6 PTF démo atelier 19/05/2026
-- Idempotent : ON CONFLICT DO NOTHING + DELETE des domaines existants avant reseed

BEGIN;

-- ===== 1. Créer PTF DEMO (générique) si pas déjà fait =====
INSERT INTO ptf (id, code, nom, acronyme, type, pays, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'DEMO',
  'PTF Démonstration',
  'DEMO',
  'MULTILATERAL',
  'Sénégal',
  NOW(), NOW()
)
ON CONFLICT (code) DO NOTHING;

-- ===== 2. Vider et reseeder les domaines pour les 6 PTF =====
-- (idempotent : on supprime tout puis on réinsère)

DELETE FROM bailleur_domaine_interet
WHERE "ptfId" IN (SELECT id FROM ptf WHERE code IN ('BM','GIZ','JICA','GATES','ETAT-SN','DEMO'));

-- BM : IDENTITE_NUMERIQUE, FONCIER_CADASTRE, JUSTICE_ETAT_CIVIL, PROTECTION_SOCIALE (4)
INSERT INTO bailleur_domaine_interet (id, "ptfId", domaine, "createdAt")
SELECT gen_random_uuid()::text, p.id, d::"Domaine", NOW()
FROM ptf p, (VALUES ('IDENTITE_NUMERIQUE'),('FONCIER_CADASTRE'),('JUSTICE_ETAT_CIVIL'),('PROTECTION_SOCIALE')) AS x(d)
WHERE p.code='BM';

-- GIZ : CLIMAT_AFFAIRES, EMPLOI_FORMATION, FINANCES_PUBLIQUES (3)
INSERT INTO bailleur_domaine_interet (id, "ptfId", domaine, "createdAt")
SELECT gen_random_uuid()::text, p.id, d::"Domaine", NOW()
FROM ptf p, (VALUES ('CLIMAT_AFFAIRES'),('EMPLOI_FORMATION'),('FINANCES_PUBLIQUES')) AS x(d)
WHERE p.code='GIZ';

-- JICA : IDENTITE_NUMERIQUE, EDUCATION, TRANSVERSAL (3)
INSERT INTO bailleur_domaine_interet (id, "ptfId", domaine, "createdAt")
SELECT gen_random_uuid()::text, p.id, d::"Domaine", NOW()
FROM ptf p, (VALUES ('IDENTITE_NUMERIQUE'),('EDUCATION'),('TRANSVERSAL')) AS x(d)
WHERE p.code='JICA';

-- GATES : SANTE_NUMERIQUE, IDENTITE_NUMERIQUE, PROTECTION_SOCIALE (3)
INSERT INTO bailleur_domaine_interet (id, "ptfId", domaine, "createdAt")
SELECT gen_random_uuid()::text, p.id, d::"Domaine", NOW()
FROM ptf p, (VALUES ('SANTE_NUMERIQUE'),('IDENTITE_NUMERIQUE'),('PROTECTION_SOCIALE')) AS x(d)
WHERE p.code='GATES';

-- ETAT-SN : LES 14 DOMAINES
INSERT INTO bailleur_domaine_interet (id, "ptfId", domaine, "createdAt")
SELECT gen_random_uuid()::text, p.id, d::"Domaine", NOW()
FROM ptf p, (VALUES
  ('FINANCES_PUBLIQUES'),('CLIMAT_AFFAIRES'),('PROTECTION_SOCIALE'),
  ('SANTE_NUMERIQUE'),('EDUCATION'),('IDENTITE_NUMERIQUE'),
  ('JUSTICE_ETAT_CIVIL'),('FONCIER_CADASTRE'),('AGRICULTURE_NUMERIQUE'),
  ('EMPLOI_FORMATION'),('SERVICES_CITOYENS'),('GOUVERNANCE_DONNEES'),
  ('CYBERSECURITE'),('TRANSVERSAL')
) AS x(d)
WHERE p.code='ETAT-SN';

-- DEMO : 11 domaines couverts par le portefeuille PRIORISE actuel
INSERT INTO bailleur_domaine_interet (id, "ptfId", domaine, "createdAt")
SELECT gen_random_uuid()::text, p.id, d::"Domaine", NOW()
FROM ptf p, (VALUES
  ('FINANCES_PUBLIQUES'),('CLIMAT_AFFAIRES'),('PROTECTION_SOCIALE'),
  ('IDENTITE_NUMERIQUE'),('SERVICES_CITOYENS'),('SANTE_NUMERIQUE'),
  ('EDUCATION'),('JUSTICE_ETAT_CIVIL'),('FONCIER_CADASTRE'),
  ('EMPLOI_FORMATION'),('TRANSVERSAL')
) AS x(d)
WHERE p.code='DEMO';

-- ===== 3. Reconfigurer ptf-demo@senum.sn pour pointer vers PTF DEMO =====
UPDATE users
SET "ptfId" = (SELECT id FROM ptf WHERE code='DEMO')
WHERE email='ptf-demo@senum.sn';

COMMIT;

-- ===== Vérification =====
SELECT p.code, COUNT(d.id) AS nb_domaines
FROM ptf p
LEFT JOIN bailleur_domaine_interet d ON d."ptfId"=p.id
WHERE p.code IN ('BM','GIZ','JICA','GATES','ETAT-SN','DEMO')
GROUP BY p.code
ORDER BY p.code;
