-- Systèmes sources du périmètre MVP 2.0 JICA/Accenture (atelier 30 juillet 2026)
-- Idempotent : tous les INSERT vérifient l'absence préalable par code.
-- Ciblage par code institution/registre (pas d'UUID local).

-- ============================================================================
-- Systèmes
-- ============================================================================

INSERT INTO systemes_source (id, code, libelle, "institutionId", notes, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'GUICHET-UNIQUE-APIX',
  'Guichet Unique APIX — Plateforme de création d''entreprise',
  (SELECT id FROM institutions WHERE code = 'APIX'),
  'Système de dépôt en ligne des dossiers. Expose les services vers RCCM, NINEA, DGID, CSS, IPRES.',
  NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM systemes_source WHERE code = 'GUICHET-UNIQUE-APIX');

INSERT INTO systemes_source (id, code, libelle, "institutionId", notes, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'ORBUS',
  'ORBUS — Plateforme des greffes (GAINDE 2000)',
  (SELECT id FROM institutions WHERE code = 'MJ'),
  '⚠️ AMBIGUÏTÉ ORBUS : le deck JICA désigne ORBUS comme système du RCCM. La base PINS (systemeSource de GAINDE) mentionne "GAINDE Integral + ORBUS 2000" comme système de la Douane. Soit ORBUS 2000 est la plateforme technique de GAINDE 2000 hébergeant à la fois GAINDE Integral et e-RCCM, soit il y a confusion. Question ouverte pour le groupe de travail Accenture/SENUM.',
  NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM systemes_source WHERE code = 'ORBUS');

INSERT INTO systemes_source (id, code, libelle, "institutionId", notes, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'NINEA-WEB',
  'NINEA WEB — Portail de gestion du NINEA',
  (SELECT id FROM institutions WHERE code = 'ANSD'),
  'Frontal web du répertoire NINEA. Plateforme sous-jacente ModelSIS-TANDEM non modélisée séparément.',
  NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM systemes_source WHERE code = 'NINEA-WEB');

INSERT INTO systemes_source (id, code, libelle, "institutionId", notes, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'SIGNAS',
  'SIGNAS — Service en ligne du Casier Judiciaire',
  (SELECT id FROM institutions WHERE code = 'CNCJ'),
  'Système de consultation et délivrance du bulletin n°3 du casier judiciaire.',
  NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM systemes_source WHERE code = 'SIGNAS');

INSERT INTO systemes_source (id, code, libelle, "institutionId", notes, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'SIGTAS',
  'SIGTAS — Système de Gestion des Taxes (DGID)',
  (SELECT id FROM institutions WHERE code = 'DGID'),
  '⚠️ Le registre fiscal porte le code SENTAX dans PINS. La nomenclature interne dit "SENTAX remplace SIGTAS", ce qui décrit un remplacement de système. Le registre SENTAX a pour systemeSource=SIGTAS. Question à poser à la DGID.',
  NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM systemes_source WHERE code = 'SIGTAS');

INSERT INTO systemes_source (id, code, libelle, "institutionId", notes, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'GAINDE-INTEGRAL',
  'GAINDE Integral — Système de dédouanement',
  (SELECT id FROM institutions WHERE code = 'DGD'),
  'Gestion des déclarations douanières. Fonctionne sur ORBUS 2000 (GAINDE 2000).',
  NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM systemes_source WHERE code = 'GAINDE-INTEGRAL');

INSERT INTO systemes_source (id, code, libelle, "institutionId", notes, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'NDAMLI',
  'NDAMLI — Système de gestion des assurés IPRES/CSS',
  (SELECT id FROM institutions WHERE code = 'IPRES'),
  'Système commun IPRES/CSS de gestion des affiliations, cotisations et prestations sociales. Aucun registre national correspondant dans PINS.',
  NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM systemes_source WHERE code = 'NDAMLI');

-- ============================================================================
-- Liaisons registres
-- ============================================================================

INSERT INTO registre_systeme (id, "systemeId", "registreId")
SELECT gen_random_uuid(),
  (SELECT id FROM systemes_source WHERE code = 'ORBUS'),
  (SELECT id FROM registres_nationaux WHERE code = 'RCCM')
WHERE NOT EXISTS (
  SELECT 1 FROM registre_systeme rs
  JOIN systemes_source ss ON ss.id = rs."systemeId"
  JOIN registres_nationaux rn ON rn.id = rs."registreId"
  WHERE ss.code = 'ORBUS' AND rn.code = 'RCCM'
);

INSERT INTO registre_systeme (id, "systemeId", "registreId")
SELECT gen_random_uuid(),
  (SELECT id FROM systemes_source WHERE code = 'NINEA-WEB'),
  (SELECT id FROM registres_nationaux WHERE code = 'NINEA')
WHERE NOT EXISTS (
  SELECT 1 FROM registre_systeme rs
  JOIN systemes_source ss ON ss.id = rs."systemeId"
  JOIN registres_nationaux rn ON rn.id = rs."registreId"
  WHERE ss.code = 'NINEA-WEB' AND rn.code = 'NINEA'
);

INSERT INTO registre_systeme (id, "systemeId", "registreId")
SELECT gen_random_uuid(),
  (SELECT id FROM systemes_source WHERE code = 'SIGNAS'),
  (SELECT id FROM registres_nationaux WHERE code = 'REG-CASIER')
WHERE NOT EXISTS (
  SELECT 1 FROM registre_systeme rs
  JOIN systemes_source ss ON ss.id = rs."systemeId"
  JOIN registres_nationaux rn ON rn.id = rs."registreId"
  WHERE ss.code = 'SIGNAS' AND rn.code = 'REG-CASIER'
);

INSERT INTO registre_systeme (id, "systemeId", "registreId")
SELECT gen_random_uuid(),
  (SELECT id FROM systemes_source WHERE code = 'SIGTAS'),
  (SELECT id FROM registres_nationaux WHERE code = 'SENTAX')
WHERE NOT EXISTS (
  SELECT 1 FROM registre_systeme rs
  JOIN systemes_source ss ON ss.id = rs."systemeId"
  JOIN registres_nationaux rn ON rn.id = rs."registreId"
  WHERE ss.code = 'SIGTAS' AND rn.code = 'SENTAX'
);

INSERT INTO registre_systeme (id, "systemeId", "registreId")
SELECT gen_random_uuid(),
  (SELECT id FROM systemes_source WHERE code = 'GAINDE-INTEGRAL'),
  (SELECT id FROM registres_nationaux WHERE code = 'GAINDE')
WHERE NOT EXISTS (
  SELECT 1 FROM registre_systeme rs
  JOIN systemes_source ss ON ss.id = rs."systemeId"
  JOIN registres_nationaux rn ON rn.id = rs."registreId"
  WHERE ss.code = 'GAINDE-INTEGRAL' AND rn.code = 'GAINDE'
);
