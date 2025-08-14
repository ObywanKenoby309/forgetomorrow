-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "companyId" TEXT,
    "jobId" TEXT,
    "recruiterId" TEXT,
    "applicationId" TEXT,
    "metadata" JSONB
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_jobId_idx" ON "AnalyticsEvent"("jobId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_recruiterId_idx" ON "AnalyticsEvent"("recruiterId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx" ON "AnalyticsEvent"("eventType", "createdAt");
