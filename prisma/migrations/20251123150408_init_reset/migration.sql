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
INSERT INTO "new_users" ("createdAt", "email", "emailVerificationExpiresAt", "emailVerificationToken", "emailVerified", "firstName", "id", "image", "lastName", "mfaEnabled", "mfaSecret", "name", "newsletter", "passwordHash", "plan", "role", "stripeCustomerId", "stripeSubscriptionId", "updatedAt") SELECT "createdAt", "email", "emailVerificationExpiresAt", "emailVerificationToken", "emailVerified", "firstName", "id", "image", "lastName", "mfaEnabled", "mfaSecret", "name", "newsletter", "passwordHash", "plan", "role", "stripeCustomerId", "stripeSubscriptionId", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_emailVerificationToken_key" ON "users"("emailVerificationToken");
CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
CREATE UNIQUE INDEX "users_stripeSubscriptionId_key" ON "users"("stripeSubscriptionId");
CREATE TABLE "new_verification_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "plan" TEXT,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_verification_tokens" ("createdAt", "email", "expiresAt", "firstName", "id", "lastName", "passwordHash", "plan", "token") SELECT "createdAt", "email", "expiresAt", "firstName", "id", "lastName", "passwordHash", "plan", "token" FROM "verification_tokens";
DROP TABLE "verification_tokens";
ALTER TABLE "new_verification_tokens" RENAME TO "verification_tokens";
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
