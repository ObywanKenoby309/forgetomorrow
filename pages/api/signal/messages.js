// pages/api/signal/messages.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;
    const { conversationId } = req.query || {};

    const convoId = Number(conversationId);
    if (!convoId || Number.isNaN(convoId)) {
      return res
        .status(400)
        .json({ error: 'Missing or invalid conversationId' });
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: convoId, userId },
    });

    if (!participant) {
      return res
        .status(403)
        .json({ error: 'Not allowed to view this conversation' });
    }

    // ✅ mark as read (per-user, per-conversation)
    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });

    const messages = await prisma.message.findMany({
      where: { conversationId: convoId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const normalized = messages.map((m) => {
      const senderName =
        m.sender?.name ||
        [m.sender?.firstName, m.sender?.lastName].filter(Boolean).join(' ') ||
        'Member';
      return {
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName,
        senderAvatarUrl: m.sender?.avatarUrl || null,
        content: m.content,
        createdAt: m.createdAt,
        isMine: m.senderId === userId,
      };
    });

    return res.status(200).json({ ok: true, messages: normalized });
  } catch (err) {
    console.error('signal/messages error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
