-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "importFilename" TEXT,
ADD COLUMN     "importHash" TEXT,
ADD COLUMN     "importedAt" TIMESTAMP(3);
