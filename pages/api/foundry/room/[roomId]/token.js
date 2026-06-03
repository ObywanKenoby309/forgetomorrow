// pages/api/foundry/room/[roomId]/token.js
// Issues Daily tokens. Under the lobby system:
// - Host/co-host: immediate token, sets hostJoinedAt + LOBBY status
// - Participants: only issued AFTER lobby admission (status=ADMITTED)
// - Direct token requests from non-host/non-cohost are blocked (use lobby API)

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { createDailyToken, dailyRoomUrl } from '@/lib/foundry/daily';

const EARLY_GATE_MINUTES = 15;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const { roomId } = req.query;
  const resolvedRoomId = Array.isArray(roomId) ? roomId[0] : roomId;

  try {
    const room = await prisma.foundryRoom.findUnique({
      where: { roomId: resolvedRoomId },
      select: {
        id: true, hostId: true, coHostUserId: true, status: true,
        dailyRoomName: true, scheduledAt: true, durationMinutes: true,
        hostJoinedAt: true, roomOpenedAt: true, isLocked: true,
      },
    });

    if (!room) return res.status(404).json({ error: 'Foundry not found' });
    if (room.status === 'ENDED') return res.status(410).json({ error: 'ROOM_ENDED' });

    const now = Date.now();
    const isHost = room.hostId === session.user.id;
    const isCoHost = room.coHostUserId === session.user.id;
    const isInstantRoom = !room.scheduledAt;

    if (!isHost && !isCoHost) {
      const blockedLobbyEntry = await prisma.foundryLobbyParticipant.findFirst({
        where: {
          roomId: room.id,
          userId: session.user.id,
          status: { in: ['DECLINED', 'BANNED'] },
        },
        orderBy: { joinedAt: 'desc' },
      });

      if (blockedLobbyEntry) {
        return res.status(403).json({ error: 'BANNED_FROM_ROOM' });
      }
    }

    // Time gating
    if (room.scheduledAt) {
      const scheduledMs = new Date(room.scheduledAt).getTime();
      const earlyGateMs = scheduledMs - EARLY_GATE_MINUTES * 60 * 1000;
      const endMs = scheduledMs + (room.durationMinutes || 60) * 60 * 1000;

      if (now < earlyGateMs) {
        return res.status(403).json({
          error: 'ROOM_NOT_OPEN_YET',
          scheduledAt: room.scheduledAt.toISOString(),
          opensAt: new Date(earlyGateMs).toISOString(),
        });
      }

      if (now > endMs) {
        if (room.status !== 'ENDED') {
          await prisma.foundryRoom.update({
            where: { id: room.id },
            data: { status: 'ENDED', endedAt: new Date() },
          }).catch(() => {});
        }
        return res.status(410).json({ error: 'ROOM_ENDED' });
      }
    }

    // Host/co-host — immediate token
    if (isHost || isCoHost) {
      // Set hostJoinedAt and move to LOBBY status on first join
      if (!room.hostJoinedAt) {
        await prisma.foundryRoom.update({
          where: { id: room.id },
          data: {
            hostJoinedAt: new Date(),
            status: 'LOBBY',
          },
        }).catch(() => {});
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true },
      });

      const userName = user?.name ||
        [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
        user?.email || 'Host';

      const dailyRoomName = room.dailyRoomName || resolvedRoomId;

      const token = await createDailyToken({
        roomId: dailyRoomName,
        userId: session.user.id,
        userName,
        isOwner: isHost, // only the host is Daily owner; co-host is not
        avatarUrl: user?.avatarUrl || null,
        role: user?.role || null,
      });

      const scheduledEndAt = room.scheduledAt
        ? new Date(new Date(room.scheduledAt).getTime() + (room.durationMinutes || 60) * 60 * 1000).toISOString()
        : null;

      return res.status(200).json({
        token,
        roomUrl: dailyRoomUrl(dailyRoomName),
        dailyRoomName,
        userName,
        isOwner: isHost,
        isCoHost,
        scheduledEndAt,
      });
    }

// Instant rooms normally allow authenticated FT users to join directly.
// If the host/co-host locks the Foundry, non-hosts must be admitted through the lobby.
if (isInstantRoom) {
  if (room.isLocked) {
    const admittedInstantEntry = await prisma.foundryLobbyParticipant.findFirst({
      where: {
        roomId: room.id,
        userId: session.user.id,
        status: 'ADMITTED',
      },
      orderBy: { admittedAt: 'desc' },
    });

    if (!admittedInstantEntry) {
      await prisma.foundryLobbyParticipant.upsert({
        where: {
          roomId_userId: {
            roomId: room.id,
            userId: session.user.id,
          },
        },
        update: {
          status: 'WAITING',
          joinedAt: new Date(),
        },
        create: {
          roomId: room.id,
          userId: session.user.id,
          status: 'WAITING',
        },
      }).catch(() => {});

      return res.status(403).json({ error: 'WAITING_FOR_ADMISSION' });
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
      role: true,
    },
  });

  const userName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    'Participant';

  const dailyRoomName = room.dailyRoomName || resolvedRoomId;

  const token = await createDailyToken({
    roomId: dailyRoomName,
    userId: session.user.id,
    userName,
    isOwner: false,
    avatarUrl: user?.avatarUrl || null,
    role: user?.role || null,
  });

  return res.status(200).json({
    token,
    roomUrl: dailyRoomUrl(dailyRoomName),
    dailyRoomName,
    userName,
    isOwner: false,
    instantRoom: true,
    userRole: user?.role || null,
  });
}

    // Non-host FT users — must go through lobby
    // Check if they have an ADMITTED lobby entry
    const lobbyEntry = await prisma.foundryLobbyParticipant.findFirst({
      where: {
        roomId: room.id,
        userId: session.user.id,
        status: 'ADMITTED',
      },
      orderBy: { admittedAt: 'desc' },
    });

    if (!lobbyEntry) {
      // Check if they're still waiting
      const waitingEntry = await prisma.foundryLobbyParticipant.findFirst({
        where: { roomId: room.id, userId: session.user.id, status: 'WAITING' },
      });

      if (waitingEntry) {
        return res.status(403).json({ error: 'WAITING_FOR_ADMISSION' });
      }

      if (!room.hostJoinedAt) {
        return res.status(403).json({ error: 'WAITING_FOR_HOST' });
      }

      return res.status(403).json({ error: 'WAITING_FOR_ADMISSION' });
    }

    // Admitted — issue token
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true },
    });

    const userName = user?.name ||
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      user?.email || 'Participant';

    const dailyRoomName = room.dailyRoomName || resolvedRoomId;

    const token = await createDailyToken({
      roomId: dailyRoomName,
      userId: session.user.id,
      userName,
      isOwner: false,
      avatarUrl: user?.avatarUrl || null,
      role: user?.role || null,
    });

    const scheduledEndAt = room.scheduledAt
      ? new Date(new Date(room.scheduledAt).getTime() + (room.durationMinutes || 60) * 60 * 1000).toISOString()
      : null;

    return res.status(200).json({
      token,
      roomUrl: dailyRoomUrl(dailyRoomName),
      dailyRoomName,
      userName,
      isOwner: false,
      scheduledEndAt,
    });

  } catch (err) {
    console.error('[foundry/token]', { roomId: resolvedRoomId, message: String(err?.message || err) });
    return res.status(500).json({
      error: 'Could not generate meeting token',
      detail: process.env.NODE_ENV !== 'production' ? String(err?.message || err) : undefined,
    });
  }
}