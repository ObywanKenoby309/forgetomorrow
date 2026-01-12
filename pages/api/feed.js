// pages/api/feed.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// Helper: parse FeedPost.content into { body, attachments[] }
function mapFeedPostRow(row, userMap, viewerId) {
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

  // ✅ MIN CHANGE: normalize comment fields for UI + likes/unlikes
  // - ensure likes is a number
  // - ensure likedBy is an array
  // - derive hasLiked for the CURRENT viewer from likedBy
  // - hydrate avatarUrl from userMap if missing
  try {
    const vid = viewerId ? String(viewerId) : null;

    comments = (Array.isArray(comments) ? comments : []).map((c) => {
      if (!c || typeof c !== 'object') return c;

      const likes = Number(c.likes);
      const safeLikes = Number.isFinite(likes) ? likes : 0;

      const likedBy = Array.isArray(c.likedBy) ? c.likedBy.map((x) => String(x)) : [];
      const hasLiked = vid ? likedBy.includes(vid) : false;

      // ✅ NEW: hydrate commenter avatar if missing (fallback)
      let avatarUrl = c.avatarUrl || null;
      try {
        const authorId = c.authorId ? String(c.authorId) : '';
        if (!avatarUrl && userMap && authorId) {
          const u = userMap.get(authorId);
          if (u) avatarUrl = u.avatarUrl || u.image || null;
        }
      } catch {
        // ignore
      }

      return {
        ...c,
        likes: safeLikes,
        likedBy,
        hasLiked, // ✅ critical for consistent like/unlike behavior on refresh
        avatarUrl,
      };
    });
  } catch {
    // ignore (best-effort)
  }

  // 🔹 Safely parse reactions coming back from Prisma
  let reactions = [];
  const rawReactions = row.reactions;

  if (Array.isArray(rawReactions)) {
    reactions = rawReactions;
  } else if (typeof rawReactions === 'string') {
    try {
      const parsed = JSON.parse(rawReactions);
      if (Array.isArray(parsed)) reactions = parsed;
    } catch {
      // ignore bad JSON, keep empty
    }
  } else if (rawReactions && typeof rawReactions === 'object') {
    // Prisma Json may already be parsed
    reactions = Array.isArray(rawReactions) ? rawReactions : [];
  }

  // 🔹 Lookup author avatar from userMap (if provided)
  let authorAvatar = null;
  if (userMap && row.authorId) {
    const u = userMap.get(row.authorId);
    if (u) {
      authorAvatar = u.avatarUrl || u.image || null;
    }
  }

  return {
    id: row.id,
    authorId: row.authorId,
    author: row.authorName,
    authorAvatar, // ✅ used by PostCard header
    body,
    type: row.type || 'business',
    createdAt: row.createdAt,
    likes: row.likes ?? 0,
    comments,
    attachments,
    reactions,
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

      // ✅ MIN CHANGE: also hydrate commenter avatars, not just post authors
      const authorIds = new Set();
      const commenterIds = new Set();

      for (const r of rows) {
        if (r?.authorId) authorIds.add(String(r.authorId));

        // pull commenter ids out of JSON (best-effort)
        const raw = r?.comments;
        let arr = [];
        if (Array.isArray(raw)) {
          arr = raw;
        } else if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) arr = parsed;
          } catch {
            // ignore
          }
        }

        for (const c of arr) {
          if (c && typeof c === 'object' && c.authorId) {
            commenterIds.add(String(c.authorId));
          }
        }
      }

      const allUserIds = Array.from(new Set([...authorIds, ...commenterIds])).filter(Boolean);

      let userMap = null;
      if (allUserIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: allUserIds } },
          select: { id: true, avatarUrl: true, image: true },
        });
        userMap = new Map(users.map((u) => [String(u.id), u]));
      }

      // ✅ pass viewerId so we can compute hasLiked on comments
      const viewerId = String(session.user.id);
      const posts = rows.map((row) => mapFeedPostRow(row, userMap, viewerId));

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
          // likes, comments, reactions use defaults from schema
        },
      });

      // 🔹 Build a tiny userMap for this single author so avatar works on echo
      const authorAvatar = u.avatarUrl || u.image || null;

      // ✅ pass viewerId so comment hasLiked is correct if any
      const basePost = mapFeedPostRow(created, null, String(session.user.id));
      const post = {
        ...basePost,
        authorAvatar,
      };

      return res.status(201).json({ post });
    } catch (err) {
      console.error('[FEED POST ERROR]', err);
      return res.status(500).json({ error: 'Internal server error', detail: err.message });
    }
  }

  res.setHeader('Allow', 'GET,POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
