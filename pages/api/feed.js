// pages/api/feed.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function normalizeFeedPost(row) {
  return {
    id: row.id,
    authorId: row.authorId,
    author: row.authorName,
    body: row.content,
    type: row.type || 'business',
    likes: row.likes ?? 0,
    comments: Array.isArray(row.comments) ? row.comments : [],
    createdAt: row.createdAt,
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rows = await prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const posts = rows.map(normalizeFeedPost);
      return res.status(200).json({ posts });
    } catch (err) {
      console.error('[FEED GET ERROR]', err);
      return res
        .status(500)
        .json({ error: 'Internal server error while loading feed.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { text, type } = req.body || {};
      const bodyText = (text || '').trim();

      if (!bodyText) {
        return res.status(400).json({ error: 'Post text is required' });
      }

      const postType =
        type === 'personal' || type === 'business' ? type : 'business';

      const user = session.user;
      const displayName =
        user.name ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        (user.email ? user.email.split('@')[0] : 'Someone');

      const created = await prisma.feedPost.create({
        data: {
          authorId: user.id,
          authorName: displayName,
          content: bodyText,
          type: postType,
          likes: 0,
          comments: [],
        },
      });

      return res.status(200).json({ post: normalizeFeedPost(created) });
    } catch (err) {
      console.error('[FEED POST ERROR]', err);
      return res.status(500).json({
        error: 'Internal server error while creating post.',
        detail: err?.message,
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
