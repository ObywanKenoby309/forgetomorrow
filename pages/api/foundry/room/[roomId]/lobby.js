// pages/api/foundry/room/[roomId]/lobby.js
// Handles lobby registration and status polling.
//
// POST — register as waiting (FT user or guest)
//   body: { guestName?, guestCode? }
//   returns: { lobbyId, status: 'WAITING' }
//
// GET — poll your lobby status
//   query: ?lobbyId=xxx  (for guests)
//   returns: { status: 'WAITING'|'ADMITTED'|'DECLINED', token?, roomUrl? }
//
// Host GET (no lobbyId) — returns full waiting list
//   returns: { waitingList: [...] }

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { createDailyToken, dailyRoomUrl } from '@/lib/foundry/daily';
import { nanoid } from 'nanoid';

const EARLY_GATE_MINUTES = 15;
const CAN_HOST = ['COACH', 'RECRUITER', 'ADMIN', 'OWNER', 'SITE_ADMIN'];

export default async function handler(req, res) {
  const { roomId, lobbyId } = req.query;
  const resolvedRoomId = Array.isArray(roomId) ? roomId[0] : roomId;

  const room = await prisma.foundryRoom.findUnique({
    where: { roomId: resolvedRoomId },
    select: {
      id: true, roomId: true, status: true, hostId: true,
      scheduledAt: true, durationMinutes: true,
      hostJoinedAt: true, roomOpenedAt: true,
      dailyRoomName: true, guestToken: true,
      coHostUserId: true,
    },
  });

  if (!room) return res.status(404).json({ error: 'Foundry not found' });
  if (room.status === 'ENDED') return res.status(410).json({ error: 'ROOM_ENDED' });

  const now = Date.now();

  // Time gate check
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
      await prisma.foundryRoom.update({
        where: { id: room.id },
        data: { status: 'ENDED', endedAt: new Date() },
      }).catch(() => {});
      return res.status(410).json({ error: 'ROOM_ENDED' });
    }
  }

  // ── POST: Register in lobby ──────────────────────────────────────────────
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions).catch(() => null);
    const { guestName, guestCode } = req.body || {};

    // Validate guest code if provided
    if (guestCode && room.guestToken !== guestCode) {
      return res.status(403).json({ error: 'Invalid invite code' });
    }

    // If host — skip lobby, set hostJoinedAt and go straight to token
    if (session?.user?.id && session.user.id === room.hostId) {
      if (!room.hostJoinedAt) {
        await prisma.foundryRoom.update({
          where: { id: room.id },
          data: { hostJoinedAt: new Date(), status: 'LOBBY' },
        });
      }
      return res.status(200).json({ isHost: true, status: 'HOST' });
    }

    // Co-host also skips lobby
    if (session?.user?.id && session.user.id === room.coHostUserId) {
      return res.status(200).json({ isHost: true, isCoHost: true, status: 'HOST' });
    }

    // Check if host has joined yet
    if (!room.hostJoinedAt) {
      return res.status(200).json({ status: 'WAITING_FOR_HOST' });
    }

    // Register or find existing lobby entry
    const displayName = session?.user?.name ||
      (session?.user ? [session.user.firstName, session.user.lastName].filter(Boolean).join(' ') : null) ||
      guestName?.trim() || 'Guest';

    let entry;

    if (session?.user?.id) {
      // FT user — upsert
      entry = await prisma.foundryLobbyParticipant.upsert({
        where: {
          // unique constraint on roomId + userId
          roomId_userId: { roomId: room.id, userId: session.user.id },
        },
        create: {
          roomId: room.id,
          userId: session.user.id,
          guestName: displayName,
          status: room.roomOpenedAt ? 'WAITING' : 'WAITING',
        },
        update: {
          // refresh joinedAt if they re-enter lobby
          joinedAt: new Date(),
        },
      }).catch(async () => {
        // fallback if unique index doesn't exist yet
        return prisma.foundryLobbyParticipant.create({
          data: {
            roomId: room.id,
            userId: session.user.id,
            guestName: displayName,
            status: 'WAITING',
          },
        });
      });
    } else {
      // Guest — create new entry each time (no upsert, guests are ephemeral)
      if (!guestName?.trim()) {
        return res.status(400).json({ error: 'guestName required' });
      }
      entry = await prisma.foundryLobbyParticipant.create({
        data: {
          roomId: room.id,
          guestName: guestName.trim(),
          guestCode: guestCode || null,
          status: 'WAITING',
        },
      });
    }

    // If room is already ACTIVE (host already admitted people), auto-admit
    if (room.status === 'ACTIVE' && room.roomOpenedAt) {
      return res.status(200).json({
        lobbyId: entry.id,
        status: 'ADMITTED',
        autoAdmitted: true,
      });
    }

    return res.status(200).json({ lobbyId: entry.id, status: 'WAITING' });
  }

  // ── GET: Poll status or get waiting list ─────────────────────────────────
  if (req.method === 'GET') {
    const session = await getServerSession(req, res, authOptions).catch(() => null);
    const isHost = session?.user?.id === room.hostId;
    const isCoHost = session?.user?.id === room.coHostUserId;

    // Host/co-host — return waiting list
    if (isHost || isCoHost) {
      const waitingList = await prisma.foundryLobbyParticipant.findMany({
        where: { roomId: room.id, status: 'WAITING' },
        orderBy: { joinedAt: 'asc' },
        include: {
          user: {
            select: { id: true, name: true, firstName: true, lastName: true, avatarUrl: true, role: true },
          },
        },
      });

      return res.status(200).json({
        waitingList: waitingList.map(p => ({
          lobbyId: p.id,
          userId: p.userId,
          name: p.user
            ? (p.user.name || [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || 'Unknown')
            : (p.guestName || 'Guest'),
          avatarUrl: p.user?.avatarUrl || null,
          role: p.user?.role || 'GUEST',
          isGuest: !p.userId,
          joinedAt: p.joinedAt.toISOString(),
        })),
        roomStatus: room.status,
        hostJoinedAt: room.hostJoinedAt?.toISOString() || null,
      });
    }

    // Participant — poll their own status
    const resolvedLobbyId = Array.isArray(lobbyId) ? lobbyId[0] : lobbyId;
    if (!resolvedLobbyId) {
      return res.status(400).json({ error: 'lobbyId required' });
    }

    const entry = await prisma.foundryLobbyParticipant.findUnique({
      where: { id: resolvedLobbyId },
    });

    if (!entry) return res.status(404).json({ error: 'Lobby entry not found' });

    if (entry.status === 'DECLINED') {
      return res.status(200).json({ status: 'DECLINED' });
    }

    if (entry.status === 'ADMITTED') {
      // Issue Daily token now
      const dailyRoomName = room.dailyRoomName || room.roomId;
      const guestId = entry.userId || `guest_${nanoid(8)}`;
      const userName = entry.guestName || 'Guest';

      try {
        const token = await createDailyToken({
          roomId: dailyRoomName,
          userId: guestId,
          userName,
          isOwner: false,
        });

        const scheduledEndAt = room.scheduledAt
          ? new Date(new Date(room.scheduledAt).getTime() + (room.durationMinutes || 60) * 60 * 1000).toISOString()
          : null;

        return res.status(200).json({
          status: 'ADMITTED',
          token,
          roomUrl: dailyRoomUrl(dailyRoomName),
          scheduledEndAt,
        });
      } catch (err) {
        console.error('[foundry/lobby] token error:', err);
        return res.status(500).json({ error: 'Could not generate token' });
      }
    }

    // Still waiting — check if host has joined since registration
    if (!room.hostJoinedAt) {
      return res.status(200).json({ status: 'WAITING_FOR_HOST' });
    }

    return res.status(200).json({ status: 'WAITING' });
  }

  return res.status(405).end();
}