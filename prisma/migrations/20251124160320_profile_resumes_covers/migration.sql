/*
  Warnings:

  - Added the required column `name` to the `covers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `covers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `resumes` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_covers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "jobId" INTEGER,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "covers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "covers_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_covers" ("content", "createdAt", "id", "jobId", "userId") SELECT "content", "createdAt", "id", "jobId", "userId" FROM "covers";
DROP TABLE "covers";
ALTER TABLE "new_covers" RENAME TO "covers";
CREATE INDEX "covers_userId_idx" ON "covers"("userId");
CREATE INDEX "covers_jobId_idx" ON "covers"("jobId");
CREATE TABLE "new_resumes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_resumes" ("content", "createdAt", "id", "isPublic", "updatedAt", "userId") SELECT "content", "createdAt", "id", "isPublic", "updatedAt", "userId" FROM "resumes";
DROP TABLE "resumes";
ALTER TABLE "new_resumes" RENAME TO "resumes";
CREATE INDEX "resumes_userId_idx" ON "resumes"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
