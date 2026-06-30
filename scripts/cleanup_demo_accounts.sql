-- Nettoyage comptes BAILLEUR démo → réels (post-atelier 19/05/2026)
-- Exécution : docker exec -i pins-db psql -U dpiuser -d dpidb < cleanup_demo_accounts.sql
BEGIN;

-- 1. Réassigner ptf-demo@senum.sn → admin@senum.sn
UPDATE audit_logs SET "userId" = 'e6e7daa5-332e-4f26-9125-fbf68cabd661' WHERE "userId" = 'd3cdfb34-dc5b-4edd-9ffd-e288b02820fe';
UPDATE journal_audit_ptf SET "userId" = 'e6e7daa5-332e-4f26-9125-fbf68cabd661' WHERE "userId" = 'd3cdfb34-dc5b-4edd-9ffd-e288b02820fe';
UPDATE manifestation_interet SET "userId" = 'e6e7daa5-332e-4f26-9125-fbf68cabd661' WHERE "userId" = 'd3cdfb34-dc5b-4edd-9ffd-e288b02820fe';

-- 2. Réassigner ptf-demo-bm@senum.sn → ptf-bm@senum.sn
UPDATE audit_logs SET "userId" = '7f07a27e-1cc6-48d5-b00a-ddc0a7d3f353' WHERE "userId" = '202d4135-cbfd-4691-9693-c5f2869cd5be';
UPDATE user_sessions SET "userId" = '7f07a27e-1cc6-48d5-b00a-ddc0a7d3f353' WHERE "userId" = '202d4135-cbfd-4691-9693-c5f2869cd5be';

-- 3. Réassigner ptf-demo-gates@senum.sn → ptf-gates@senum.sn
UPDATE audit_logs SET "userId" = 'c4ea1d10-c18a-4840-8366-0775a67353a7' WHERE "userId" = '08a2d02f-2fde-4b5a-8949-731d9c3aaafe';
UPDATE user_sessions SET "userId" = 'c4ea1d10-c18a-4840-8366-0775a67353a7' WHERE "userId" = '08a2d02f-2fde-4b5a-8949-731d9c3aaafe';

-- 4. Réassigner ptf-demo-giz@senum.sn → ptf-giz@senum.sn
UPDATE audit_logs SET "userId" = '3fd3fc99-5f74-4c11-a7d3-682d0ac9dd28' WHERE "userId" = '2317a695-9643-48eb-bca0-c152fa24d492';
UPDATE user_sessions SET "userId" = '3fd3fc99-5f74-4c11-a7d3-682d0ac9dd28' WHERE "userId" = '2317a695-9643-48eb-bca0-c152fa24d492';

-- 5. Réassigner ptf-demo-etat@senum.sn → ptf-etatsn@senum.sn
UPDATE audit_logs SET "userId" = '6ffbb456-6aa9-47ef-b034-3ace4c5dd019' WHERE "userId" = 'f7064d9b-54ce-4871-b261-5544429ffd3b';
UPDATE user_sessions SET "userId" = '6ffbb456-6aa9-47ef-b034-3ace4c5dd019' WHERE "userId" = 'f7064d9b-54ce-4871-b261-5544429ffd3b';

-- 6. Réassigner user_sessions restantes ptf-demo → admin
UPDATE user_sessions SET "userId" = 'e6e7daa5-332e-4f26-9125-fbf68cabd661' WHERE "userId" = 'd3cdfb34-dc5b-4edd-9ffd-e288b02820fe';

-- 7. Supprimer sessions restantes des 5 comptes démo
DELETE FROM user_sessions WHERE "userId" IN (
  'd3cdfb34-dc5b-4edd-9ffd-e288b02820fe',
  '202d4135-cbfd-4691-9693-c5f2869cd5be',
  '08a2d02f-2fde-4b5a-8949-731d9c3aaafe',
  '2317a695-9643-48eb-bca0-c152fa24d492',
  'f7064d9b-54ce-4871-b261-5544429ffd3b'
);

-- 8. Supprimer les 5 comptes démo
DELETE FROM users WHERE email IN (
  'ptf-demo@senum.sn',
  'ptf-demo-bm@senum.sn',
  'ptf-demo-giz@senum.sn',
  'ptf-demo-gates@senum.sn',
  'ptf-demo-etat@senum.sn'
);

-- 9. Supprimer les manifestations liées à la PTF DEMO
DELETE FROM manifestation_interet WHERE "ptfId" = (SELECT id FROM ptf WHERE code = 'DEMO');

-- 10. Supprimer la PTF factice DEMO
DELETE FROM ptf WHERE code = 'DEMO';

COMMIT;

-- Vérification
SELECT 'BAILLEUR count' as check_name, COUNT(*)::text as value FROM users WHERE role = 'BAILLEUR'
UNION ALL
SELECT 'PTF count', COUNT(*)::text FROM ptf;
