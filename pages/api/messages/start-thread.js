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

    const { candidateId } = req.body || {};

    if (!candidateId || typeof candidateId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "candidateId"' });
    }

    if (candidateId === me.id) {
      return res.status(400).json({ error: 'You cannot start a thread with yourself.' });
    }

    // Make sure the candidate exists
    const candidate = await prisma.user.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    // Look for an existing 1:1 recruiter conversation between these two
    const existing = await prisma.conversation.findFirst({
      where: {
        channel: 'recruiter',
        participants: {
          some: { userId: me.id },
        },
        AND: [
          {
            participants: {
              some: { userId: candidateId },
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
        channel: 'recruiter',
        participants: {
          create: [
            {
              userId: me.id,
              role: 'owner',
            },
            {
              userId: candidateId,
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
    return res
      .status(500)
      .json({ error: 'Failed to start or find a recruiter conversation.' });
  }
}
