/*
  Warnings:

  - You are about to drop the column `changes` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `entity` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `entityId` on the `audit_logs` table. All the data in the column will be lost.
  - Added the required column `resource` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userEmail` to the `audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userRole` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "audit_logs_action_createdAt_idx";

-- DropIndex
DROP INDEX "audit_logs_userId_createdAt_idx";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "changes",
DROP COLUMN "entity",
DROP COLUMN "entityId",
ADD COLUMN     "details" JSONB,
ADD COLUMN     "resource" TEXT NOT NULL,
ADD COLUMN     "resourceId" TEXT,
ADD COLUMN     "resourceLabel" TEXT,
ADD COLUMN     "userEmail" TEXT NOT NULL,
ADD COLUMN     "userRole" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "logoutAt" TIMESTAMP(3),

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_tokenHash_key" ON "user_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "user_sessions_userId_idx" ON "user_sessions"("userId");

-- CreateIndex
CREATE INDEX "user_sessions_isActive_idx" ON "user_sessions"("isActive");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
