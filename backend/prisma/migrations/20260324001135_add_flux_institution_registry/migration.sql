-- CreateTable
CREATE TABLE "flux_institutions" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "casUsageMVPId" TEXT NOT NULL,
    "roleInstitution" TEXT NOT NULL,
    "modeActuel" TEXT,
    "frequence" TEXT,
    "conventionSignee" BOOLEAN NOT NULL DEFAULT false,
    "volumeEstime" TEXT,
    "observations" TEXT,
    "priorite" SMALLINT NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flux_institutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flux_institutions_casUsageMVPId_idx" ON "flux_institutions"("casUsageMVPId");

-- CreateIndex
CREATE UNIQUE INDEX "flux_institutions_submissionId_casUsageMVPId_key" ON "flux_institutions"("submissionId", "casUsageMVPId");

-- AddForeignKey
ALTER TABLE "flux_institutions" ADD CONSTRAINT "flux_institutions_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flux_institutions" ADD CONSTRAINT "flux_institutions_casUsageMVPId_fkey" FOREIGN KEY ("casUsageMVPId") REFERENCES "cas_usage_mvp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
