// pages/api/foundry/today.js
// GET — returns today's Foundries for the current user.
// Includes rooms the user hosts, participates in, or has been invited to.
// Used by the Foundry lobby to show live / upcoming joinable sessions.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

const JOIN_WINDOW_MINUTES_BEFORE = 30;
const EXPIRE_WINDOW_HOURS_AFTER = 4;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getHostName(host) {
  return [host?.firstName, host?.lastName].filter(Boolean).join(' ') || 'Host';
}

function getJoinState(room, now) {
  if (room.status === 'ACTIVE') {
    return { joinState: 'LIVE', canJoin: true };
  }

  if (room.status === 'ENDED') {
    return { joinState: 'ENDED_OR_EXPIRED', canJoin: false };
  }

  if (!room.scheduledAt) {
    return { joinState: 'UPCOMING', canJoin: false };
  }

  const scheduledAt = new Date(room.scheduledAt);
  const joinWindowStart = new Date(
    scheduledAt.getTime() - JOIN_WINDOW_MINUTES_BEFORE * 60 * 1000
  );
  const expireWindowEnd = new Date(
    scheduledAt.getTime() + EXPIRE_WINDOW_HOURS_AFTER * 60 * 60 * 1000
  );

  if (now >= joinWindowStart && now <= expireWindowEnd) {
    return { joinState: 'JOIN_SOON', canJoin: true };
  }

  if (now > expireWindowEnd) {
    return { joinState: 'ENDED_OR_EXPIRED', canJoin: false };
  }

  return { joinState: 'UPCOMING', canJoin: false };
}

function relationshipFor(room, userId) {
  if (room.hostId === userId) return 'HOST';

  const isParticipant = room.participants?.some((p) => p.userId === userId);
  if (isParticipant) return 'PARTICIPANT';

  const isInvitee = room.invitees?.some((i) => i.userId === userId);
  if (isInvitee) return 'INVITEE';

  return 'UNKNOWN';
}

function serializeRoom(room, userId, now) {
  const { joinState, canJoin } = getJoinState(room, now);

  return {
    roomId: room.roomId,
    title: room.title,
    status: room.status,
    scheduledAt: room.scheduledAt,
    startedAt: room.startedAt,
    endedAt: room.endedAt,
    hostId: room.hostId,
    hostName: getHostName(room.host),
    userRelationship: relationshipFor(room, userId),
    joinState,
    canJoin,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = session.user.id;
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  try {
    const rooms = await prisma.foundryRoom.findMany({
      where: {
        status: { in: ['ACTIVE', 'SCHEDULED'] },
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
          { invitees: { some: { userId } } },
        ],
        AND: [
          {
            OR: [
              { status: 'ACTIVE' },
              {
                scheduledAt: {
                  gte: todayStart,
                  lte: todayEnd,
                },
              },
            ],
          },
        ],
      },
      orderBy: [
        { status: 'asc' },
        { scheduledAt: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 12,
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        participants: {
          select: {
            userId: true,
            leftAt: true,
          },
          where: {
            leftAt: null,
          },
        },
        invitees: {
          select: {
            userId: true,
            status: true,
          },
          where: {
            userId,
          },
        },
      },
    });

    const todayFoundries = rooms
      .map((room) => serializeRoom(room, userId, now))
      .filter((room) => room.joinState !== 'ENDED_OR_EXPIRED')
      .sort((a, b) => {
        const priority = { LIVE: 0, JOIN_SOON: 1, UPCOMING: 2 };
        const ap = priority[a.joinState] ?? 9;
        const bp = priority[b.joinState] ?? 9;

        if (ap !== bp) return ap - bp;

        const at = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
        const bt = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;

        return at - bt;
      });

    return res.status(200).json({ rooms: todayFoundries });
  } catch (err) {
    console.error('[foundry/today]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
