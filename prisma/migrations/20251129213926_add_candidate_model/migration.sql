-- CreateTable
CREATE TABLE "candidates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "location" TEXT,
    "role" TEXT,
    "title" TEXT,
    "currentTitle" TEXT,
    "workStatus" TEXT,
    "preferredWorkType" TEXT,
    "willingToRelocate" TEXT,
    "skills" TEXT,
    "languages" TEXT,
    "tags" TEXT,
    "notes" TEXT,
    "source" TEXT,
    "pipelineStage" TEXT,
    "match" INTEGER,
    "lastContacted" DATETIME,
    "lastSeen" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "candidates_userId_idx" ON "candidates"("userId");
