// pages/api/feed.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// Helper: parse FeedPost.content into { body, attachments[] }
function mapFeedPostRow(row) {
  let body = row.content || '';
  let attachments = [];

  // Parse the JSON-encoded content field: { body, attachments[] }
  try {
    const parsed = JSON.parse(row.content);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.body === 'string') body = parsed.body;
      if (Array.isArray(parsed.attachments)) attachments = parsed.attachments;
    }
  } catch {
    // content was plain text, ignore
  }

  // 🔹 Safely parse comments coming back from Prisma
  let comments = [];
  const rawComments = row.comments;

  if (Array.isArray(rawComments)) {
    comments = rawComments;
  } else if (typeof rawComments === 'string') {
    try {
      const parsed = JSON.parse(rawComments);
      if (Array.isArray(parsed)) comments = parsed;
    } catch {
      // ignore bad JSON, keep empty
    }
  }

  return {
    id: row.id,
    authorId: row.authorId,
    author: row.authorName,
    body,
    type: row.type || 'business',
    createdAt: row.createdAt,
    likes: row.likes ?? 0,
    comments,        // ✅ use DB-stored comments
    attachments,
  };
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method === 'GET') {
    try {
      const rows = await prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      const posts = rows.map(mapFeedPostRow);
      return res.status(200).json({ posts });
    } catch (err) {
      console.error('[FEED GET ERROR]', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { text, type, attachments } = req.body || {};
      const body = (text || '').toString().trim();

      if (!body) {
        return res.status(400).json({ error: 'Post text is required' });
      }

      const u = session.user;
      const authorId = u.id;
      const authorName =
        u.name ||
        [u.firstName, u.lastName].filter(Boolean).join(' ') ||
        (u.email ? u.email.split('@')[0] : 'Someone');

      const contentObj = {
        body,
        attachments: Array.isArray(attachments) ? attachments : [],
      };

      const created = await prisma.feedPost.create({
        data: {
          authorId,
          authorName,
          content: JSON.stringify(contentObj),
          type: type === 'personal' ? 'personal' : 'business',
          // likes + comments will use defaults from schema
        },
      });

      const post = mapFeedPostRow(created);
      return res.status(201).json({ post });
    } catch (err) {
      console.error('[FEED POST ERROR]', err);
      return res
        .status(500)
        .json({ error: 'Internal server error', detail: err.message });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
