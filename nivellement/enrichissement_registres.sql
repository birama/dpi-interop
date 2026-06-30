-- Liaisons cas ↔ registres — 3 cas demo PINS (5 mai 2026)
-- Registres disponibles: ASTER, FICHIER-BIO, GAINDE, NICAD, NINEA, RCCM, RNEC, RNU, SIGIF, SIGTAS
-- IPRES, CSS, RNCJ absents → signales a Birama
BEGIN;

-- ================================================================
-- PINS-METIER-001 (3 registres existants: NINEA, RCCM, RNEC)
-- ================================================================

INSERT INTO cas_usage_registre (id, "casUsageId", "registreId", "createdAt", "updatedAt")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM registres_nationaux WHERE code = 'NINEA'),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM cas_usage_registre
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "registreId" = (SELECT id FROM registres_nationaux WHERE code = 'NINEA')
);

INSERT INTO cas_usage_registre (id, "casUsageId", "registreId", "createdAt", "updatedAt")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM registres_nationaux WHERE code = 'RCCM'),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM cas_usage_registre
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "registreId" = (SELECT id FROM registres_nationaux WHERE code = 'RCCM')
);

INSERT INTO cas_usage_registre (id, "casUsageId", "registreId", "createdAt", "updatedAt")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001'),
  (SELECT id FROM registres_nationaux WHERE code = 'RNEC'),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM cas_usage_registre
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-METIER-001')
    AND "registreId" = (SELECT id FROM registres_nationaux WHERE code = 'RNEC')
);

-- ================================================================
-- PINS-TECH-0001 — Verification RNU (registres: RNU, NINEA)
-- ================================================================

INSERT INTO cas_usage_registre (id, "casUsageId", "registreId", "createdAt", "updatedAt")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0001'),
  (SELECT id FROM registres_nationaux WHERE code = 'RNU'),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM cas_usage_registre
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0001')
    AND "registreId" = (SELECT id FROM registres_nationaux WHERE code = 'RNU')
);

INSERT INTO cas_usage_registre (id, "casUsageId", "registreId", "createdAt", "updatedAt")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0001'),
  (SELECT id FROM registres_nationaux WHERE code = 'NINEA'),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM cas_usage_registre
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0001')
    AND "registreId" = (SELECT id FROM registres_nationaux WHERE code = 'NINEA')
);

-- ================================================================
-- PINS-TECH-0002 — Douanes.GetDeclarations (registres: GAINDE, NINEA)
-- ================================================================

INSERT INTO cas_usage_registre (id, "casUsageId", "registreId", "createdAt", "updatedAt")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0002'),
  (SELECT id FROM registres_nationaux WHERE code = 'GAINDE'),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM cas_usage_registre
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0002')
    AND "registreId" = (SELECT id FROM registres_nationaux WHERE code = 'GAINDE')
);

INSERT INTO cas_usage_registre (id, "casUsageId", "registreId", "createdAt", "updatedAt")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0002'),
  (SELECT id FROM registres_nationaux WHERE code = 'NINEA'),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM cas_usage_registre
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0002')
    AND "registreId" = (SELECT id FROM registres_nationaux WHERE code = 'NINEA')
);

-- ================================================================
-- PINS-TECH-0004 — Consultation NINEA (registre: NINEA)
-- ================================================================

INSERT INTO cas_usage_registre (id, "casUsageId", "registreId", "createdAt", "updatedAt")
SELECT gen_random_uuid(),
  (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004'),
  (SELECT id FROM registres_nationaux WHERE code = 'NINEA'),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM cas_usage_registre
  WHERE "casUsageId" = (SELECT id FROM cas_usage_mvp WHERE code = 'PINS-TECH-0004')
    AND "registreId" = (SELECT id FROM registres_nationaux WHERE code = 'NINEA')
);

-- Verification
SELECT c.code, COUNT(cur.id) AS nb_registres
FROM cas_usage_mvp c
LEFT JOIN cas_usage_registre cur ON cur."casUsageId" = c.id
WHERE c.code IN ('PINS-METIER-001','PINS-TECH-0001','PINS-TECH-0002','PINS-TECH-0004')
GROUP BY c.code ORDER BY c.code;

COMMIT;

-- Registres absents (IPRES, CSS, RNCJ) → a ajouter ulterieurement
