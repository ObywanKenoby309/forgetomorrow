// pages/api/feed.js
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

function mapPost(p) {
  const authorFromUser =
    p.author?.name ||
    [p.author?.firstName, p.author?.lastName].filter(Boolean).join(' ') ||
    'ForgeTomorrow user';

  return {
    id: p.id,
    authorId: p.authorId,
    author: p.authorName || authorFromUser,
    content: p.content,
    type: p.type || 'business',
    createdAt: p.createdAt,
  };
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const posts = await prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          author: {
            select: {
              name: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return res.status(200).json({
        posts: posts.map(mapPost),
      });
    } catch (err) {
      console.error('[GET /api/feed] error', err);
      return res.status(500).json({ error: 'Failed to load feed.' });
    }
  }

  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { content, type } = req.body || {};
      const text = (content || '').toString().trim();

      if (!text) {
        return res.status(400).json({ error: 'Post content is required.' });
      }

      const normalizedType =
        type && ['business', 'personal'].includes(type) ? type : 'business';

      const created = await prisma.feedPost.create({
        data: {
          authorId: session.user.id,
          content: text,
          type: normalizedType,
        },
        include: {
          author: {
            select: {
              name: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return res.status(201).json({
        post: mapPost(created),
      });
    } catch (err) {
      console.error('[POST /api/feed] error', err);
      return res.status(500).json({ error: 'Failed to create post.' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
