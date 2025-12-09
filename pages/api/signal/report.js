// pages/api/signal/report.js
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

    const meId = session.user.id;
    const meEmail = session.user.email || null;

    const { conversationId, targetUserId, reason } = req.body || {};

    const convIdNum =
      typeof conversationId === 'number'
        ? conversationId
        : parseInt(conversationId, 10);

    if (!convIdNum || Number.isNaN(convIdNum)) {
      return res
        .status(400)
        .json({ error: 'Missing or invalid "conversationId".' });
    }

    if (!targetUserId || typeof targetUserId !== 'string') {
      return res
        .status(400)
        .json({ error: 'Missing or invalid "targetUserId".' });
    }

    // Ensure this user is actually part of the conversation
    const convo = await prisma.conversation.findFirst({
      where: {
        id: convIdNum,
        participants: {
          some: { userId: meId },
        },
      },
      select: {
        id: true,
        channel: true,
        participants: {
          select: { userId: true },
        },
      },
    });

    if (!convo) {
      return res.status(404).json({
        error: 'Conversation not found or you are not a participant.',
      });
    }

    // Optional extra check: make sure target is also a participant
    const isTargetInConversation = convo.participants.some(
      (p) => p.userId === targetUserId
    );
    if (!isTargetInConversation) {
      return res.status(400).json({
        error: 'Reported user is not in this conversation.',
      });
    }

    const trimmedReason =
      typeof reason === 'string' && reason.trim().length > 0
        ? reason.trim()
        : 'No reason provided.';

    const subject = `Signal DM Report – Conversation #${convo.id}`;
    const initialMessage = [
      `Reporter userId: ${meId}`,
      meEmail ? `Reporter email: ${meEmail}` : null,
      `Target userId: ${targetUserId}`,
      `ConversationId: ${convo.id}`,
      `Channel: ${convo.channel || 'N/A'}`,
      '',
      'Reason:',
      trimmedReason,
    ]
      .filter(Boolean)
      .join('\n');

    await prisma.supportTicket.create({
      data: {
        userId: meId,
        userEmail: meEmail,
        subject,
        initialMessage,
        source: 'signal-dm',
        personaId: 'abuse', // or "community"
        intent: 'abuse',
        status: 'OPEN',
      },
    });

    return res.status(200).json({ reported: true });
  } catch (err) {
    console.error('[signal/report] error', err);
    return res.status(500).json({ error: 'Failed to submit report.' });
  }
}
