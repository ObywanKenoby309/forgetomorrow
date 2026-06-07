// pages/api/signal/threads.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

function normalizeView(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (v === 'coach' || v === 'recruiter' || v === 'spark') return v;
  if (v === 'seeker' || v === 'signal' || v === 'personal') return 'spark';
  return 'spark';
}

function participantHomeLocationForView(userRole, view) {
  const role = normalizeRole(userRole);
  const v = normalizeView(view);

  // Seekers only have Spark. Show all their participant conversations so they
  // can always receive replies even if a professional filed their own side away.
  if (role === 'SEEKER') return null;

  // Site-level users can see all participant conversations.
  if (role === 'ADMIN' || role === 'OWNER' || role === 'SITE_ADMIN') return null;

  if (role === 'COACH') {
    return v === 'coach' ? 'coach' : 'seeker';
  }

  if (role === 'RECRUITER') {
    return v === 'recruiter' ? 'recruiter' : 'seeker';
  }

  return 'seeker';
}

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
    const view = normalizeView(req.query?.view || req.query?.channel || 'spark');

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const role = normalizeRole(dbUser?.role || session?.user?.role || 'SEEKER');
    const requestedHomeLocation = participantHomeLocationForView(role, view);

    // Current user's participant rows control inbox visibility.
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        userId,
        ...(requestedHomeLocation ? { homeLocation: requestedHomeLocation } : {}),
      },
      select: {
        conversationId: true,
        lastReadAt: true,
        homeLocation: true,
      },
    });

    if (!participants.length) {
      return res.status(200).json({ ok: true, threads: [] });
    }

    const conversationIds = participants.map((p) => p.conversationId);

    const conversations = await prisma.conversation.findMany({
      where: {
        id: { in: conversationIds },
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        isGroup: true,
        title: true,
        channel: true,
        homeLocation: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!conversations.length) {
      return res.status(200).json({ ok: true, threads: [] });
    }

    const visibleConversationIds = conversations.map((c) => c.id);

    const allParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId: { in: visibleConversationIds } },
      select: { conversationId: true, userId: true, homeLocation: true },
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
            slug: true,
          },
        })
      : [];

    const userById = {};
    for (const u of users) userById[u.id] = u;

    const lastMessages = await prisma.message.findMany({
      where: { conversationId: { in: visibleConversationIds } },
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

    const myParticipantByConversationId = {};
    for (const p of participants) {
      myParticipantByConversationId[p.conversationId] = p;
    }

    const unreadRows = await prisma.$queryRaw(
      Prisma.sql`
        SELECT
          m."conversationId" as "conversationId",
          COUNT(*)::int as "unreadCount"
        FROM "messages" m
        JOIN "conversation_participants" cp
          ON cp."conversationId" = m."conversationId"
         AND cp."userId" = ${userId}
        WHERE m."conversationId" = ANY(${visibleConversationIds}::int[])
          AND m."senderId" <> ${userId}
          AND (cp."lastReadAt" IS NULL OR m."createdAt" > cp."lastReadAt")
        GROUP BY m."conversationId"
      `
    );

    const unreadByConversationId = {};
    for (const r of unreadRows || []) {
      unreadByConversationId[Number(r.conversationId)] = Number(r.unreadCount) || 0;
    }

    const threads = conversations.map((c) => {
      const participantsForConversation = allParticipants.filter(
        (p) => p.conversationId === c.id
      );

      const otherParticipant = participantsForConversation.find(
        (p) => p.userId !== userId
      );

      const otherUser = otherParticipant ? userById[otherParticipant.userId] : null;

      const otherName =
        otherUser?.name ||
        [otherUser?.firstName, otherUser?.lastName].filter(Boolean).join(' ') ||
        (c.isGroup ? c.title || 'Group' : 'Member');

      const last = lastMessageByConversation[c.id];
      const unreadCount = unreadByConversationId[c.id] || 0;
      const myParticipant = myParticipantByConversationId[c.id];

      return {
        id: c.id,
        isGroup: c.isGroup,
        title: c.isGroup ? c.title || otherName : otherName,
        channel: c.channel || null,
        // This is the current user's inbox placement for this shared thread.
        homeLocation: myParticipant?.homeLocation || 'seeker',
        legacyConversationHomeLocation: c.homeLocation || null,
        otherUserId: c.isGroup ? null : otherUser?.id || null,
        otherAvatarUrl: c.isGroup ? null : otherUser?.avatarUrl || null,
        otherUserSlug: c.isGroup ? null : otherUser?.slug || null,
        otherHeadline: c.isGroup ? '' : otherUser?.headline || '',
        lastMessage: last ? last.content : '',
        lastMessageAt: last ? last.createdAt : c.createdAt,
        unreadCount,
        unread: unreadCount,
      };
    });

    return res.status(200).json({ ok: true, threads });
  } catch (err) {
    console.error('signal/threads error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
