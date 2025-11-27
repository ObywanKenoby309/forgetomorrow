/*
  Warnings:

  - You are about to drop the `candidates` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "accountKey" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "accountKey" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "candidates";
PRAGMA foreign_keys=on;

-- CreateIndex
CREATE INDEX "jobs_accountKey_idx" ON "jobs"("accountKey");
