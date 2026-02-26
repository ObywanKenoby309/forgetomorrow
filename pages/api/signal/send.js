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

    // Make sure the sender is a participant in this conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: convoId, userId },
      select: { id: true },
    });

    if (!participant) {
      return res.status(403).json({ error: 'Not allowed to send in this conversation' });
    }

    // Load conversation participants + channel + group flag for block + notifications
    const convo = await prisma.conversation.findUnique({
      where: { id: convoId },
      select: {
        channel: true,
        isGroup: true,
        participants: {
          select: { userId: true },
        },
      },
    });

    if (!convo) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // 🔹 Block enforcement ONLY for 1:1 conversations
    if (!convo.isGroup) {
      const otherParticipant = (convo.participants || []).find((p) => p.userId !== userId);
      const otherUserId = otherParticipant?.userId || null;

      if (otherUserId) {
        const blocked = await prisma.userBlock.findFirst({
          where: {
            OR: [
              { blockerId: userId, blockedId: otherUserId },
              { blockerId: otherUserId, blockedId: userId },
            ],
          },
          select: { id: true },
        });

        if (blocked) {
          return res.status(403).json({
            error: 'Messaging is blocked between these accounts.',
          });
        }
      }
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

    const now = new Date();

    // Bump conversation updatedAt
    await prisma.conversation.update({
      where: { id: convoId },
      data: { updatedAt: now },
    });

    // ✅ Mark sender participant as read at send time (helps unread math later)
    await prisma.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: now },
    });

    // ✅ Upsert Notification rows for receivers (required for dots + preview cards)
    const channel = String(convo.channel || '').trim().toLowerCase();

    const scope =
      channel === 'coach'
        ? 'COACH'
        : channel === 'recruiter' || channel.startsWith('recruiter')
        ? 'RECRUITER'
        : 'SEEKER';

    // Recipients: everyone in convo except sender
    const recipientIds = (convo.participants || [])
      .map((p) => p.userId)
      .filter((id) => id && id !== userId);

    const senderName =
      (session?.user?.name && String(session.user.name).trim()) ||
      (session?.user?.email && String(session.user.email).trim()) ||
      'Someone';

    const snippet = String(content || '').trim().slice(0, 160);

    const entityId = String(convoId);
    const dedupeKey = `${scope}:conversation:${entityId}`;

    if (recipientIds.length > 0) {
      await prisma.$transaction(
        recipientIds.map((rid) =>
          prisma.notification.upsert({
            where: {
              userId_dedupeKey: {
                userId: rid,
                dedupeKey,
              },
            },
            create: {
              userId: rid,
              actorUserId: userId,
              scope,
              category: 'MESSAGING',
              entityType: 'CONVERSATION',
              entityId,
              dedupeKey,
              title: `New message from ${senderName}`,
              body: snippet || null,
              requiresAction: true,
              readAt: null,
              metadata: {
                conversationId: entityId,
                messageId: String(message.id),
                channel: channel || null,
              },
            },
            update: {
              actorUserId: userId,
              scope,
              category: 'MESSAGING',
              entityType: 'CONVERSATION',
              entityId,
              title: `New message from ${senderName}`,
              body: snippet || null,
              requiresAction: true,
              readAt: null,
              metadata: {
                conversationId: entityId,
                messageId: String(message.id),
                channel: channel || null,
              },
            },
          })
        )
      );
    }

    return res.status(200).json({ ok: true, message });
  } catch (err) {
    console.error('signal/send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}