-- SystemeSource : système d'information exposant un ou plusieurs registres nationaux
-- Distinct du RegistreNational : un registre n'a pas d'API, un système en a une.
-- Cf. arbitrage Phase 1A — Option B.

-- CreateTable
CREATE TABLE "systemes_source" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "editeur" TEXT,
    "institutionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "systemes_source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registre_systeme" (
    "id" TEXT NOT NULL,
    "systemeId" TEXT NOT NULL,
    "registreId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "registre_systeme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "systemes_source_code_key" ON "systemes_source"("code");

-- CreateIndex
CREATE UNIQUE INDEX "registre_systeme_systemeId_registreId_key" ON "registre_systeme"("systemeId", "registreId");

-- AddForeignKey
ALTER TABLE "systemes_source" ADD CONSTRAINT "systemes_source_institutionId_fkey"
  FOREIGN KEY ("institutionId") REFERENCES "institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registre_systeme" ADD CONSTRAINT "registre_systeme_systemeId_fkey"
  FOREIGN KEY ("systemeId") REFERENCES "systemes_source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registre_systeme" ADD CONSTRAINT "registre_systeme_registreId_fkey"
  FOREIGN KEY ("registreId") REFERENCES "registres_nationaux"("id") ON DELETE CASCADE ON UPDATE CASCADE;
