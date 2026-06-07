// pages/api/signal/typing.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function safeInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}

function displayName(u) {
  const full = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
  return full || u?.name || u?.email || 'Member';
}

async function assertParticipant(conversationId, userId) {
  if (!conversationId || !userId) return null;
  return prisma.conversationParticipant.findFirst({
    where: { conversationId, userId },
    select: { id: true },
  });
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;
    const rawConversationId = req.method === 'GET'
      ? req.query?.conversationId
      : req.body?.conversationId;

    const conversationId = safeInt(rawConversationId);
    if (!conversationId) {
      return res.status(400).json({ error: 'Missing or invalid conversationId' });
    }

    const participant = await assertParticipant(conversationId, userId);
    if (!participant) {
      return res.status(403).json({ error: 'Not allowed in this conversation' });
    }

    if (req.method === 'GET') {
      const cutoff = new Date(Date.now() - 5000);

      const typingRows = await prisma.conversationTyping.findMany({
        where: {
          conversationId,
          userId: { not: userId },
          updatedAt: { gt: cutoff },
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      return res.status(200).json({
        ok: true,
        typingUsers: typingRows.map((row) => ({
          userId: row.userId,
          name: displayName(row.user),
          avatarUrl: row.user?.avatarUrl || null,
          updatedAt: row.updatedAt,
        })),
      });
    }

    if (req.method === 'POST') {
      await prisma.conversationTyping.upsert({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },
        create: {
          conversationId,
          userId,
        },
        update: {
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await prisma.conversationTyping.deleteMany({
        where: { conversationId, userId },
      });

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('signal/typing error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
