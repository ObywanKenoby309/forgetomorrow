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
    return Array.isArray(raw) ? raw : [];
  }

  return [];
}

function toggleReaction(reactions, userId, emoji) {
  const next = Array.isArray(reactions) ? [...reactions] : [];
  const idx = next.findIndex((r) => r && r.emoji === emoji);

  if (idx === -1) {
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
    const newUserIds = existingUserIds.filter((id) => id !== userId);
    const baseCount =
      typeof entry.count === 'number' ? entry.count : existingUserIds.length;
    const newCount = Math.max(0, baseCount - 1);

    if (newCount <= 0 && newUserIds.length === 0) {
      next.splice(idx, 1);
    } else {
      next[idx] = {
        ...entry,
        userIds: newUserIds,
        count: newCount,
      };
    }
  } else {
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

    if (postId === undefined || postId === null) {
      return res.status(400).json({ error: 'postId is required' });
    }
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ error: 'emoji is required' });
    }

    // Support both Int and String IDs
    const rawId = postId;
    let whereId;

    if (typeof rawId === 'number') {
      whereId = rawId;
    } else if (typeof rawId === 'string' && /^\d+$/.test(rawId)) {
      // numeric string → Int ID
      whereId = Number(rawId);
    } else {
      // cuid / uuid / any other string
      whereId = String(rawId);
    }

    const existing = await prisma.feedPost.findUnique({
      where: { id: whereId },
      select: { id: true, reactions: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const currentReactions = normalizeReactions(existing.reactions);
    const updatedReactions = toggleReaction(currentReactions, userId, emoji);

    let saved;
    try {
      saved = await prisma.feedPost.update({
        where: { id: whereId },
        data: {
          reactions: updatedReactions,
        },
        select: { id: true, reactions: true },
      });
    } catch (err) {
      console.error('[FEED REACT UPDATE ERROR]', err);

      // If the DB schema does not yet have `reactions`, fail gracefully
      const msg = err?.message || '';
      if (msg.includes('Unknown argument') && msg.includes('reactions')) {
        // Don’t crash the UI; just no-op for now
        return res.status(200).json({
          postId: existing.id,
          reactions: currentReactions,
          note: 'reactions field missing from schema; update Prisma model to persist.',
        });
      }

      throw err;
    }

    return res.status(200).json({
      postId: saved.id,
      reactions: saved.reactions || [],
    });
  } catch (err) {
    console.error('[FEED REACT ERROR]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
