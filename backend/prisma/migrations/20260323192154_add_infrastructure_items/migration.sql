-- CreateTable
CREATE TABLE "infrastructure_items" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "element" TEXT NOT NULL,
    "disponibilite" BOOLEAN,
    "qualifications" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infrastructure_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "infrastructure_items_submissionId_idx" ON "infrastructure_items"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "infrastructure_items_submissionId_domain_element_key" ON "infrastructure_items"("submissionId", "domain", "element");

-- AddForeignKey
ALTER TABLE "infrastructure_items" ADD CONSTRAINT "infrastructure_items_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
