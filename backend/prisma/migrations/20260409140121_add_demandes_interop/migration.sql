-- CreateTable
CREATE TABLE "demandes_interop" (
    "id" TEXT NOT NULL,
    "institutionId" TEXT NOT NULL,
    "demandeurNom" TEXT NOT NULL,
    "demandeurEmail" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "institutionCibleId" TEXT,
    "donneesVisees" TEXT,
    "justification" TEXT,
    "frequenceSouhaitee" TEXT,
    "urgence" TEXT NOT NULL DEFAULT 'NORMALE',
    "statut" TEXT NOT NULL DEFAULT 'SOUMISE',
    "reponse" TEXT,
    "respondantNom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "traiteeAt" TIMESTAMP(3),

    CONSTRAINT "demandes_interop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demandes_interop_institutionId_idx" ON "demandes_interop"("institutionId");

-- CreateIndex
CREATE INDEX "demandes_interop_statut_idx" ON "demandes_interop"("statut");
