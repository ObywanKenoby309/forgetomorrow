// pages/api/messages/start-thread.js
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

    // ─────────────────────────────────────────────────────────────
    //  INPUTS
    //  - channel: which inbox / workspace this belongs to
    //      e.g. "recruiter", "coach", "signal", "recruiter-signal"
    //  - targetUserId: generic user id we’re messaging
    //  - candidateId: legacy name for targetUserId (kept for compatibility)
    // ─────────────────────────────────────────────────────────────
    const { candidateId, targetUserId, channel: rawChannel } = req.body || {};

    // Backwards-compatible: if caller doesn’t send channel, default to recruiter.
    const channel =
      typeof rawChannel === 'string' && rawChannel.trim().length > 0
        ? rawChannel.trim()
        : 'recruiter';

    const resolvedTargetId =
      typeof targetUserId === 'string' && targetUserId.trim().length > 0
        ? targetUserId.trim()
        : typeof candidateId === 'string' && candidateId.trim().length > 0
        ? candidateId.trim()
        : null;

    if (!resolvedTargetId) {
      return res.status(400).json({
        error:
          'Missing or invalid "targetUserId" (or legacy "candidateId") in request body.',
      });
    }

    if (resolvedTargetId === me.id) {
      return res
        .status(400)
        .json({ error: 'You cannot start a thread with yourself.' });
    }

    // Make sure the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: resolvedTargetId },
      select: { id: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // ─────────────────────────────────────────────────────────────
    //  LOOK FOR EXISTING 1:1 CONVERSATION IN THIS CHANNEL
    //  (e.g. recruiter, coach, signal…)
    // ─────────────────────────────────────────────────────────────
    const existing = await prisma.conversation.findFirst({
      where: {
        channel, // now dynamic: "recruiter", "coach", etc.
        participants: {
          some: { userId: me.id },
        },
        AND: [
          {
            participants: {
              some: { userId: resolvedTargetId },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (existing) {
      return res.status(200).json({
        conversationId: existing.id,
        channel,
        created: false,
      });
    }

    // ─────────────────────────────────────────────────────────────
    //  CREATE NEW CONVERSATION + PARTICIPANTS
    // ─────────────────────────────────────────────────────────────
    const convo = await prisma.conversation.create({
      data: {
        isGroup: false,
        title: null,
        channel, // <- key: supports recruiter, coach, signal, etc.
        participants: {
          create: [
            {
              userId: me.id,
              role: 'owner',
            },
            {
              userId: resolvedTargetId,
              role: 'member',
            },
          ],
        },
      },
      select: { id: true },
    });

    return res.status(200).json({
      conversationId: convo.id,
      channel,
      created: true,
    });
  } catch (err) {
    console.error('[messages/start-thread] error', err);
    return res
      .status(500)
      .json({ error: 'Failed to start or find a conversation.' });
  }
}
