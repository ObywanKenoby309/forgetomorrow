-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Recruiter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "jobId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "views" INTEGER NOT NULL,
    "clicks" INTEGER NOT NULL,
    "applies" INTEGER NOT NULL,
    "interviews" INTEGER NOT NULL,
    "offers" INTEGER NOT NULL,
    "hires" INTEGER NOT NULL,
    "srcForge" INTEGER NOT NULL,
    "srcRef" INTEGER NOT NULL,
    "srcBoards" INTEGER NOT NULL,
    "messages" INTEGER NOT NULL,
    "responses" INTEGER NOT NULL,
    CONSTRAINT "DailyMetric_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DailyMetric_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "Recruiter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DailyMetric_date_idx" ON "DailyMetric"("date");

-- CreateIndex
CREATE INDEX "DailyMetric_jobId_idx" ON "DailyMetric"("jobId");

-- CreateIndex
CREATE INDEX "DailyMetric_recruiterId_idx" ON "DailyMetric"("recruiterId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_date_jobId_recruiterId_key" ON "DailyMetric"("date", "jobId", "recruiterId");
