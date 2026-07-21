-- Phase 2 — Sécurité : rôle par défaut inerte.
-- Transaction 2/2 : PENDING déjà dans l'enum (migration précédente),
-- on peut maintenant le référencer dans le DEFAULT.

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'PENDING';
