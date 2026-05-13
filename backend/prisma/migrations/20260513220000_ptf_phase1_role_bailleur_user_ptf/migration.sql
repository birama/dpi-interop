-- ============================================================================
-- PTF Phase 1 — RBAC + lien User <-> PTF
--
-- Ajoute le rôle BAILLEUR à l'enum Role.
-- Ajoute ptfId (FK nullable vers PTF) et cguAccepteesAt sur User.
--
-- IMPORTANT : migration additive uniquement. Aucune donnée existante
-- n'est modifiée. Les colonnes nouvelles sont NULL-by-default.
--
-- Réf : MCTN/DU/PROMPTS-PINS-PTF-2026 — Prompt PTF-01.
-- ============================================================================

-- 1. Ajout de la valeur BAILLEUR à l'enum Role
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BAILLEUR';

-- 2. Ajout des nouvelles colonnes sur users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "ptfId" TEXT,
  ADD COLUMN IF NOT EXISTS "cguAccepteesAt" TIMESTAMP(3);

-- 3. Foreign key vers ptf (ON DELETE SET NULL pour ne pas casser un compte si le PTF est supprimé)
ALTER TABLE "users"
  ADD CONSTRAINT "users_ptfId_fkey"
  FOREIGN KEY ("ptfId") REFERENCES "ptf"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Index sur ptfId pour les jointures
CREATE INDEX IF NOT EXISTS "users_ptfId_idx" ON "users"("ptfId");
