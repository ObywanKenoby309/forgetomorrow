// pages/api/conversations.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * TEMP AUTH HELPER (DEV-ONLY)
 * ---------------------------
 * For now, we read the current user ID from the `x-user-id` header.
 * In production, replace this with your real auth/session logic.
 */
function getCurrentUserId(req) {
  const raw = req.headers['x-user-id'] || req.headers['X-User-Id'];
  if (!raw || typeof raw !== 'string') return null;
  return raw;
}

export default async function handler(req, res) {
  const userId = getCurrentUserId(req);

  if (!userId) {
    return res
      .status(401)
      .json({ error: 'Unauthorized: x-user-id header is required (dev stub)' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { recipientId: recipientRaw, channel } = req.body || {};

    if (recipientRaw === undefined || recipientRaw === null) {
      return res
        .status(400)
        .json({ error: 'recipientId is required' });
    }

    // Normalize recipient to a *user* id.
    // - If we receive a string that *looks* like a cuid, treat as userId.
    // - If we receive a number (or numeric string), treat as Candidate.id and resolve to userId.
    let recipientUserId = null;

    if (typeof recipientRaw === 'string' && recipientRaw.startsWith('c')) {
      // Likely already a User.id (cuid-style)
      recipientUserId = recipientRaw;
    } else if (typeof recipientRaw === 'string' && /^[0-9]+$/.test(recipientRaw)) {
      // Numeric string → candidate id
      const candidateId = Number(recipientRaw);
      const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { userId: true },
      });

      if (!candidate) {
        // DEV FALLBACK: allow ephemeral conversation if candidate row missing
        const convChannel = typeof channel === 'string' && channel.trim().length > 0
          ? channel.trim()
          : null;

        const payload = {
          id: `dev-${Date.now()}`,
          channel: convChannel,
          isGroup: false,
          title: null,
          participants: [
            { userId },
            { userId: `candidate-${candidateId}` },
          ],
          otherUser: {
            id: `candidate-${candidateId}`,
            name: 'Candidate',
            email: null,
            headline: null,
            avatarUrl: null,
          },
          existedAlready: false,
        };

        return res.status(200).json({ conversation: payload });
      }

      recipientUserId = candidate.userId;
    } else if (typeof recipientRaw === 'number') {
      // Raw number → candidate id
      const candidate = await prisma.candidate.findUnique({
        where: { id: recipientRaw },
        select: { userId: true },
      });

      if (!candidate) {
        const convChannel = typeof channel === 'string' && channel.trim().length > 0
          ? channel.trim()
          : null;

        const payload = {
          id: `dev-${Date.now()}`,
          channel: convChannel,
          isGroup: false,
          title: null,
          participants: [
            { userId },
            { userId: `candidate-${recipientRaw}` },
          ],
          otherUser: {
            id: `candidate-${recipientRaw}`,
            name: 'Candidate',
            email: null,
            headline: null,
            avatarUrl: null,
          },
          existedAlready: false,
        };

        return res.status(200).json({ conversation: payload });
      }

      recipientUserId = candidate.userId;
    } else {
      // Fallback: assume string user id
      if (typeof recipientRaw !== 'string') {
        return res
          .status(400)
          .json({ error: 'recipientId must be a string user id, numeric candidate id, or numeric string' });
      }
      recipientUserId = recipientRaw;
    }

    if (!recipientUserId || typeof recipientUserId !== 'string') {
      return res
        .status(400)
        .json({ error: 'Could not resolve recipient user id' });
    }

    if (recipientUserId === userId) {
      return res
        .status(400)
        .json({ error: 'Cannot start a conversation with yourself' });
    }

    const convChannel =
      typeof channel === 'string' && channel.trim().length > 0
        ? channel.trim()
        : null;

    // Ensure the recipient user exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientUserId },
    });

    if (!recipient) {
      // DEV FALLBACK: if the user row doesn't exist yet, still return
      // an ephemeral conversation so we can route into the messaging UI.
      const payload = {
        id: `dev-${Date.now()}`,
        channel: convChannel,
        isGroup: false,
        title: null,
        participants: [
          { userId },
          { userId: recipientUserId },
        ],
        otherUser: {
          id: recipientUserId,
          name: 'Candidate',
          email: null,
          headline: null,
          avatarUrl: null,
        },
        existedAlready: false,
      };

      return res.status(200).json({ conversation: payload });
    }

    // BLOCKING CHECK — if either side has blocked the other, do not create
    const blocks = await prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: userId, blockedId: recipientUserId },
          { blockerId: recipientUserId, blockedId: userId },
        ],
      },
    });

    if (blocks.length > 0) {
      return res
        .status(403)
        .json({ error: 'Messaging is blocked between these users' });
    }

    // Find existing non-group conversation between these two users.
    // If a specific channel is provided, we only consider conversations
    // in that channel. Otherwise, channel is not used as a filter.
    const existingParticipations =
      await prisma.conversationParticipant.findMany({
        where: {
          userId: { in: [userId, recipientUserId] },
          ...(convChannel
            ? { conversation: { isGroup: false, channel: convChannel } }
            : { conversation: { isGroup: false } }),
        },
        include: {
          conversation: {
            include: {
              participants: true,
            },
          },
        },
      });

    let conversation =
      existingParticipations
        .map((p) => p.conversation)
        .find(
          (conv) =>
            !conv.isGroup &&
            conv.participants.some((p) => p.userId === userId) &&
            conv.participants.some((p) => p.userId === recipientUserId)
        ) || null;

    const existedAlready = !!conversation;

    // If no existing 1:1 conversation, create a new one
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          isGroup: false,
          channel: convChannel,
          participants: {
            create: [{ userId }, { userId: recipientUserId }],
          },
        },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      });
    } else {
      // If we found an existing conversation, reload with participants + users
      conversation = await prisma.conversation.findUnique({
        where: { id: conversation.id },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      });
    }

    const other = conversation.participants.find(
      (p) => p.userId === recipientUserId
    )?.user;

    const payload = {
      id: conversation.id,
      channel: conversation.channel,
      isGroup: conversation.isGroup,
      title: conversation.title,
      participants: conversation.participants.map((p) => ({
        userId: p.userId,
      })),
      otherUser: other
        ? {
            id: other.id,
            name:
              other.name ||
              `${other.firstName || ''} ${other.lastName || ''}`.trim() ||
              other.email,
            email: other.email,
            headline: other.headline,
            avatarUrl: other.avatarUrl,
          }
        : null,
      existedAlready,
    };

    return res.status(200).json({ conversation: payload });
  } catch (err) {
    console.error('Error in /api/conversations:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
