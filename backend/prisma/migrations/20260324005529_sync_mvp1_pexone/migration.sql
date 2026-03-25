-- CreateEnum
CREATE TYPE "HebergementType" AS ENUM ('SENUM_CENTRALISE', 'HEBERGEMENT_PROPRE', 'MIXTE');

-- AlterTable
ALTER TABLE "xroad_readiness" ADD COLUMN     "dateMigrationPrevue" TIMESTAMP(3),
ADD COLUMN     "disposeAPI" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hebergement" "HebergementType" NOT NULL DEFAULT 'SENUM_CENTRALISE',
ADD COLUMN     "hebergementCible" "HebergementType",
ADD COLUMN     "maturiteAPI" TEXT,
ADD COLUMN     "observationsAPI" TEXT,
ADD COLUMN     "prerequisMigration" TEXT,
ADD COLUMN     "protocoleAPI" TEXT,
ADD COLUMN     "systemeSource" TEXT;
