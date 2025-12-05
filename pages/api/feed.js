// pages/api/feed.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  // Require login for now – this is a community feed
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = session.user;

  if (req.method === 'GET') {
    try {
      const posts = await prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return res.status(200).json({ posts });
    } catch (err) {
      console.error('[api/feed] GET error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { text, type } = req.body || {};
      const trimmed = (text || '').trim();

      if (!trimmed) {
        return res.status(400).json({ error: 'Post text is required' });
      }

      const authorName =
        user.name ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        (user.email ? user.email.split('@')[0] : 'ForgeTomorrow');

      const safeType =
        type === 'personal' || type === 'business' ? type : 'business';

      const post = await prisma.feedPost.create({
        data: {
          authorId: user.id,
          authorName,
          text: trimmed,
          type: safeType,     // 'business' | 'personal'
          audience: 'both',   // future: filter audiences
        },
      });

      return res.status(201).json({ post });
    } catch (err) {
      console.error('[api/feed] POST error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
