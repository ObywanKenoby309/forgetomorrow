// pages/api/feed.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  // ─────────────────────────────────────────────────────────────
  // GET – load recent posts
  // ─────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const posts = await prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Map DB → UI shape expected by PostCard/PostCommentsModal
      const mapped = posts.map((p) => ({
        id: p.id,
        authorId: p.authorId,
        author: p.authorName || 'Member',
        body: p.content, // 👈 main text
        type: p.type || 'business',
        createdAt: p.createdAt,
        likes: 0,
        comments: [],
      }));

      return res.status(200).json({ posts: mapped });
    } catch (err) {
      console.error('[FEED GET ERROR]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // POST – create a new post
  // ─────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { text, type } = req.body || {};
      const cleanText = (text ?? '').toString().trim();
      const cleanType = (type ?? '').toString().toLowerCase();

      if (!cleanText) {
        return res.status(400).json({ error: 'Post text is required' });
      }

      if (cleanType !== 'business' && cleanType !== 'personal') {
        return res.status(400).json({ error: 'Invalid post type' });
      }

      const user = session.user;

      const authorName =
        user.name ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        (user.email ? user.email.split('@')[0] : 'Member');

      // 👇 match your Prisma schema: content + type, NO `text` field
      const dbPost = await prisma.feedPost.create({
        data: {
          authorId: user.id,
          authorName,
          content: cleanText,
          type: cleanType,
        },
      });

      // Return in the same shape as GET so the UI can use it directly
      const post = {
        id: dbPost.id,
        authorId: dbPost.authorId,
        author: dbPost.authorName || 'Member',
        body: dbPost.content,
        type: dbPost.type || 'business',
        createdAt: dbPost.createdAt,
        likes: 0,
        comments: [],
      };

      return res.status(201).json({ post });
    } catch (err) {
      console.error('[FEED POST ERROR]', err);
      return res.status(500).json({
        error: 'Internal server error',
        detail: err?.message ?? String(err),
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Fallback
  // ─────────────────────────────────────────────────────────────
  res.setHeader('Allow', 'GET,POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
