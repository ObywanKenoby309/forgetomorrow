-- AlterTable
ALTER TABLE "users" ADD COLUMN "deletedAt" DATETIME;

-- CreateTable
CREATE TABLE "user_consents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "region" TEXT,
    "given" BOOLEAN NOT NULL DEFAULT true,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "user_consents_userId_idx" ON "user_consents"("userId");

-- CreateIndex
CREATE INDEX "user_consents_userId_consentType_idx" ON "user_consents"("userId", "consentType");
