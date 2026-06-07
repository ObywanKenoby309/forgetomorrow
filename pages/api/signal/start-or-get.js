// pages/api/signal/start-or-get.js
// Creates or retrieves a 1:1 Signal conversation.
//
// POST body:
//   toUserId     (string, required)
//   homeLocation (string, optional) – "seeker" | "coach" | "recruiter"
//                Defaults to "seeker". Only applied when creating a new
//                conversation; existing conversations are returned as-is.
//
// Connection gate (roles loaded from DB, not JWT):
//   SEEKER → SEEKER : requires a Contact record in both directions (mutual)
//   COACH  → anyone : always allowed
//   RECRUITER → anyone : always allowed
//
// Response:
//   { conversationId, homeLocation, otherAvatarUrl, otherUserSlug, otherName }

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
    // Load both users from DB — do not trust JWT for roles
    const [fromUser, toUser] = await Promise.all([
      prisma.user.findUnique({
        where:  { id: fromUserId },
        select: { role: true },
      }),
      prisma.user.findUnique({
        where:  { id: toUserId },
        select: {
          id:        true,
          name:      true,
          firstName: true,
          lastName:  true,
          avatarUrl: true,
          slug:      true,
          deletedAt: true,
          role:      true,
        },
      }),
    ]);

    if (!toUser || toUser.deletedAt) {
      return res.status(404).json({ error: 'User not found' });
    }

    const fromRole = String(fromUser?.role || 'SEEKER').toUpperCase();
    const toRole   = String(toUser.role    || 'SEEKER').toUpperCase();

    // SEEKER → SEEKER requires a mutual contact record
    if (fromRole === 'SEEKER' && toRole === 'SEEKER') {
      const contact = await prisma.contact.findFirst({
        where: {
          OR: [
            { userId: fromUserId, contactUserId: toUserId },
            { userId: toUserId,   contactUserId: fromUserId },
          ],
        },
      });
      if (!contact) {
        return res.status(403).json({
          error:   'Not connected',
          message: 'You need to be connected with this member before messaging.',
        });
      }
    }

    // Find or create the 1:1 conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        participants: { some: { userId: fromUserId } },
        AND:          { participants: { some: { userId: toUserId } } },
      },
      include: { participants: true },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          isGroup:      false,
          homeLocation: safeHomeLocation,
          participants: {
            create: [{ userId: fromUserId }, { userId: toUserId }],
          },
        },
        include: { participants: true },
      });
    }

    const otherName = [toUser.firstName, toUser.lastName]
      .filter(Boolean)
      .join(' ') || toUser.name || 'Member';

    return res.status(200).json({
      conversationId: conversation.id,
      homeLocation:   conversation.homeLocation || 'seeker',
      otherAvatarUrl: toUser.avatarUrl || null,
      otherUserSlug:  toUser.slug      || null,
      otherName,
    });
  } catch (err) {
    console.error('[signal/start-or-get] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
