// pages/api/signal/threads.js
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

    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
    });

    if (!participants.length) {
      return res.status(200).json({ ok: true, threads: [] });
    }

    const conversationIds = participants.map((p) => p.conversationId);

    const conversations = await prisma.conversation.findMany({
      where: { id: { in: conversationIds } },
      orderBy: { updatedAt: 'desc' },
    });

    const allParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId: { in: conversationIds } },
    });

    const otherUserIds = [
      ...new Set(
        allParticipants
          .filter((p) => p.userId !== userId)
          .map((p) => p.userId)
      ),
    ];

    const users = otherUserIds.length
      ? await prisma.user.findMany({
          where: { id: { in: otherUserIds } },
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            headline: true,
          },
        })
      : [];

    const lastMessages = await prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      orderBy: { createdAt: 'desc' },
    });

    const lastMessageByConversation = {};
    for (const m of lastMessages) {
      if (!lastMessageByConversation[m.conversationId]) {
        lastMessageByConversation[m.conversationId] = m;
      }
    }

    const threads = conversations.map((c) => {
      const participantsForConversation = allParticipants.filter(
        (p) => p.conversationId === c.id
      );
      const otherParticipant = participantsForConversation.find(
        (p) => p.userId !== userId
      );

      const otherUser = otherParticipant
        ? users.find((u) => u.id === otherParticipant.userId)
        : null;

      const otherName =
        otherUser?.name ||
        [otherUser?.firstName, otherUser?.lastName]
          .filter(Boolean)
          .join(' ') ||
        (c.isGroup ? c.title || 'Group' : 'Member');

      const last = lastMessageByConversation[c.id];

      return {
        id: c.id,
        isGroup: c.isGroup,
        title: c.isGroup ? c.title || otherName : otherName,
        otherUserId: otherUser?.id || null,
        otherAvatarUrl: otherUser?.avatarUrl || null,
        otherHeadline: otherUser?.headline || '',
        lastMessage: last ? last.content : '',
        lastMessageAt: last ? last.createdAt : c.createdAt,
      };
    });

    return res.status(200).json({ ok: true, threads });
  } catch (err) {
    console.error('signal/threads error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
