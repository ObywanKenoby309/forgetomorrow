// pages/api/signal/start-or-get.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

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
    const { toUserId, channel = 'seeker' } = req.body || {};

    if (!toUserId || typeof toUserId !== 'string') {
      return res.status(400).json({ error: 'Missing toUserId' });
    }
    if (toUserId === userId) {
      return res.status(400).json({ error: 'You cannot message yourself.' });
    }

    // Try to find an existing 1:1 conversation between these two users
    let conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        channel,
        participants: {
          some: { userId },
        },
        AND: {
          participants: {
            some: { userId: toUserId },
          },
        },
      },
    });

    if (!conversation) {
      // Create conversation + participants
      conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          channel,
          participants: {
            create: [
              { userId },
              { userId: toUserId },
            ],
          },
        },
      });
    }

    // Fetch the "other" user for display
    const otherUser = await prisma.user.findUnique({
      where: { id: toUserId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        headline: true,
      },
    });

    const otherName =
      otherUser?.name ||
      [otherUser?.firstName, otherUser?.lastName].filter(Boolean).join(' ') ||
      'Member';

    return res.status(200).json({
      ok: true,
      conversation: {
        id: conversation.id,
        isGroup: conversation.isGroup,
        title: otherName,
        channel: conversation.channel,
      },
      otherUser: {
        id: otherUser?.id || toUserId,
        name: otherName,
        avatarUrl: otherUser?.avatarUrl || null,
        headline: otherUser?.headline || '',
      },
    });
  } catch (err) {
    console.error('signal/start-or-get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
