// pages/api/signal/start-or-get.js
// Creates or retrieves a 1:1 Signal conversation.
//
// POST body:
//   toUserId     (string, required)
//   homeLocation (string, optional) – "seeker" | "coach" | "recruiter"
//
// Important:
//   homeLocation is participant-level. Moving/starting from Coach or Recruiter
//   updates ONLY the caller's conversationParticipant.homeLocation.
//   The recipient remains in Spark unless they move it themselves.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

const VALID_HOME_LOCATIONS = ['seeker', 'coach', 'recruiter'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const fromUserId = session.user.id;
  const { toUserId, homeLocation } = req.body || {};

  if (!toUserId || typeof toUserId !== 'string') {
    return res.status(400).json({ error: 'toUserId is required' });
  }

  if (fromUserId === toUserId) {
    return res.status(400).json({ error: 'Cannot message yourself' });
  }

  const safeHomeLocation = VALID_HOME_LOCATIONS.includes(homeLocation)
    ? homeLocation
    : 'seeker';

  try {
    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({
        where: { id: fromUserId },
        select: { role: true },
      }),
      prisma.user.findUnique({
        where: { id: toUserId },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          slug: true,
          deletedAt: true,
          role: true,
        },
      }),
    ]);

    if (!toUser || toUser.deletedAt) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fromRole = String(fromUser?.role || 'SEEKER').toUpperCase();
    const toRole = String(toUser.role || 'SEEKER').toUpperCase();

    // SEEKER → SEEKER requires a contact record.
    if (fromRole === 'SEEKER' && toRole === 'SEEKER') {
      const contact = await prisma.contact.findFirst({
        where: {
          OR: [
            { userId: fromUserId, contactUserId: toUserId },
            { userId: toUserId, contactUserId: fromUserId },
          ],
        },
      });

      if (!contact) {
        return res.status(403).json({
          error: 'Not connected',
          message: 'You need to be connected with this member before messaging.',
        });
      }
    }

    let conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: { some: { userId: fromUserId } },
        AND: { participants: { some: { userId: toUserId } } },
      },
      include: { participants: true },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          // Keep legacy conversation.homeLocation populated for compatibility only.
          // Visibility now uses conversationParticipant.homeLocation.
          homeLocation: 'seeker',
          participants: {
            create: [
              { userId: fromUserId, homeLocation: safeHomeLocation },
              { userId: toUserId, homeLocation: 'seeker' },
            ],
          },
        },
        include: { participants: true },
      });
    } else {
      // Opening from a workspace should place it in the caller's selected inbox only.
      const callerParticipant = conversation.participants.find((p) => p.userId === fromUserId);
      if (callerParticipant && callerParticipant.homeLocation !== safeHomeLocation) {
        await prisma.conversationParticipant.update({
          where: { id: callerParticipant.id },
          data: { homeLocation: safeHomeLocation },
        });

        conversation = {
          ...conversation,
          participants: conversation.participants.map((p) =>
            p.id === callerParticipant.id ? { ...p, homeLocation: safeHomeLocation } : p
          ),
        };
      }
    }

    const callerParticipant = conversation.participants.find((p) => p.userId === fromUserId);

    const otherName = [toUser.firstName, toUser.lastName]
      .filter(Boolean)
      .join(' ') || toUser.name || 'Member';

    return res.status(200).json({
      conversationId: conversation.id,
      homeLocation: callerParticipant?.homeLocation || safeHomeLocation,
      otherAvatarUrl: toUser.avatarUrl || null,
      otherUserSlug: toUser.slug || null,
      otherName,
    });
  } catch (err) {
    console.error('[signal/start-or-get] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
