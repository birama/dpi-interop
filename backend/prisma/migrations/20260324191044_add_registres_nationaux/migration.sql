-- CreateTable
CREATE TABLE "registres_nationaux" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "domaine" TEXT NOT NULL,
    "institutionCode" TEXT NOT NULL,
    "institutionNom" TEXT NOT NULL,
    "systemeSource" TEXT,
    "identifiantPivot" TEXT,
    "formatIdentifiant" TEXT,
    "volumeEstime" TEXT,
    "statutNumerisation" TEXT,
    "statutEjokkoo" TEXT,
    "disposeAPI" BOOLEAN NOT NULL DEFAULT false,
    "protocoleAPI" TEXT,
    "baseLegale" TEXT,
    "consommateurs" TEXT,
    "observations" TEXT,
    "tauxCompletude" INTEGER,
    "tauxDoublons" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registres_nationaux_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registres_nationaux_code_key" ON "registres_nationaux"("code");

-- CreateIndex
CREATE INDEX "registres_nationaux_domaine_idx" ON "registres_nationaux"("domaine");
