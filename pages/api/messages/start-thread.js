// pages/api/messages/start-thread.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function normalizeChannel(raw) {
  if (typeof raw !== 'string') return null;
  const v = raw.trim().toLowerCase();
  if (!v) return null;

  // allow safe aliases
  if (v === 'coaching') return 'coach';
  if (v === 'recruiting') return 'recruiter';
  if (v === 'candidate') return 'seeker';

  // allow only known channels
  if (v === 'coach' || v === 'recruiter' || v === 'seeker') return v;

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!me) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { candidateId, targetUserId, channel } = req.body || {};

    // Support both legacy `candidateId` and new `targetUserId`
    const rawTarget =
      (typeof targetUserId === 'string' && targetUserId.trim()) ||
      (typeof candidateId === 'string' && candidateId.trim()) ||
      null;

    if (!rawTarget) {
      return res.status(400).json({
        error: 'Missing or invalid "targetUserId" (or legacy "candidateId")',
      });
    }

    if (rawTarget === me.id) {
      return res
        .status(400)
        .json({ error: 'You cannot start a thread with yourself.' });
    }

    // Make sure the other user exists
    const target = await prisma.user.findUnique({
      where: { id: rawTarget },
      select: { id: true },
    });

    if (!target) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // ✅ Normalize channel (and restrict to known values)
    const convChannel = normalizeChannel(channel) || 'recruiter';

    // Look for an existing 1:1 conversation in this channel between these two
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        channel: { equals: convChannel, mode: 'insensitive' },
        participants: {
          some: { userId: me.id },
        },
        AND: [
          {
            participants: {
              some: { userId: target.id },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return res.status(200).json({
        conversationId: existing.id,
        created: false,
      });
    }

    // Create a new conversation + participants
    const convo = await prisma.conversation.create({
      data: {
        isGroup: false,
        title: null,
        // ✅ Store canonical lowercase channel
        channel: convChannel,
        participants: {
          create: [
            {
              userId: me.id,
              role: 'owner',
            },
            {
              userId: target.id,
              role: 'member',
            },
          ],
        },
      },
      select: { id: true },
    });

    return res.status(200).json({
      conversationId: convo.id,
      created: true,
    });
  } catch (err) {
    console.error('[messages/start-thread] error', err);
    return res.status(500).json({
      error: 'Failed to start or find a conversation.',
    });
  }
}
