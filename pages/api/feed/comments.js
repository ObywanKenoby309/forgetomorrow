// pages/api/feed/comments.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function normalizeFeedPost(row) {
  return {
    id: row.id,
    authorId: row.authorId,
    author: row.authorName,
    body: row.content, // body is not used heavily here; comments are the key
    type: row.type || 'business',
    likes: row.likes ?? 0,
    comments: Array.isArray(row.comments) ? row.comments : [],
    createdAt: row.createdAt,
  };
}

function makeCommentId() {
  // stable enough for now without schema changes
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { postId, text } = req.body || {};
    const trimmed = (text || '').trim();

    if (!postId || !trimmed) {
      return res.status(400).json({
        error: 'Post id and non-empty text are required.',
      });
    }

    const idNum =
      typeof postId === 'string' ? parseInt(postId, 10) : Number(postId);
    if (!idNum || Number.isNaN(idNum)) {
      return res.status(400).json({ error: 'Invalid post id' });
    }

    const existing = await prisma.feedPost.findUnique({
      where: { id: idNum },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const user = session.user;
    const viewerId = user.id; // ✅ commenter id

    const displayName =
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      (user.email ? user.email.split('@')[0] : 'Someone');

    const avatarUrl = user.avatarUrl || user.image || null;

    const currentComments = Array.isArray(existing.comments)
      ? existing.comments
      : [];

    const newComment = {
      // ✅ NEW: stable comment id for deep links + like targeting
      id: makeCommentId(),

      // 🔹 This is what the UI will use to open MemberActions for the commenter
      authorId: viewerId,
      by: displayName,
      text: trimmed,
      at: new Date().toISOString(),
      avatarUrl, // used in UI for commenter avatar

      // ✅ NEW: comment-like tracking (separate from emojis)
      likes: 0,
      likedBy: [],
    };

    const updated = await prisma.feedPost.update({
      where: { id: idNum },
      data: {
        comments: [...currentComments, newComment],
      },
    });

    return res.status(200).json({ post: normalizeFeedPost(updated) });
  } catch (err) {
    console.error('[FEED COMMENT ERROR]', err);
    return res.status(500).json({
      error: 'Internal server error while adding comment.',
      detail: err?.message,
    });
  }
}
