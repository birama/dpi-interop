-- Nivellement local -> prod : 5 tables metier
-- FK cas_usage_mvp.phaseMVPId temporairement desactivee
BEGIN;

ALTER TABLE cas_usage_mvp DROP CONSTRAINT IF EXISTS cas_usage_mvp_phaseMVPId_fkey;

\i export_local_metier.sql

ALTER TABLE cas_usage_mvp ADD CONSTRAINT cas_usage_mvp_phaseMVPId_fkey
  FOREIGN KEY ("phaseMVPId") REFERENCES phases_mvp(id) ON UPDATE CASCADE ON DELETE SET NULL;

COMMIT;
