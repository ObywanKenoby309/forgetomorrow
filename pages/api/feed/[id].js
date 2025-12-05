// pages/api/feed/[id].js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  // Helpful for debugging in Vercel logs if needed
  console.log('[FEED DELETE] method:', method, 'id:', id);

  // Allow OPTIONS for any preflight
  if (method === 'OPTIONS') {
    res.setHeader('Allow', 'DELETE,OPTIONS');
    return res.status(200).end();
  }

  // Only allow DELETE here
  if (method !== 'DELETE') {
    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check auth
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Validate ID (FeedPost.id is Int in Prisma)
  const postId = parseInt(id, 10);
  if (!postId || Number.isNaN(postId)) {
    return res.status(400).json({ error: 'Invalid post id' });
  }

  try {
    const existing = await prisma.feedPost.findUnique({
      where: { id: postId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Only the author or an ADMIN can delete
    const userId = session.user.id;
    const userRole = session.user.role || session.user.plan || null;

    if (existing.authorId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not allowed to delete this post' });
    }

    await prisma.feedPost.delete({
      where: { id: postId },
    });

    // No body needed, just say "gone"
    return res.status(204).end();
  } catch (err) {
    console.error('[FEED DELETE ERROR]', err);
    return res
      .status(500)
      .json({ error: 'Internal server error', detail: err.message });
  }
}
