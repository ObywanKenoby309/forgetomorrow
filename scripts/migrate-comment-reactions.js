// scripts/migrate-comment-reactions.js
// Run once: node scripts/migrate-comment-reactions.js
// Converts old { likes, likedBy } comment shape to { reactions: [{ emoji, count, userIds }] }

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('Fetching posts with comments...');

  const posts = await prisma.feedPost.findMany({
    select: { id: true, comments: true },
  });

  console.log(`Found ${posts.length} posts. Checking for migration...`);

  let updated = 0;
  let skipped = 0;

  for (const post of posts) {
    const comments = Array.isArray(post.comments) ? post.comments : [];
    let changed = false;

    const newComments = comments.map((c) => {
      if (!c || typeof c !== 'object') return c;

      // Already in new format
      if (Array.isArray(c.reactions)) {
        return c;
      }

      // Old format — convert likes/likedBy to reactions
      changed = true;
      const likedBy = Array.isArray(c.likedBy)
        ? c.likedBy.map((id) => String(id)).filter(Boolean)
        : [];

      const reactions =
        likedBy.length > 0
          ? [{ emoji: '👍', count: likedBy.length, userIds: likedBy }]
          : [];

      const { likes: _l, likedBy: _lb, ...rest } = c;
      return { ...rest, reactions };
    });

    if (changed) {
      await prisma.feedPost.update({
        where: { id: post.id },
        data: { comments: newComments },
      });
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\nMigration complete.`);
  console.log(`  Updated: ${updated} posts`);
  console.log(`  Already current: ${skipped} posts`);

  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});