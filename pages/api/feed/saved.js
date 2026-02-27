// pages/api/feed/saved.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const saved = await prisma.savedPost.findMany({
      where: { userId: session.user.id },
      orderBy: { savedAt: 'desc' },
      include: {
        post: true,
      },
    });

    // Return just the post IDs for easy client-side lookup, plus full posts
    return res.status(200).json({
      savedPostIds: saved.map((s) => s.postId),
      posts: saved.map((s) => s.post).filter(Boolean),
    });
  } catch (err) {
    console.error('[FEED SAVED ERROR]', err);
    return res.status(500).json({ error: 'Failed to fetch saved posts' });
  }
}