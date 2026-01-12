// pages/api/feed/comment-delete.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

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
    const authorId = target?.authorId ? String(target.authorId) : '';

    // ✅ Only comment author can delete (for now)
    if (!authorId || authorId !== userId) {
      return res.status(403).json({ error: 'Not allowed to delete this comment' });
    }

    // Already deleted? Treat as OK (idempotent)
    if (target?.deleted === true) {
      return res.status(200).json({ ok: true, alreadyDeleted: true });
    }

    const nowIso = new Date().toISOString();

    const nextComments = comments.map((c, i) => {
      if (i !== idx) return c;
      return {
        ...c,

        // ✅ Soft delete markers
        deleted: true,
        deletedAt: nowIso,
        deletedBy: userId,
        deleteReason: 'user',

        // Keep original text in DB for moderation evidence.
        // Do NOT overwrite text here.
      };
    });

    await prisma.feedPost.update({
      where: { id: idNum },
      data: { comments: nextComments },
      select: { id: true },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[FEED COMMENT DELETE ERROR]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
