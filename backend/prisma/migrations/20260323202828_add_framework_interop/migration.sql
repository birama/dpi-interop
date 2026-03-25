-- CreateTable
CREATE TABLE "niveaux_interop" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "niveau" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "reponse" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "niveaux_interop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conformite_principes" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "principeNumero" INTEGER NOT NULL,
    "categorie" TEXT NOT NULL,
    "score" SMALLINT NOT NULL DEFAULT 1,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conformite_principes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dictionnaire_donnees" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "nomChamp" TEXT NOT NULL,
    "definition" TEXT,
    "formatTechnique" TEXT,
    "taille" TEXT,
    "referentielOrigine" TEXT,
    "nomenclature" TEXT,
    "identifiantPivot" BOOLEAN NOT NULL DEFAULT false,
    "frequenceMAJ" TEXT,
    "sensibilite" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dictionnaire_donnees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preparation_decret" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "chapitre" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "reponse" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preparation_decret_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "niveaux_interop_submissionId_idx" ON "niveaux_interop"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "niveaux_interop_submissionId_niveau_question_key" ON "niveaux_interop"("submissionId", "niveau", "question");

-- CreateIndex
CREATE INDEX "conformite_principes_submissionId_idx" ON "conformite_principes"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "conformite_principes_submissionId_principeNumero_key" ON "conformite_principes"("submissionId", "principeNumero");

-- CreateIndex
CREATE INDEX "dictionnaire_donnees_submissionId_idx" ON "dictionnaire_donnees"("submissionId");

-- CreateIndex
CREATE INDEX "preparation_decret_submissionId_idx" ON "preparation_decret"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "preparation_decret_submissionId_chapitre_question_key" ON "preparation_decret"("submissionId", "chapitre", "question");

-- AddForeignKey
ALTER TABLE "niveaux_interop" ADD CONSTRAINT "niveaux_interop_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conformite_principes" ADD CONSTRAINT "conformite_principes_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dictionnaire_donnees" ADD CONSTRAINT "dictionnaire_donnees_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preparation_decret" ADD CONSTRAINT "preparation_decret_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
