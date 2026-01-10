import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const viewerId = session?.user?.id || null;

    const { postId, source } = req.body || {};
    const idNum = Number(postId);

    if (!idNum || Number.isNaN(idNum)) {
      return res.status(400).json({ error: 'postId is required' });
    }

    // Verify post exists (fail soft)
    const exists = await prisma.feedPost.findUnique({
      where: { id: idNum },
      select: { id: true },
    });
    if (!exists) return res.status(204).end();

    await prisma.feedPostView.create({
      data: {
        postId: idNum,
        viewerId,
        source: source || 'feed',
      },
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[api/feed/post-view] error:', err);
    return res.status(500).json({ error: 'Failed to log post view' });
  }
}
