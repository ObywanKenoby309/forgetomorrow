// scripts/backfill-slugs.js
// One-time script to generate slugs for all users who don't have one.
// Run with: node scripts/backfill-slugs.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function toSlugBase(firstName, lastName, email) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')   // remove special chars
      .replace(/\s+/g, '-')            // spaces to hyphens
      .replace(/-+/g, '-')             // collapse multiple hyphens
      .slice(0, 40);                   // keep it reasonable
  }
  // Fall back to email prefix
  return email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 7); // 5 char alphanumeric
}

async function main() {
  const users = await prisma.user.findMany({
    where: { slug: null },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  console.log(`Found ${users.length} users without a slug.`);

  if (users.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let updated = 0;
  let failed = 0;

  for (const user of users) {
    const base = toSlugBase(user.firstName, user.lastName, user.email);
    let slug = base;
    let attempts = 0;

    // Try base slug first, then base-XXXXX with random suffix on collision
    while (attempts < 10) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { slug },
        });
        console.log(`✅ ${user.email} → ${slug}`);
        updated++;
        break;
      } catch (err) {
        // P2002 = unique constraint violation
        if (err.code === 'P2002') {
          slug = `${base}-${randomSuffix()}`;
          attempts++;
        } else {
          console.error(`❌ ${user.email} — unexpected error:`, err.message);
          failed++;
          break;
        }
      }
    }

    if (attempts === 10) {
      console.error(`❌ ${user.email} — could not find unique slug after 10 attempts`);
      failed++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());