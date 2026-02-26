// pages/api/signal/messages.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function safeInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function safeBool(v, defaultValue = true) {
  if (v === undefined || v === null) return defaultValue;
  const s = String(v).trim().toLowerCase();
  if (s === '1' || s === 'true' || s === 'yes') return true;
  if (s === '0' || s === 'false' || s === 'no') return false;
  return defaultValue;
}

function safeLimit(v, def = 200, max = 500) {
  const n = safeInt(v);
  if (!n || n <= 0) return def;
  return Math.min(n, max);
}

function safeDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
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

    const { conversationId, sinceId, sinceTs, limit, markRead } = req.query || {};

    const convoId = safeInt(conversationId);
    if (!convoId) {
      return res.status(400).json({ error: 'Missing or invalid conversationId' });
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: convoId, userId },
      select: { id: true, lastReadAt: true },
    });

    if (!participant) {
      return res.status(403).json({ error: 'Not allowed to view this conversation' });
    }

    const doMarkRead = safeBool(markRead, true);

    // ✅ Only mark as read when caller intends it (initial load / open convo)
    // For polling, pass markRead=0 to avoid constantly updating lastReadAt
    if (doMarkRead) {
      await prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: { lastReadAt: new Date() },
      });
    }

    const sinceIdNum = safeInt(sinceId);
    const sinceDate = safeDate(sinceTs);
    const take = safeLimit(limit, 200, 500);

    // ✅ Prefer sinceId if provided (fast + stable). Fall back to sinceTs if needed.
    const where = {
      conversationId: convoId,
      ...(sinceIdNum
        ? { id: { gt: sinceIdNum } }
        : sinceDate
        ? { createdAt: { gt: sinceDate } }
        : {}),
    };

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take,
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

    const nextSinceId = normalized.length ? normalized[normalized.length - 1].id : sinceIdNum || null;

    return res.status(200).json({
      ok: true,
      messages: normalized,
      meta: {
        conversationId: convoId,
        returned: normalized.length,
        nextSinceId,
        markedRead: doMarkRead,
      },
    });
  } catch (err) {
    console.error('signal/messages error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}