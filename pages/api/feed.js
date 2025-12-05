// pages/api/feed.js
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

// One-time safety: make sure the table exists in Postgres
async function ensureFeedTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "feed_posts" (
        "id"         SERIAL PRIMARY KEY,
        "authorId"   TEXT      NOT NULL,
        "authorName" TEXT      NOT NULL,
        "content"    TEXT      NOT NULL,
        "type"       TEXT      NOT NULL DEFAULT 'business',
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "feed_posts_authorId_idx"
      ON "feed_posts"("authorId")
    `);
  } catch (err) {
    console.error('[feed] ensureFeedTable failed:', err);
  }
}

function mapPost(row) {
  return {
    id: row.id,
    authorId: row.authorId,
    author: row.authorName,
    createdAt: row.createdAt,
    type: row.type || 'business',
    text: row.content,
    likes: 0,
    comments: [],
  };
}

export default async function handler(req, res) {
  try {
    await ensureFeedTable();

    if (req.method === 'GET') {
      const rows = await prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return res.status(200).json({ posts: rows.map(mapPost) });
    }

    if (req.method === 'POST') {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { text, type } = req.body || {};
      if (!text || !String(text).trim()) {
        return res.status(400).json({ error: 'Post text is required' });
      }

      const authorName =
        session.user.name ||
        [session.user.firstName, session.user.lastName].filter(Boolean).join(' ') ||
        (session.user.email ? session.user.email.split('@')[0] : 'ForgeTomorrow');

      const row = await prisma.feedPost.create({
        data: {
          authorId: session.user.id,
          authorName,
          content: String(text).trim(),
          type: type === 'personal' ? 'personal' : 'business',
        },
      });

      return res.status(201).json({ post: mapPost(row) });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[feed] API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
