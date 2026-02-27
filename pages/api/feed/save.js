// pages/api/feed/save.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { postId } = req.body || {};
  if (!postId) {
    return res.status(400).json({ error: 'postId is required' });
  }

  try {
    // Check if already saved
    const existing = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: Number(postId),
        },
      },
    });

    if (existing) {
      // Unsave
      await prisma.savedPost.delete({
        where: {
          userId_postId: {
            userId: session.user.id,
            postId: Number(postId),
          },
        },
      });
      return res.status(200).json({ saved: false });
    } else {
      // Save
      await prisma.savedPost.create({
        data: {
          userId: session.user.id,
          postId: Number(postId),
        },
      });
      return res.status(200).json({ saved: true });
    }
  } catch (err) {
    console.error('[FEED SAVE ERROR]', err);
    return res.status(500).json({ error: 'Failed to toggle save' });
  }
}