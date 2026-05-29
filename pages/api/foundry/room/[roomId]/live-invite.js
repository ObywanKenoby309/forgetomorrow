// pages/api/foundry/room/[roomId]/live-invite.js
// Host/co-host ad-hoc invites from inside an active Foundry.
// GET  -> returns eligible contacts and copyable room links.
// POST -> sends internal or external ad-hoc invite.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { createNotification } from '@/lib/notifications/writer';
import { sendFoundryInviteEmail } from '@/lib/foundry/email';

function getBaseUrl(req) {
  const envUrl = process.env.NEXTAUTH_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  return `${proto}://${host}`;
}

function displayName(user, fallback = 'Participant') {
  return (
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    fallback
  );
}

function notificationScope(role) {
  if (role === 'COACH') return 'COACH';
  if (role === 'RECRUITER' || role === 'ADMIN') return 'RECRUITER';
  return 'SEEKER';
}

function formatFoundryDate(room) {
  const date = room.scheduledAt || room.startedAt || new Date();
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: room.timezone || 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString();
  }
}

function splitCalendarDateTime(room) {
  const date = new Date(room.scheduledAt || room.startedAt || Date.now());
  return {
    date,
    time: date.toTimeString().slice(0, 5),
  };
}

async function getRoomWithAccess(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return { errorStatus: 401, error: 'Not authenticated' };
  }

  const { roomId } = req.query;
  const resolvedRoomId = Array.isArray(roomId) ? roomId[0] : roomId;

  if (!resolvedRoomId) {
    return { errorStatus: 400, error: 'Missing roomId' };
  }

  const room = await prisma.foundryRoom.findUnique({
    where: { roomId: resolvedRoomId },
    include: {
      host: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      participants: {
        where: { leftAt: null },
        select: { userId: true },
      },
      lobbyParticipants: {
        where: { status: { in: ['WAITING', 'ADMITTED'] } },
        select: { userId: true },
      },
      invitees: {
        select: { userId: true, email: true, status: true },
      },
    },
  });

  if (!room) return { errorStatus: 404, error: 'Foundry not found' };
  if (room.status === 'ENDED') return { errorStatus: 410, error: 'ROOM_ENDED' };

  const isHost = room.hostId === session.user.id;
  const isCoHost = room.coHostUserId === session.user.id;

  if (!isHost && !isCoHost) {
    return { errorStatus: 403, error: 'Only the host or co-host can invite people.' };
  }

  return { session, room };
}

async function ensureGuestToken(room) {
  if (room.guestToken) return room.guestToken;

  const guestToken = nanoid(16);
  await prisma.foundryRoom.update({
    where: { id: room.id },
    data: { guestToken },
  });
  room.guestToken = guestToken;
  return guestToken;
}

export default async function handler(req, res) {
  try {
    const ctx = await getRoomWithAccess(req, res);
    if (ctx.error) return res.status(ctx.errorStatus).json({ error: ctx.error });

    const { session, room } = ctx;
    const baseUrl = getBaseUrl(req);
    const guestToken = await ensureGuestToken(room);
    const ftLink = `${baseUrl}/foundry/${room.roomId}`;
    const guestLink = `${baseUrl}/foundry/join/${room.roomId}?code=${guestToken}`;

    if (req.method === 'GET') {
      const excludedIds = new Set([
        room.hostId,
        room.coHostUserId,
        ...room.participants.map((p) => p.userId).filter(Boolean),
        ...room.lobbyParticipants.map((p) => p.userId).filter(Boolean),
        ...room.invitees.map((i) => i.userId).filter(Boolean),
      ].filter(Boolean));

      const contactRows = await prisma.contact.findMany({
        where: {
          OR: [
            { userId: session.user.id },
            { contactUserId: session.user.id },
          ],
        },
        select: {
          userId: true,
          contactUserId: true,
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              headline: true,
              role: true,
              avatarUrl: true,
            },
          },
          contactUser: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              headline: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      });

      const byId = new Map();
      for (const row of contactRows) {
        const other = row.userId === session.user.id ? row.contactUser : row.user;
        if (!other?.id || excludedIds.has(other.id)) continue;
        byId.set(other.id, {
          id: other.id,
          name: displayName(other, 'Contact'),
          email: other.email || '',
          headline: other.headline || '',
          role: other.role || 'SEEKER',
          avatarUrl: other.avatarUrl || null,
        });
      }

      return res.status(200).json({
        contacts: Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name)),
        ftLink,
        guestLink,
        guestCode: guestToken,
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { type, userId, email, name } = req.body || {};
    const hostName = displayName(room.host, 'Your host');
    const dateStr = formatFoundryDate(room);
    const { date: calDate, time } = splitCalendarDateTime(room);

    if (type === 'internal') {
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      if (userId === room.hostId) return res.status(400).json({ error: 'Host is already in this Foundry.' });

      const isAlreadyPresent = room.participants.some((p) => p.userId === userId) ||
        room.lobbyParticipants.some((p) => p.userId === userId) ||
        room.invitees.some((i) => i.userId === userId);

      if (isAlreadyPresent) {
        return res.status(409).json({ error: 'That person is already in this Foundry, lobby, or invite list.' });
      }

      const contact = await prisma.contact.findFirst({
        where: {
          OR: [
            { userId: session.user.id, contactUserId: userId },
            { userId, contactUserId: session.user.id },
          ],
        },
      });

      const acceptedRequest = await prisma.contactRequest.findFirst({
        where: {
          status: 'ACCEPTED',
          OR: [
            { fromUserId: session.user.id, toUserId: userId },
            { fromUserId: userId, toUserId: session.user.id },
          ],
        },
      }).catch(() => null);

      if (!contact && !acceptedRequest) {
        return res.status(403).json({ error: 'You can only invite ForgeTomorrow contacts from inside the room.' });
      }

      const invitedUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });

      if (!invitedUser) return res.status(404).json({ error: 'User not found' });

      await prisma.foundryInvitee.create({
        data: {
          roomId: room.id,
          userId,
          name: displayName(invitedUser, 'Participant'),
          status: 'PENDING',
        },
      }).catch(() => null);

      await prisma.foundryLobbyParticipant.upsert({
        where: { roomId_userId: { roomId: room.id, userId } },
        update: {
          status: 'WAITING',
          guestName: displayName(invitedUser, 'Participant'),
          joinedAt: new Date(),
        },
        create: {
          roomId: room.id,
          userId,
          guestName: displayName(invitedUser, 'Participant'),
          status: 'WAITING',
        },
      });

      await createNotification({
        userId,
        actorUserId: session.user.id,
        category: 'CALENDAR',
        scope: notificationScope(invitedUser.role),
        entityType: 'CALENDAR_ITEM',
        entityId: room.roomId,
        dedupeKey: `foundry_live_invite_${room.roomId}_${userId}_${Date.now()}`,
        title: `Join Foundry now: ${room.title}`,
        body: `${hostName} invited you to join a live Foundry meeting.`,
        requiresAction: true,
        metadata: { roomId: room.roomId, roomUrl: ftLink, scheduledAt: room.scheduledAt || room.startedAt, timezone: room.timezone },
      });

      const existingMirror = await prisma.seekerCalendarItem.findFirst({
        where: {
          userId,
          source: 'recruiter',
          sourceItemId: `foundry_live_${room.roomId}`,
        },
      });

      const mirrorData = {
        userId,
        date: calDate,
        time,
        timezone: room.timezone || 'America/New_York',
        scheduledAtUtc: calDate,
        title: `Foundry with ${hostName}: ${room.title}`,
        type: 'Appointment',
        status: 'Scheduled',
        notes: `Join link: ${ftLink}`,
        foundryJoinUrl: ftLink,
        enableVideo: true,
        source: 'recruiter',
        sourceItemId: `foundry_live_${room.roomId}`,
      };

      if (existingMirror) {
        await prisma.seekerCalendarItem.update({
          where: { id: existingMirror.id },
          data: mirrorData,
        });
      } else {
        await prisma.seekerCalendarItem.create({ data: mirrorData });
      }

      try {
        const { getOrCreateConversation } = await import('@/lib/signal');
        const conv = await getOrCreateConversation(session.user.id, userId);
        if (conv) {
          await prisma.message.create({
            data: {
              conversationId: conv.id,
              senderId: session.user.id,
              content: `🔨 ${hostName} invited you to join **${room.title}** in Foundry.\n\nJoin here: ${ftLink}`,
            },
          });
        }
      } catch {
        // Signal is helpful but not required.
      }

      return res.status(200).json({ ok: true, type: 'internal', ftLink, guestLink, guestCode: guestToken });
    }

    if (type === 'external') {
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail) return res.status(400).json({ error: 'Missing external guest email' });
      const cleanName = String(name || '').trim() || cleanEmail;

      await prisma.foundryInvitee.create({
        data: {
          roomId: room.id,
          email: cleanEmail,
          name: cleanName,
          status: 'PENDING',
        },
      }).catch(() => null);

      await sendFoundryInviteEmail({
        to: cleanEmail,
        toName: cleanName,
        hostName,
        sessionTitle: room.title,
        dateStr,
        timezone: room.timezone || 'America/New_York',
        joinUrl: guestLink,
        guestCode: guestToken || null,
        durationMinutes: room.durationMinutes || 60,
        isExternalGuest: true,
      });

      return res.status(200).json({ ok: true, type: 'external', ftLink, guestLink, guestCode: guestToken });
    }

    return res.status(400).json({ error: 'Invalid invite type' });
  } catch (err) {
    console.error('[foundry/live-invite]', err);
    return res.status(500).json({ error: 'Could not send Foundry invite' });
  }
}