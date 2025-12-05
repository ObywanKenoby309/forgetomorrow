// pages/api/feed.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  // Top-level debug log so we can see exactly what is hitting prod
  console.log('[api/feed] incoming', {
    method: req.method,
    url: req.url,
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
    },
    body: req.body,
  });

  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error('[api/feed] getServerSession error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      detail: 'getServerSession failed',
    });
  }

  if (!session?.user) {
    console.warn('[api/feed] no session user present');
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = session.user;

  if (req.method === 'GET') {
    try {
      const rows = await prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Shape rows into what the UI expects
      const posts = rows.map((row) => ({
        id: row.id,
        authorId: row.authorId,
        author: row.authorName,
        body: row.text,
        type: row.type, // 'business' | 'personal'
        createdAt: row.createdAt,
        likes: 0,
        comments: [],
      }));

      console.log('[api/feed] GET returning', posts.length, 'posts');
      return res.status(200).json({ posts });
    } catch (err) {
      console.error('[api/feed] GET error:', err);
      return res.status(500).json({
        error: 'Internal server error',
        detail: err.code || err.message || String(err),
      });
    }
  }

  if (req.method === 'POST') {
    try {
      const { text, body: bodyText, type } = req.body || {};

      // Accept either { text } or { body } just in case
      const raw = typeof text !== 'undefined' ? text : bodyText;
      const trimmed = (raw || '').toString().trim();

      if (!trimmed) {
        console.warn('[api/feed] POST without text', req.body);
        return res.status(400).json({ error: 'Post text is required' });
      }

      const authorName =
        user.name ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        (user.email ? user.email.split('@')[0] : 'ForgeTomorrow');

      const safeType =
        type === 'personal' || type === 'business' ? type : 'business';

      console.log('[api/feed] creating post', {
        authorId: user.id,
        authorName,
        type: safeType,
      });

      const created = await prisma.feedPost.create({
        data: {
          authorId: user.id || 'unknown', // defensive: never null
          authorName,
          text: trimmed,
          type: safeType,
          audience: 'both',
        },
      });

      const post = {
        id: created.id,
        authorId: created.authorId,
        author: created.authorName,
        body: created.text,
        type: created.type,
        createdAt: created.createdAt,
        likes: 0,
        comments: [],
      };

      console.log('[api/feed] POST created id', created.id);
      return res.status(201).json({ post });
    } catch (err) {
      console.error('[api/feed] POST error:', err);
      return res.status(500).json({
        error: 'Internal server error',
        detail: err.code || err.message || String(err),
      });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
