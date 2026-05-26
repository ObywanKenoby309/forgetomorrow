// lib/signal.js
// Server-side Signal helpers used by Foundry invite flows.

import prisma from '@/lib/prisma';

/**
 * Create or return an existing 1:1 Signal conversation between two users.
 * This is intentionally server-side only and mirrors the existing
 * /api/signal/start-or-get behavior without requiring an HTTP call.
 */
export async function getOrCreateConversation(fromUserId, toUserId, channel = 'seeker') {
  if (!fromUserId || !toUserId) return null;
  if (fromUserId === toUserId) return null;

  let conversation = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      channel,
      participants: {
        some: { userId: fromUserId },
      },
      AND: {
        participants: {
          some: { userId: toUserId },
        },
      },
    },
    include: {
      participants: true,
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        channel,
        participants: {
          create: [{ userId: fromUserId }, { userId: toUserId }],
        },
      },
      include: {
        participants: true,
      },
    });
  }

  return conversation;
}
