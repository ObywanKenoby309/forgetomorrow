// pages/api/signal/threads.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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

    // ✅ My participant rows (includes lastReadAt)
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });

    if (!participants.length) {
      return res.status(200).json({ ok: true, threads: [] });
    }

    const conversationIds = participants.map((p) => p.conversationId);

    // ✅ Conversations sorted newest first (cheap fields only)
    const conversations = await prisma.conversation.findMany({
      where: { id: { in: conversationIds } },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        isGroup: true,
        title: true,
        channel: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ✅ All participants for these conversations (for "other user" lookup)
    const allParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId: { in: conversationIds } },
      select: { conversationId: true, userId: true },
    });

    // ✅ Only fetch users that are not me
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
			slug: true,
          },
        })
      : [];

    const userById = {};
    for (const u of users) userById[u.id] = u;

    // ✅ Latest message per conversation (NO "fetch everything")
    const lastMessages = await prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      orderBy: [{ conversationId: 'asc' }, { createdAt: 'desc' }],
      distinct: ['conversationId'],
      select: {
        conversationId: true,
        content: true,
        createdAt: true,
        senderId: true,
      },
    });

    const lastMessageByConversation = {};
    for (const m of lastMessages) {
      lastMessageByConversation[m.conversationId] = m;
    }

    // ✅ Map my participant row by conversation
    const myParticipantByConversationId = {};
    for (const p of participants) {
      myParticipantByConversationId[p.conversationId] = p;
    }

    // ✅ Unread counts in ONE query (per-conversation lastReadAt cutoff)
    // unread = messages from someone else where createdAt > my lastReadAt (or all if lastReadAt null)
    const unreadRows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          m."conversationId" as "conversationId",
          COUNT(*)::int as "unreadCount"
        FROM "messages" m
        JOIN "conversation_participants" cp
          ON cp."conversationId" = m."conversationId"
         AND cp."userId" = ${userId}
        WHERE m."conversationId" = ANY(${conversationIds}::int[])
          AND m."senderId" <> ${userId}
          AND (cp."lastReadAt" IS NULL OR m."createdAt" > cp."lastReadAt")
        GROUP BY m."conversationId"
      `
    );

    const unreadByConversationId = {};
    for (const r of unreadRows || []) {
      // conversationId comes back as number-like
      unreadByConversationId[Number(r.conversationId)] = Number(r.unreadCount) || 0;
    }

    // ✅ Build threads
    const threads = conversations.map((c) => {
      const participantsForConversation = allParticipants.filter(
        (p) => p.conversationId === c.id
      );

      // For 1:1, pick the other participant. For group, we keep otherUserId null.
      const otherParticipant = participantsForConversation.find(
        (p) => p.userId !== userId
      );

      const otherUser = otherParticipant ? userById[otherParticipant.userId] : null;

      const otherName =
        otherUser?.name ||
        [otherUser?.firstName, otherUser?.lastName].filter(Boolean).join(' ') ||
        (c.isGroup ? c.title || 'Group' : 'Member');

      const last = lastMessageByConversation[c.id];

      // Optional: if you want to hide ghost conversations server-side too, uncomment:
      // if (!last?.content?.trim()) return null;

      return {
        id: c.id,
        isGroup: c.isGroup,
        title: c.isGroup ? c.title || otherName : otherName,
        otherUserId: c.isGroup ? null : otherUser?.id || null,
        otherAvatarUrl: c.isGroup ? null : otherUser?.avatarUrl || null,
		otherUserSlug: c.isGroup ? null : otherUser?.slug || null,
        otherHeadline: c.isGroup ? '' : otherUser?.headline || '',
        lastMessage: last ? last.content : '',
        lastMessageAt: last ? last.createdAt : c.createdAt,
        unreadCount: unreadByConversationId[c.id] || 0,
      };
    });

    // If you enabled the ghost filter above, you’d do: const clean = threads.filter(Boolean)

    return res.status(200).json({ ok: true, threads });
  } catch (err) {
    console.error('signal/threads error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}