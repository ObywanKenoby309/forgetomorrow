-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpiresAt" DATETIME,
    "passwordHash" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "name" TEXT,
    "image" TEXT,
    "headline" TEXT,
    "pronouns" TEXT,
    "location" TEXT,
    "status" TEXT,
    "avatarUrl" TEXT,
    "coverUrl" TEXT,
    "bannerMode" TEXT,
    "bannerHeight" INTEGER,
    "bannerFocalY" INTEGER,
    "isProfilePublic" BOOLEAN NOT NULL DEFAULT false,
    "wallpaperUrl" TEXT,
    "slug" TEXT,
    "slugChangeCount" INTEGER NOT NULL DEFAULT 0,
    "slugLastChangedAt" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'SEEKER',
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatarUrl", "coverUrl", "createdAt", "email", "emailVerificationExpiresAt", "emailVerificationToken", "emailVerified", "firstName", "headline", "id", "image", "lastName", "location", "mfaEnabled", "mfaSecret", "name", "newsletter", "passwordHash", "plan", "pronouns", "role", "slug", "slugChangeCount", "slugLastChangedAt", "status", "stripeCustomerId", "stripeSubscriptionId", "updatedAt") SELECT "avatarUrl", "coverUrl", "createdAt", "email", "emailVerificationExpiresAt", "emailVerificationToken", "emailVerified", "firstName", "headline", "id", "image", "lastName", "location", "mfaEnabled", "mfaSecret", "name", "newsletter", "passwordHash", "plan", "pronouns", "role", "slug", "slugChangeCount", "slugLastChangedAt", "status", "stripeCustomerId", "stripeSubscriptionId", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");
CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
CREATE UNIQUE INDEX "users_stripeSubscriptionId_key" ON "users"("stripeSubscriptionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
