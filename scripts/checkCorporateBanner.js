// scripts/checkCorporateBanner.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'ericwjames309@gmail.com' },
    select: {
      corporateBannerKey: true,
      corporateBannerLocked: true,
    },
  });

  console.log('Current banner fields:', user);
}

main()
  .catch((err) => {
    console.error('Error reading banner:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
