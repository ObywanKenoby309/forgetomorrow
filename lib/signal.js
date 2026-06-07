// lib/signal.js
// Server-side Signal helpers — used by Foundry invite flows and API routes.
//
// homeLocation controls which inbox surfaces a conversation:
//   "seeker"    – Seeker Spark (all participants always see it)
//   "coach"     – Seeker Spark + Coach Inbox
//   "recruiter" – Seeker Spark + Recruiter Inbox
//
// `channel` is preserved on existing rows. New conversations do not set it.

import { prisma } from '@/lib/prisma';

const VALID_HOME_LOCATIONS = ['seeker', 'coach', 'recruiter'];

/**
 * Create or return an existing 1:1 Signal conversation between two users.
 * Server-side only — mirrors /api/signal/start-or-get without an HTTP round-trip.
 */
export async function getOrCreateConversation(fromUserId, toUserId, homeLocation = 'seeker') {
  if (!fromUserId || !toUserId) return null;
  if (fromUserId === toUserId) return null;

  const safeHomeLocation = VALID_HOME_LOCATIONS.includes(homeLocation)
    ? homeLocation
    : 'seeker';

  // Find any existing 1:1 between these two users (channel-agnostic)
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

  return conversation;
}
