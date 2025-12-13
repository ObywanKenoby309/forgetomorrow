// pages/api/feed/react.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function normalizeReactions(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  if (typeof raw === 'object') {
    // If somehow stored as object map, convert to array
    return Array.isArray(raw) ? raw : [];
  }

  return [];
}

function toggleReaction(reactions, userId, emoji) {
  const next = Array.isArray(reactions) ? [...reactions] : [];
  const idx = next.findIndex((r) => r && r.emoji === emoji);

  if (idx === -1) {
    // First time anyone has used this emoji
    next.push({
      emoji,
      count: 1,
      userIds: [userId],
    });
    return next;
  }

  const entry = next[idx] || {};
  const existingUserIds = Array.isArray(entry.userIds) ? entry.userIds : [];
  const hasUser = existingUserIds.includes(userId);

  if (hasUser) {
    // Toggle OFF for this user
    const newUserIds = existingUserIds.filter((id) => id !== userId);
    const baseCount =
      typeof entry.count === 'number' ? entry.count : existingUserIds.length;
    const newCount = Math.max(0, baseCount - 1);

    if (newCount <= 0 && newUserIds.length === 0) {
      // Remove the reaction bucket entirely
      next.splice(idx, 1);
    } else {
      next[idx] = {
        ...entry,
        userIds: newUserIds,
        count: newCount,
      };
    }
  } else {
    // Toggle ON for this user
    const newUserIds = [...existingUserIds, userId];
    const baseCount =
      typeof entry.count === 'number' ? entry.count : existingUserIds.length;
    next[idx] = {
      ...entry,
      userIds: newUserIds,
      count: baseCount + 1,
    };
  }

  return next;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;
    const { postId, emoji } = req.body || {};

    // Basic validation
    if (postId === undefined || postId === null || postId === '') {
      return res.status(400).json({ error: 'postId is required' });
    }
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'emoji is required' });
    }

    // Support either numeric or string post IDs, so we don't blow up on CUIDs
    const maybeNumber = Number(postId);
    const useNumeric =
      !Number.isNaN(maybeNumber) && `${maybeNumber}` === `${postId}`;

    const where = useNumeric
      ? { id: maybeNumber }
      : { id: String(postId) };

    const existing = await prisma.feedPost.findUnique({
      where,
      select: { id: true, reactions: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const currentReactions = normalizeReactions(existing.reactions);
    const updatedReactions = toggleReaction(currentReactions, userId, emoji);

    const saved = await prisma.feedPost.update({
      where,
      data: {
        reactions: updatedReactions,
      },
      select: { id: true, reactions: true },
    });

    return res.status(200).json({
      postId: saved.id,
      reactions: saved.reactions || [],
    });
  } catch (err) {
    console.error('[FEED REACT ERROR]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
