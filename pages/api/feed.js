// pages/api/feed.js
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

function extractTextFromBody(body) {
  // Defensive: handle string body, objects, and weird shapes
  if (!body) return '';

  // If the body is directly a string
  if (typeof body === 'string') {
    return body.trim();
  }

  if (typeof body !== 'object') {
    return '';
  }

  // Try the expected keys first
  let raw =
    body.text ??
    body.content ??
    body.body ??
    body.message ??
    body.caption ??
    body.title ??
    '';

  if (typeof raw !== 'string') {
    raw = '';
  }

  raw = raw.trim();

  // Last-resort fallback: use the first non-empty string field
  if (!raw) {
    for (const val of Object.values(body)) {
      if (typeof val === 'string' && val.trim()) {
        raw = val.trim();
        break;
      }
    }
  }

  return raw;
}

export default async function handler(req, res) {
  // ──────────────────────────
  // GET → list posts
  // ──────────────────────────
  if (req.method === 'GET') {
    try {
      const posts = await prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ posts });
    } catch (err) {
      console.error('[GET /api/feed] Error loading posts:', err);
      // Fail soft so the UI still renders
      return res.status(200).json({ posts: [] });
    }
  }

  // ──────────────────────────
  // POST → create post
  // ──────────────────────────
  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);

      if (!session?.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const body = req.body || {};

      // Helpful server-side log while we’re wiring this up
      console.log('[POST /api/feed] incoming body:', body);

      const text = extractTextFromBody(body);

      if (!text) {
        return res.status(400).json({ error: 'Post text is required' });
      }

      const type =
        body.type === 'personal' || body.type === 'business'
          ? body.type
          : 'business';

      const audience =
        body.audience === 'business' ||
        body.audience === 'personal' ||
        body.audience === 'both'
          ? body.audience
          : 'both';

      const post = await prisma.feedPost.create({
        data: {
          authorId: session.user.id,
          authorName:
            session.user.name ||
            [session.user.firstName, session.user.lastName]
              .filter(Boolean)
              .join(' ') ||
            (session.user.email
              ? session.user.email.split('@')[0]
              : 'Anonymous'),
          text,
          type,
          audience,
        },
      });

      return res.status(201).json({ post });
    } catch (err) {
      console.error('[POST /api/feed] Error creating post:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ──────────────────────────
  // Method not allowed
  // ──────────────────────────
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
