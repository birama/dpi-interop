-- Migration P8+P9 — etape 1 : ajout des valeurs d'enum UseCaseStatus
-- Fichier isole car PostgreSQL interdit ALTER TYPE ADD VALUE dans un
-- bloc transactionnel. Chaque instruction doit etre auto-commitee.
-- Prisma execute chaque fichier de migration dans une transaction,
-- donc on met UNIQUEMENT ces ALTER TYPE ici.

ALTER TYPE "UseCaseStatus" ADD VALUE IF NOT EXISTS 'PROPOSE' BEFORE 'DECLARE';
ALTER TYPE "UseCaseStatus" ADD VALUE IF NOT EXISTS 'ARCHIVE';
ALTER TYPE "UseCaseStatus" ADD VALUE IF NOT EXISTS 'FUSIONNE';
