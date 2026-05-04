-- N2 — Migration de la nomenclature des cas d'usage (CONC-2026-06)
-- Ajoute le champ codeHistorique pour tracabilite apres renommage / fusion.

ALTER TABLE "cas_usage_mvp" ADD COLUMN "codeHistorique" TEXT;
