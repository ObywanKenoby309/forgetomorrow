// pages/api/signal/delete.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;
    const { conversationId } = req.body || {};

    if (!conversationId) {
      return res.status(400).json({ error: 'Missing conversationId' });
    }

    const convo = await prisma.conversation.findUnique({
      where: { id: Number(conversationId) },
      include: {
        participants: true,
      },
    });

    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = convo.participants.some(
      (p) => p.userId === userId
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not allowed' });
    }

    // Cascade delete via relations
    await prisma.conversation.delete({
      where: { id: convo.id },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[signal/delete] error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
