// pages/api/feed/comment-react.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

const ALLOWED_EMOJIS = ['👍', '🔥', '🎉', '👏', '❤️'];

function safeArray(v) {
  return Array.isArray(v) ? v : [];
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

    const userId = String(session.user.id);
    const { postId, commentId, commentIndex, emoji } = req.body || {};

    if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return res.status(400).json({ error: 'Invalid emoji' });
    }

    const idNum =
      typeof postId === 'string' ? parseInt(postId, 10) : Number(postId);
    if (!idNum || Number.isNaN(idNum)) {
      return res.status(400).json({ error: 'Invalid postId' });
    }

    const post = await prisma.feedPost.findUnique({
      where: { id: idNum },
      select: { id: true, comments: true },
    });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comments = safeArray(post.comments);

    // Find target comment — prefer id, fallback to index
    let idx = -1;
    if (commentId) {
      const cid = String(commentId);
      idx = comments.findIndex((c) => c && String(c.id || '') === cid);
    }
    if (idx === -1 && commentIndex !== undefined && commentIndex !== null) {
      const i = Number(commentIndex);
      if (Number.isFinite(i) && i >= 0 && i < comments.length) idx = i;
    }
    if (idx === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const target = comments[idx] || {};

    // Self-reaction prevention
    const commentAuthorId = String(target.authorId || target.userId || '').trim();
    if (commentAuthorId && commentAuthorId === userId) {
      return res.status(403).json({ error: 'Cannot react to your own comment' });
    }

    // Normalize reactions — handle old likes/likedBy shape for backward compat
    let currentReactions = safeArray(target.reactions);
    if (!currentReactions.length && safeArray(target.likedBy).length) {
      const oldLikedBy = safeArray(target.likedBy).map(String);
      currentReactions = [{ emoji: '👍', count: oldLikedBy.length, userIds: oldLikedBy }];
    }

    // Toggle this emoji reaction
    const reactionIdx = currentReactions.findIndex((r) => r?.emoji === emoji);
    let updatedReactions;

    if (reactionIdx === -1) {
      // First reaction with this emoji
      updatedReactions = [...currentReactions, { emoji, count: 1, userIds: [userId] }];
    } else {
      const existing = currentReactions[reactionIdx];
      const userIds = safeArray(existing.userIds).map(String);
      const hasReacted = userIds.includes(userId);

      if (hasReacted) {
        const nextUserIds = userIds.filter((id) => id !== userId);
        updatedReactions = nextUserIds.length === 0
          ? currentReactions.filter((_, i) => i !== reactionIdx)
          : currentReactions.map((r, i) =>
              i === reactionIdx ? { ...r, count: nextUserIds.length, userIds: nextUserIds } : r
            );
      } else {
        const nextUserIds = [...userIds, userId];
        updatedReactions = currentReactions.map((r, i) =>
          i === reactionIdx ? { ...r, count: nextUserIds.length, userIds: nextUserIds } : r
        );
      }
    }

    // Write back — drop old likes/likedBy fields
    const nextComments = comments.map((c, i) => {
      if (i !== idx) return c;
      const { likes: _l, likedBy: _lb, ...rest } = c;
      return { ...rest, reactions: updatedReactions };
    });

    await prisma.feedPost.update({
      where: { id: idNum },
      data: { comments: nextComments },
      select: { id: true },
    });

    const updatedReaction = updatedReactions.find((r) => r?.emoji === emoji);
    const hasReacted = safeArray(updatedReaction?.userIds).map(String).includes(userId);

    return res.status(200).json({
      ok: true,
      comment: {
        id: target.id ?? null,
        reactions: updatedReactions,
        emoji,
        hasReacted,
        count: updatedReaction?.count ?? 0,
      },
    });
  } catch (err) {
    console.error('[FEED COMMENT REACT ERROR]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}