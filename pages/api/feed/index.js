// pages/api/feed/index.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Safe — attachments are now URLs, not base64
    },
  },
};

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // ─── GET: fetch feed posts ───────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const skip = (page - 1) * limit;

      const posts = await prisma.feedPost.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      // Fetch author avatars + slug from users table
      const authorIds = [...new Set(posts.map((p) => p.authorId).filter(Boolean))];
      const authors = authorIds.length
        ? await prisma.user.findMany({
            where: { id: { in: authorIds } },
            select: { id: true, slug: true, avatarUrl: true, image: true },
          })
        : [];

      const authorMap = Object.fromEntries(
        authors.map((u) => [
          u.id,
          {
            authorSlug: u.slug || null,
            authorAvatar: u.avatarUrl || u.image || null,
          },
        ])
      );

      const postsWithAvatars = posts.map((p) => ({
        ...p,
        authorSlug: authorMap[p.authorId]?.authorSlug || null,
        authorAvatar: authorMap[p.authorId]?.authorAvatar || null,
      }));

      return res.status(200).json({ posts: postsWithAvatars });
    } catch (err) {
      console.error('[FEED GET ERROR]', err);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }

  // ─── POST: create a new feed post ───────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { body, type, attachments } = req.body || {};

      if (!body || typeof body !== 'string' || !body.trim()) {
        return res.status(400).json({ error: 'Post body is required' });
      }

      if (!['business', 'personal'].includes(type)) {
        return res.status(400).json({ error: 'type must be "business" or "personal"' });
      }

      // Validate attachments — must all be plain https:// URLs, never base64
      const safeAttachments = Array.isArray(attachments)
        ? attachments.filter((a) => {
            if (!a || typeof a.url !== 'string') return false;
            if (a.url.startsWith('data:')) {
              console.warn('[FEED POST] Rejected base64 attachment — use /api/feed/upload first');
              return false;
            }
            return true;
          })
        : [];

      const user = session.user;
      const authorName =
        user.name ||
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.email ||
        'Anonymous';

      const post = await prisma.feedPost.create({
        data: {
          authorId: user.id,
          authorName,
          content: body.trim(),
          type,
          attachments: safeAttachments,
          likes: 0,
          comments: [],
          reactions: [],
        },
      });

      // Return the new post with the author's avatar + slug attached
      const author = await prisma.user.findUnique({
        where: { id: user.id },
        select: { slug: true, avatarUrl: true, image: true },
      });

      return res.status(201).json({
        post: {
          ...post,
          authorSlug: author?.slug || null,
          authorAvatar: author?.avatarUrl || author?.image || null,
        },
      });
    } catch (err) {
      console.error('[FEED POST ERROR]', err);
      return res.status(500).json({ error: 'Failed to create post' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}