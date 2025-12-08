// pages/api/signal/send.js
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
    const { conversationId, content } = req.body || {};

    const convoId = Number(conversationId);
    if (!convoId || Number.isNaN(convoId)) {
      return res.status(400).json({ error: 'Missing or invalid conversationId' });
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: convoId, userId },
    });

    if (!participant) {
      return res.status(403).json({ error: 'Not allowed to send in this conversation' });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: convoId,
        senderId: userId,
        content: content.trim(),
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        createdAt: true,
      },
    });

    // Bump conversation updatedAt
    await prisma.conversation.update({
      where: { id: convoId },
      data: { updatedAt: new Date() },
    });

    return res.status(200).json({ ok: true, message });
  } catch (err) {
    console.error('signal/send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
