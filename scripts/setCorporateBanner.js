// scripts/setCorporateBanner.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: {
      email: "ericwjames309@gmail.com",
    },
    data: {
      corporateBannerKey: "CEO",
      corporateBannerLocked: true,
    },
  });

  console.log("Updated user:", {
    id: user.id,
    email: user.email,
    corporateBannerKey: user.corporateBannerKey,
    corporateBannerLocked: user.corporateBannerLocked,
  });
}

main()
  .catch((err) => {
    console.error("Error updating banner:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error("prisma.$disconnect() failed:", e);
    }
  });