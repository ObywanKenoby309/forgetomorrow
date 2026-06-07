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

function buildHomeLocationWhere(userRole, view) {
  const role = normalizeRole(userRole);
  const v = normalizeView(view);

  // Seekers only have Spark, so Spark must show every conversation they participate in.
  if (role === 'SEEKER') return {};

  // Site-level users can see their participant conversations without homeLocation filtering.
  if (role === 'ADMIN' || role === 'OWNER' || role === 'SITE_ADMIN') return {};

  // Coaches have Spark + Coach Inbox.
  if (role === 'COACH') {
    if (v === 'coach') return { homeLocation: 'coach' };
    return { homeLocation: 'seeker' };
  }

  // Recruiters have Spark + Recruiter Inbox.
  if (role === 'RECRUITER') {
    if (v === 'recruiter') return { homeLocation: 'recruiter' };
    return { homeLocation: 'seeker' };
  }

  // Unknown roles fall back to Spark behavior.
  return { homeLocation: 'seeker' };
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

    // New model: view controls which inbox is being rendered.
    // Backward compatibility: old callers may still pass channel=seeker/coach/recruiter.
    const view = normalizeView(req.query?.view || req.query?.channel || 'spark');

    // Load role from DB so routing does not depend on JWT/session shape.
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const role = normalizeRole(dbUser?.role || session?.user?.role || 'SEEKER');
    const homeLocationWhere = buildHomeLocationWhere(role, view);

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
    // Preserve group support and legacy channel field; homeLocation is now the display/storage filter.
    const conversations = await prisma.conversation.findMany({
      where: {
        id: { in: conversationIds },
        ...homeLocationWhere,
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

    // ✅ All participants for visible conversations (for "other user" lookup)
    const allParticipants = await prisma.conversationParticipant.findMany({
      where: { conversationId: { in: visibleConversationIds } },
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

    // ✅ Latest message per visible conversation (NO "fetch everything")
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

    // ✅ Map my participant row by conversation
    const myParticipantByConversationId = {};
    for (const p of participants) {
      myParticipantByConversationId[p.conversationId] = p;
    }

    // ✅ Preserve real unread counts in ONE query (per-conversation lastReadAt cutoff)
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
      const unreadCount = unreadByConversationId[c.id] || 0;

      return {
        id: c.id,
        isGroup: c.isGroup,
        title: c.isGroup ? c.title || otherName : otherName,
        channel: c.channel || null,
        homeLocation: c.homeLocation || 'seeker',
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
