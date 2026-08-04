-- Fusion des doublons et dependance technique — MVP 2.0 JICA/Accenture
-- Idempotent : chaque operation verifie que l'etat cible n'est pas deja atteint.
-- Aucun statutVueSection touche. Aucun financement deplace. Aucun DELETE.

-- ============================================================================
-- Fusion PINS-METIER-101 → PINS-METIER-550
-- ============================================================================

-- Enrichir 550 avec la description de 101 (si pas encore fait)
UPDATE cas_usage_mvp
SET description = 'Étendre le flux DGD→DGID vers un service bidirectionnel. La DGID (SENTAX) expose les informations comptables, déclarations fiscales et fichier CGE. La DGD (GAINDE) consomme ce service pour croisement sur NINEA. Détection sous-déclarations et élargissement assiette fiscale.',
    "codeHistorique" = CASE
      WHEN "codeHistorique" IS NULL OR "codeHistorique" NOT LIKE '%PINS-METIER-101%'
      THEN COALESCE("codeHistorique", '') || '; PINS-METIER-101 (fusionné, provenance: liste soumise à la GIZ juin 2026)'
      ELSE "codeHistorique"
    END
WHERE code = 'PINS-METIER-550'
  AND (description IS NULL OR description NOT LIKE '%SENTAX%');

-- Marquer 101 comme fusionné vers 550 (si pas déjà fait)
UPDATE cas_usage_mvp
SET "fusionneVersId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-550'),
    "codeHistorique" = CASE
      WHEN "codeHistorique" IS NULL OR "codeHistorique" NOT LIKE '%fusionné vers PINS-METIER-550%'
      THEN COALESCE("codeHistorique", '') || '; fusionné vers PINS-METIER-550'
      ELSE "codeHistorique"
    END
WHERE code = 'PINS-METIER-101'
  AND ("fusionneVersId" IS NULL OR "fusionneVersId" != (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-550'));

-- ============================================================================
-- Fusion PINS-METIER-102 → PINS-METIER-551
-- ============================================================================

-- Enrichir 551 avec la description de 102
UPDATE cas_usage_mvp
SET description = 'Trois services X-Road interconnectant GAINDE et SIGIF. (1) GAINDE→SIGIF: transmission temps réel des déclarations validées avec détail des droits par nature de taxe (40+ codes). (2) Paiement: validation dans SIGIF, comptabilisation par nature, quittance. (3) SIGIF→GAINDE: retour quittance pour émargement BAE.',
    "donneesEchangees" = 'Numéro déclaration (année-bureau-numéro), code PPM déclarant, détail taxes par code (Trésor, UEMOA, CEDEAO), référence avis validation, quittances, date envoi, code créditaire',
    "codeHistorique" = CASE
      WHEN "codeHistorique" IS NULL OR "codeHistorique" NOT LIKE '%PINS-METIER-102%'
      THEN COALESCE("codeHistorique", '') || '; PINS-METIER-102 (fusionné, provenance: liste soumise à la GIZ juin 2026)'
      ELSE "codeHistorique"
    END
WHERE code = 'PINS-METIER-551'
  AND (description IS NULL OR description NOT LIKE '%GAINDE et SIGIF%');

-- Marquer 102 comme fusionné vers 551
UPDATE cas_usage_mvp
SET "fusionneVersId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-551'),
    "codeHistorique" = CASE
      WHEN "codeHistorique" IS NULL OR "codeHistorique" NOT LIKE '%fusionné vers PINS-METIER-551%'
      THEN COALESCE("codeHistorique", '') || '; fusionné vers PINS-METIER-551'
      ELSE "codeHistorique"
    END
WHERE code = 'PINS-METIER-102'
  AND ("fusionneVersId" IS NULL OR "fusionneVersId" != (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-551'));

-- ============================================================================
-- Fusion PINS-METIER-501 → PINS-METIER-001
-- ============================================================================

-- Enrichir 001 avec la description de 501
UPDATE cas_usage_mvp
SET description = 'Dépôt en ligne du dossier APIX, vérification casier des dirigeants, immatriculation RCCM, attribution NINEA, déclaration fiscale initiale, affiliation CSS et IPRES',
    "codeHistorique" = CASE
      WHEN "codeHistorique" IS NULL OR "codeHistorique" NOT LIKE '%PINS-METIER-501%'
      THEN COALESCE("codeHistorique", '') || '; PINS-METIER-501 (fusionné)'
      ELSE "codeHistorique"
    END
WHERE code = 'PINS-METIER-001'
  AND (description IS NULL OR description NOT LIKE '%dépôt en ligne du dossier APIX%');

-- Marquer 501 comme fusionné vers 001
UPDATE cas_usage_mvp
SET "fusionneVersId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
    "codeHistorique" = CASE
      WHEN "codeHistorique" IS NULL OR "codeHistorique" NOT LIKE '%fusionné vers PINS-METIER-001%'
      THEN COALESCE("codeHistorique", '') || '; fusionné vers PINS-METIER-001'
      ELSE "codeHistorique"
    END
WHERE code = 'PINS-METIER-501'
  AND ("fusionneVersId" IS NULL OR "fusionneVersId" != (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'));

-- ============================================================================
-- Dépendance technique PINS-METIER-551 → PINS-TECH-0302
-- ============================================================================

INSERT INTO relation_cas_usage (id, "casUsageMetierId", "casUsageTechniqueId", obligatoire, commentaire, "createdAt", "createdBy")
SELECT
  gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-551'),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0302'),
  false,
  'Flux technique de rapprochement des liquidations douanières — dépendance du cycle BAE (MVP 2.0 JICA)',
  NOW(),
  (SELECT id FROM users WHERE role = 'ADMIN' ORDER BY "createdAt" LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM relation_cas_usage
  WHERE "casUsageMetierId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-551')
    AND "casUsageTechniqueId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0302')
);
