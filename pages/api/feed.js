// pages/api/feed.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  // Authenticate user (required for posting)
  const session = await getServerSession(req, res, authOptions);

  if (req.method === 'GET') {
    try {
      const posts = await prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      return res.status(200).json({ posts });
    } catch (err) {
      console.error('Feed GET error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { text, type } = req.body || {};

      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Post text is required' });
      }

      const user = session.user;
      const authorName =
        user.name ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.email?.split('@')[0] ||
        'Unknown';

      const saved = await prisma.feedPost.create({
        data: {
          authorId: user.id,
          authorName,
          text: text.trim(),
          type: type || 'business',
          audience: 'both',
        },
      });

      return res.status(200).json({ post: saved });
    } catch (err) {
      console.error('Feed POST error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
