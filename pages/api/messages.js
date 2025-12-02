// pages/api/messages.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * DEV-ONLY AUTH STUB
 * ------------------
 * For now we read the current user ID from the `x-user-id` header.
 * In production, replace this with your real NextAuth / session logic.
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

  try {
    if (req.method === 'GET') {
      return handleGet(req, res, userId);
    }

    if (req.method === 'POST') {
      return handlePost(req, res, userId);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error in /api/messages:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/messages
 *
 * Two modes:
 * 1) /api/messages?channel=recruiter
 *    → list conversations for that channel for the current user
 *
 * 2) /api/messages?conversationId=123
 *    → list messages in that conversation (if user is a participant)
 */
async function handleGet(req, res, userId) {
  const { channel, conversationId } = req.query || {};

  // Mode 1: list conversations by channel (used by recruiter messaging inbox)
  if (typeof channel === 'string' && channel.trim().length > 0) {
    const channelKey = channel.trim();

    // Find all conversations in this channel where the user participates
    const participations = await prisma.conversationParticipant.findMany({
      where: {
        userId,
        conversation: {
          channel: channelKey,
        },
      },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 1, // we'll fetch last message separately / keep light
            },
            participants: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const conversations = [];

    for (const part of participations) {
      const conv = part.conversation;

      // Get last message for snippet (separate query to allow older DBs)
      const lastMessageRecord = await prisma.message.findFirst({
        where: { conversationId: conv.id },
        orderBy: { createdAt: 'desc' },
      });

      const otherParticipant = conv.participants.find(
        (p) => p.userId !== userId
      );
      const otherUser = otherParticipant?.user || null;

      conversations.push({
        id: conv.id,
        channel: conv.channel,
        title: conv.title,
        // Best-effort "name" for the other side (used as candidate label)
        name:
          otherUser?.name ||
          (otherUser?.firstName || otherUser?.lastName
            ? `${otherUser.firstName || ''} ${
                otherUser.lastName || ''
              }`.trim()
            : otherUser?.email || 'Conversation'),
        lastMessage: lastMessageRecord?.content || '',
        lastMessageAt: lastMessageRecord?.createdAt?.toISOString() || null,
        unread: 0, // TODO: add read receipts later
      });
    }

    return res.status(200).json({ conversations });
  }

  // Mode 2: list messages in a specific conversation
  if (typeof conversationId === 'string' && conversationId.trim().length > 0) {
    const convId = Number(conversationId);
    if (!Number.isInteger(convId)) {
      return res
        .status(400)
        .json({ error: 'conversationId must be an integer' });
    }

    // Ensure the user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: convId,
        userId,
      },
    });

    if (!participant) {
      return res.status(403).json({
        error: 'You are not a participant in this conversation',
      });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: 'asc' },
    });

    const shaped = messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      text: m.content, // map Prisma `content` → API `text`
      timeIso: m.createdAt.toISOString(),
    }));

    return res.status(200).json({ messages: shaped });
  }

  return res.status(400).json({
    error:
      'Missing query. Provide either ?channel=recruiter or ?conversationId=123',
  });
}

/**
 * POST /api/messages
 *
 * Body:
 * {
 *   conversationId: number,
 *   content: string,        // OR `text`, we normalize both
 *   channel?: "recruiter"   // optional (for future use)
 * }
 */
async function handlePost(req, res, userId) {
  const { conversationId, content, text, channel } = req.body || {};

  const convId = Number(conversationId);
  if (!Number.isInteger(convId)) {
    return res
      .status(400)
      .json({ error: 'conversationId (integer) is required' });
  }

  const messageText = (
    typeof content === 'string' && content.trim().length > 0
      ? content
      : typeof text === 'string'
      ? text
      : ''
  ).trim();

  if (!messageText) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  // Ensure the user is a participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId: convId,
      userId,
    },
    include: {
      conversation: true,
    },
  });

  if (!participant) {
    return res
      .status(403)
      .json({ error: 'You are not a participant in this conversation' });
  }

  // OPTIONAL: sanity-check that channel matches conversation.channel
  if (typeof channel === 'string' && participant.conversation.channel) {
    const normalizedRequested = channel.trim();
    if (normalizedRequested !== participant.conversation.channel) {
      // We don't hard-fail this yet, but we could.
      console.warn(
        '[messages POST] Channel mismatch:',
        normalizedRequested,
        'vs',
        participant.conversation.channel
      );
    }
  }

  const msg = await prisma.message.create({
    data: {
      conversationId: convId,
      senderId: userId,
      content: messageText,
    },
  });

  return res.status(200).json({
    message: {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      text: msg.content,
      timeIso: msg.createdAt.toISOString(),
    },
  });
}
