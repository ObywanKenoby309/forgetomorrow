// prisma/seed.js
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@forgetomorrow.com";

  // Using your pre-hashed password
  const passwordHash =
    "$2b$10$rmTG94GuJNYjRfVmgD396exB1h0SntgZPXBZHQHgWNCsgWcpNVoxO";

  console.log("Seeding admin user:", adminEmail);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: "Platform",
      lastName: "Admin",
      name: "Platform Admin",
      role: "ADMIN",
      plan: "ENTERPRISE",
      emailVerified: true,
      newsletter: true,

      // NEW FIELDS — explicit nulls so seed never fails
      slug: null,
      slugChangeCount: 0,
      slugLastChangedAt: null,
      mfaEnabled: false,
      mfaSecret: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    },
  });

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
