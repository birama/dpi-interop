BEGIN;

-- Temporarily drop FK to phases_mvp to allow import
ALTER TABLE cas_usage_mvp DROP CONSTRAINT IF EXISTS cas_usage_mvp_phaseMVPId_fkey;

-- Now import

-- Temporarily drop FK to phases_mvp to allow import
ALTER TABLE cas_usage_mvp DROP CONSTRAINT IF EXISTS cas_usage_mvp_phaseMVPId_fkey;

-- Now import

-- Restore FK
ALTER TABLE cas_usage_mvp ADD CONSTRAINT cas_usage_mvp_phaseMVPId_fkey FOREIGN KEY ("phaseMVPId") REFERENCES phases_mvp(id) ON UPDATE CASCADE ON DELETE SET NULL;

COMMIT;
