// pages/api/messages.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * TEMP AUTH HELPER (DEV-ONLY)
 * ---------------------------
 * For now, we read the current user ID from the `x-user-id` header.
 * In production, replace this with your real auth/session logic
 * (e.g., reading from a JWT, next-auth session, or cookie).
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
      const { conversationId, channel } = req.query;

      // Return messages for a specific conversation
      if (conversationId) {
        const convId = Number(conversationId);
        if (Number.isNaN(convId)) {
          return res.status(400).json({ error: 'Invalid conversationId' });
        }

        // Ensure the current user is a participant in this conversation
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: convId,
            userId,
          },
        });

        if (!participant) {
          return res
            .status(403)
            .json({ error: 'Forbidden: not a participant of this conversation' });
        }

        const messages = await prisma.message.findMany({
          where: { conversationId: convId },
          orderBy: { createdAt: 'asc' },
          include: {
            sender: true,
          },
        });

        const mapped = messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          senderName: m.sender.name || m.sender.email,
          text: m.content,
          timeIso: m.createdAt.toISOString(),
          timeFormatted: m.createdAt.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));

        return res.status(200).json({ messages: mapped });
      }

      // Otherwise, list all conversations for this user.
      // Optional filter: ?channel=seeker|recruiter|coach|shared
      const channelFilter =
        typeof channel === 'string' && channel.trim().length > 0
          ? channel.trim()
          : null;

      const participations = await prisma.conversationParticipant.findMany({
        where: {
          userId,
          ...(channelFilter
            ? { conversation: { channel: channelFilter } }
            : {}),
        },
        include: {
          conversation: {
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
              participants: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });

      const conversations = participations.map((p) => {
        const c = p.conversation;

        const others = c.participants.filter((cp) => cp.userId !== userId);
        const primaryOther = others[0]?.user || null;
        const lastMessage = c.messages[0] || null;

        const name =
          c.isGroup && c.title
            ? c.title
            : primaryOther?.name ||
              primaryOther?.email ||
              (c.isGroup ? 'Group chat' : 'Conversation');

        const subtitle = c.isGroup
          ? `${c.participants.length} participants`
          : primaryOther?.headline || primaryOther?.location || '—';

        return {
          id: c.id,
          isGroup: c.isGroup,
          title: c.title,
          channel: c.channel,
          name,
          avatar: primaryOther?.avatarUrl || null,
          lastMessage: lastMessage ? lastMessage.content.slice(0, 60) : '',
          time: lastMessage
            ? lastMessage.createdAt.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '',
          unread: 0, // TODO: wire unread counts later
          muted: false, // TODO: add mute model/field if needed
          subtitle,
        };
      });

      return res.status(200).json({ conversations });
    }

    if (req.method === 'POST') {
      const { conversationId, recipientId, content, channel } = req.body || {};

      if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const trimmedContent = content.trim();
      const convChannel =
        typeof channel === 'string' && channel.trim().length > 0
          ? channel.trim()
          : null;

      let conversation;

      // If a specific conversation is provided, use it
      if (conversationId) {
        const convId = Number(conversationId);
        if (Number.isNaN(convId)) {
          return res.status(400).json({ error: 'Invalid conversationId' });
        }

        conversation = await prisma.conversation.findUnique({
          where: { id: convId },
          include: {
            participants: true,
          },
        });

        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }

        // Ensure sender is a participant
        if (!conversation.participants.some((p) => p.userId === userId)) {
          return res
            .status(403)
            .json({ error: 'Forbidden: not a participant of this conversation' });
        }
      } else if (recipientId) {
        // 1:1 conversation: find or create, scoped by channel if provided
        const recipient = await prisma.user.findUnique({
          where: { id: recipientId },
        });

        if (!recipient) {
          return res.status(404).json({ error: 'Recipient not found' });
        }

        // Find existing non-group conversation between these two users
        // If a specific channel is provided, we only consider conversations
        // in that channel. Otherwise, channel is not used as a filter.
        const existingParticipations =
          await prisma.conversationParticipant.findMany({
            where: {
              userId: { in: [userId, recipientId] },
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

        conversation = existingParticipations
          .map((p) => p.conversation)
          .find(
            (conv) =>
              !conv.isGroup &&
              conv.participants.some((p) => p.userId === userId) &&
              conv.participants.some((p) => p.userId === recipientId),
          );

        // If no existing 1:1 conversation, create a new one
        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              isGroup: false,
              channel: convChannel,
              participants: {
                create: [{ userId }, { userId: recipientId }],
              },
            },
            include: {
              participants: true,
            },
          });
        }
      } else {
        return res.status(400).json({
          error:
            'conversationId or recipientId is required to send a message',
        });
      }

      // BLOCKING CHECK — if either side has blocked the other, do not send
      const otherParticipants = conversation.participants.filter(
        (p) => p.userId !== userId,
      );
      const otherUserIds = otherParticipants.map((p) => p.userId);

      if (otherUserIds.length > 0) {
        const blocks = await prisma.userBlock.findMany({
          where: {
            OR: [
              {
                blockerId: userId,
                blockedId: { in: otherUserIds },
              },
              {
                blockerId: { in: otherUserIds },
                blockedId: userId,
              },
            ],
          },
        });

        if (blocks.length > 0) {
          return res
            .status(403)
            .json({ error: 'Messaging is blocked between these users' });
        }
      }

      // Create the message
      const message = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          content: trimmedContent,
        },
        include: {
          sender: true,
        },
      });

      const response = {
        id: message.id,
        conversationId: conversation.id,
        senderId: message.senderId,
        senderName: message.sender.name || message.sender.email,
        text: message.content,
        timeIso: message.createdAt.toISOString(),
        timeFormatted: message.createdAt.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
        }),
        channel: conversation.channel,
      };

      return res.status(201).json({ message: response });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Error in /api/messages:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
