-- Reset mots de passe comptes de demo PINS pour diffusion officielle
-- Mot de passe : DemoPINS2026!
-- Hash bcrypt (rounds=10) genere le 2026-04-23
--
-- Usage en prod :
--   docker exec -i pins-db psql -U dpiuser -d dpidb < reset-demo-passwords.sql
-- ou en mode interactif :
--   docker cp reset-demo-passwords.sql pins-db:/tmp/
--   docker exec -it pins-db psql -U dpiuser -d dpidb -f /tmp/reset-demo-passwords.sql

BEGIN;

-- Hash bcrypt de "DemoPINS2026!"
\set HASH '$2b$10$3eL6taafvDQzAcJ1mL91JujM8.qGzflp4O978lb9P4KOk4/8mdKq2'

-- DGID
UPDATE users SET password=:'HASH', "mustChangePassword"=false WHERE email='dsi@dgid.sn';
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, 'dsi@dgid.sn', :'HASH', 'INSTITUTION', i.id, false, NOW(), NOW()
  FROM institutions i WHERE i.code='DGID' AND NOT EXISTS (SELECT 1 FROM users WHERE email='dsi@dgid.sn');

-- ANSD
UPDATE users SET password=:'HASH', "mustChangePassword"=false WHERE email='dsi@ansd.sn';
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, 'dsi@ansd.sn', :'HASH', 'INSTITUTION', i.id, false, NOW(), NOW()
  FROM institutions i WHERE i.code='ANSD' AND NOT EXISTS (SELECT 1 FROM users WHERE email='dsi@ansd.sn');

-- DGCPT
UPDATE users SET password=:'HASH', "mustChangePassword"=false WHERE email='dsi@dgcpt.sn';
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, 'dsi@dgcpt.sn', :'HASH', 'INSTITUTION', i.id, false, NOW(), NOW()
  FROM institutions i WHERE i.code='DGCPT' AND NOT EXISTS (SELECT 1 FROM users WHERE email='dsi@dgcpt.sn');

-- MJ
UPDATE users SET password=:'HASH', "mustChangePassword"=false WHERE email='dsi@mj.sn';
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, 'dsi@mj.sn', :'HASH', 'INSTITUTION', i.id, false, NOW(), NOW()
  FROM institutions i WHERE i.code='MJ' AND NOT EXISTS (SELECT 1 FROM users WHERE email='dsi@mj.sn');

-- DGPSN
UPDATE users SET password=:'HASH', "mustChangePassword"=false WHERE email='dsi@dgpsn.sn';
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, 'dsi@dgpsn.sn', :'HASH', 'INSTITUTION', i.id, false, NOW(), NOW()
  FROM institutions i WHERE i.code='DGPSN' AND NOT EXISTS (SELECT 1 FROM users WHERE email='dsi@dgpsn.sn');

-- APIX
UPDATE users SET password=:'HASH', "mustChangePassword"=false WHERE email='dsi@apix.sn';
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, 'dsi@apix.sn', :'HASH', 'INSTITUTION', i.id, false, NOW(), NOW()
  FROM institutions i WHERE i.code='APIX' AND NOT EXISTS (SELECT 1 FROM users WHERE email='dsi@apix.sn');

-- CDP
UPDATE users SET password=:'HASH', "mustChangePassword"=false WHERE email='dsi@cdp.sn';
INSERT INTO users (id, email, password, role, "institutionId", "mustChangePassword", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::text, 'dsi@cdp.sn', :'HASH', 'INSTITUTION', i.id, false, NOW(), NOW()
  FROM institutions i WHERE i.code='CDP' AND NOT EXISTS (SELECT 1 FROM users WHERE email='dsi@cdp.sn');

-- Cleanup cas d'usage de test
ALTER TABLE use_case_status_history DISABLE TRIGGER trg_prevent_statushistory_update;
DELETE FROM use_case_consultation WHERE "stakeholderId" IN (SELECT id FROM use_case_stakeholder WHERE "casUsageId" IN (SELECT id FROM cas_usage_mvp WHERE titre ILIKE 'test%'));
DELETE FROM notification WHERE "refId" IN (SELECT id FROM cas_usage_mvp WHERE titre ILIKE 'test%');
DELETE FROM use_case_status_history WHERE "casUsageId" IN (SELECT id FROM cas_usage_mvp WHERE titre ILIKE 'test%');
DELETE FROM cas_usage_registre WHERE "casUsageId" IN (SELECT id FROM cas_usage_mvp WHERE titre ILIKE 'test%');
DELETE FROM use_case_stakeholder WHERE "casUsageId" IN (SELECT id FROM cas_usage_mvp WHERE titre ILIKE 'test%');
DELETE FROM cas_usage_mvp WHERE titre ILIKE 'test%';
ALTER TABLE use_case_status_history ENABLE TRIGGER trg_prevent_statushistory_update;

-- Controle
SELECT u.email, i.code AS institution, u."mustChangePassword"
FROM users u LEFT JOIN institutions i ON i.id=u."institutionId"
WHERE u.email IN ('dsi@dgid.sn','dsi@ansd.sn','dsi@dgcpt.sn','dsi@mj.sn','dsi@dgpsn.sn','dsi@apix.sn','dsi@cdp.sn')
ORDER BY u.email;

COMMIT;
