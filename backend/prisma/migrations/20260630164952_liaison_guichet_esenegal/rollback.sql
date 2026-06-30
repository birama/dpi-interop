-- ============================================================================
-- Rollback de la migration liaison_guichet_esenegal
--
-- À jouer manuellement (Prisma ne génère pas de rollback automatique). Ordre
-- inverse de la migration : drop des FK, puis tables, puis enum.
--
-- ⚠️ Détruit toutes les données de service_guichet et liaison_guichet. Faire
-- un backup avant d'exécuter (pg_dump -t service_guichet -t liaison_guichet).
-- ============================================================================

-- Drop foreign keys (CASCADE supprime aussi les indexes liés)
ALTER TABLE "liaison_guichet" DROP CONSTRAINT IF EXISTS "liaison_guichet_serviceGuichetId_fkey";
ALTER TABLE "liaison_guichet" DROP CONSTRAINT IF EXISTS "liaison_guichet_casUsageId_fkey";

-- Drop tables (DROP CASCADE supprime aussi les indexes uniques résiduels)
DROP TABLE IF EXISTS "liaison_guichet";
DROP TABLE IF EXISTS "service_guichet";

-- Drop enum
DROP TYPE IF EXISTS "PublicCible";
