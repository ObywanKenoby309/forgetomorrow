// prisma/seed.js
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@forgetomorrow.com";

  // If you want to set a plain password, generate it here instead:
  // const passwordHash = await bcrypt.hash("ChangeMe123!", 10);
  // Using existing pre-hashed password (from your earlier seed) for convenience:
  const passwordHash = "$2b$10$rmTG94GuJNYjRfVmgD396exB1h0SntgZPXBZHQHgWNCsgWcpNVoxO";

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
      // Now valid since ADMIN is added to the enum
      role: "ADMIN",
      plan: "ENTERPRISE",
      emailVerified: true,
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
