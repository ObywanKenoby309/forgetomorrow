// scripts/setCorporateBanner.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: {
      email: 'ericwjames309@gmail.com', // your CEO account email
    },
    data: {
      corporateBannerKey: 'CEO',       // must match the mapping key
      corporateBannerLocked: true,     // lock it so UI respects it
    },
  });

  console.log('Updated user:', {
    id: user.id,
    email: user.email,
    corporateBannerKey: user.corporateBannerKey,
    corporateBannerLocked: user.corporateBannerLocked,
  });
}

main()
  .catch((err) => {
    console.error('Error updating banner:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
