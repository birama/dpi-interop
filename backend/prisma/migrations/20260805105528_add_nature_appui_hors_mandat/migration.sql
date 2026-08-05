-- Ajout de la distinction nature d'appui (financier / assistance technique / mixte)
-- et de l'état HORS_MANDAT (demande hors périmètre du PTF)
-- Cf. diagnostic Phase 1 PTF — 05/08/2026

-- 1. Ajouter HORS_MANDAT à l'enum FinancementStatus
ALTER TYPE "FinancementStatus" ADD VALUE 'HORS_MANDAT';

-- 2. Créer l'enum NatureAppui
CREATE TYPE "NatureAppui" AS ENUM ('FINANCIER', 'ASSISTANCE_TECHNIQUE', 'MIXTE');

-- 3. Ajouter la colonne natureAppui sur financements
ALTER TABLE "financements" ADD COLUMN "natureAppui" "NatureAppui" NOT NULL DEFAULT 'FINANCIER';
