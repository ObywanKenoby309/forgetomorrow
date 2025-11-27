-- CreateTable
CREATE TABLE "candidates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "location" TEXT,
    "match" INTEGER,
    "summary" TEXT,
    "skills" JSONB,
    "experience" JSONB,
    "activity" JSONB,
    "journey" JSONB,
    "tags" JSONB,
    "notes" TEXT,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "candidates_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "candidates_ownerId_idx" ON "candidates"("ownerId");
