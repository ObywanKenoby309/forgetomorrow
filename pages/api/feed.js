// pages/api/feed.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const posts = await prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return res.status(200).json({
        posts: posts.map((p) => ({
          id: p.id,
          authorId: p.authorId,
          author: p.authorName,
          body: p.text,
          type: p.type || 'business',
          audience: p.audience || 'both',
          createdAt: p.createdAt,
          likes: 0,
          comments: [],
        })),
      });
    } catch (err) {
      console.error('[FEED API] GET error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { text, type } = req.body || {};
      const trimmed = (text || '').trim();

      if (!trimmed) {
        return res.status(400).json({ error: 'Post text is required' });
      }

      const safeType =
        type === 'personal' || type === 'business' ? type : 'business';

      const authorName =
        session.user.name ||
        [session.user.firstName, session.user.lastName]
          .filter(Boolean)
          .join(' ') ||
        (session.user.email ? session.user.email.split('@')[0] : 'Someone');

      // IMPORTANT: include `content` because your DB schema requires it
      const created = await prisma.feedPost.create({
        data: {
          authorId: session.user.id,
          authorName,
          text: trimmed,
          content: trimmed, // ← this satisfies the required field
          type: safeType,
          audience: 'both',
        },
      });

      const responsePost = {
        id: created.id,
        authorId: created.authorId,
        author: created.authorName,
        body: created.text,
        type: created.type,
        audience: created.audience,
        createdAt: created.createdAt,
        likes: 0,
        comments: [],
      };

      return res.status(200).json({ post: responsePost });
    } catch (err) {
      console.error('[FEED API] POST error', err);
      return res
        .status(500)
        .json({ error: 'Internal server error', detail: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
