-- AlterTable
ALTER TABLE "users" ADD COLUMN "aboutMe" TEXT;
ALTER TABLE "users" ADD COLUMN "hobbiesJson" JSONB;
ALTER TABLE "users" ADD COLUMN "languagesJson" JSONB;
ALTER TABLE "users" ADD COLUMN "skillsJson" JSONB;
ALTER TABLE "users" ADD COLUMN "workPreferences" JSONB;
