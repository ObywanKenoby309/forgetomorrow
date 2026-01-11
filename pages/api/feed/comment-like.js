// pages/api/feed/comment-like.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function toNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
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
    const { postId, commentId, commentIndex } = req.body || {};

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

    // Find target comment: prefer id, fallback to index
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
    const likedBy = safeArray(target.likedBy).map((x) => String(x));
    const hasLiked = likedBy.includes(userId);

    let nextLikedBy;
    let nextLikes = toNumber(target.likes);

    if (hasLiked) {
      nextLikedBy = likedBy.filter((id) => id !== userId);
      nextLikes = Math.max(0, nextLikes - 1);
    } else {
      nextLikedBy = [...likedBy, userId];
      nextLikes = nextLikes + 1;
    }

    const nextComments = comments.map((c, i) => {
      if (i !== idx) return c;
      return {
        ...c,
        likes: nextLikes,
        likedBy: nextLikedBy,
      };
    });

    await prisma.feedPost.update({
      where: { id: idNum },
      data: { comments: nextComments },
      select: { id: true },
    });

    return res.status(200).json({
      ok: true,
      comment: {
        id: target.id ?? null,
        likes: nextLikes,
        hasLiked: !hasLiked,
      },
    });
  } catch (err) {
    console.error('[FEED COMMENT LIKE ERROR]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
