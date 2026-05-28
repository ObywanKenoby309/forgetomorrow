// pages/api/foundry/room/[roomId]/token.js
// Returns a Daily meeting token for an authenticated ForgeTomorrow user.
// Enforces the cost-controlled room lifecycle:
//   - ROOM_NOT_OPEN_YET  : too early (before scheduledAt - 15 min)
//   - WAITING_FOR_HOST   : lobby window but host hasn't joined yet
//   - ROOM_ENDED         : past scheduled end or status=ENDED
// Host joining sets hostJoinedAt, opening the room for others.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { createDailyToken, dailyRoomUrl } from '@/lib/foundry/daily';

const EARLY_GATE_MINUTES = 15; // how many minutes before start people can enter lobby

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
        id: true,
        hostId: true,
        status: true,
        dailyRoomName: true,
        scheduledAt: true,
        durationMinutes: true,
        hostJoinedAt: true,
      },
    });

    if (!room) return res.status(404).json({ error: 'Foundry not found' });
    if (room.status === 'ENDED') return res.status(410).json({ error: 'ROOM_ENDED' });

    const now = Date.now();
    const isHost = room.hostId === session.user.id;

    // ── Scheduled room time gating ─────────────────────────────────────────
    if (room.scheduledAt) {
      const scheduledMs = new Date(room.scheduledAt).getTime();
      const earlyGateMs = scheduledMs - EARLY_GATE_MINUTES * 60 * 1000;
      const duration = room.durationMinutes || 60;
      const endMs = scheduledMs + duration * 60 * 1000;

      // Too early — nobody gets in
      if (now < earlyGateMs) {
        return res.status(403).json({
          error: 'ROOM_NOT_OPEN_YET',
          scheduledAt: room.scheduledAt.toISOString(),
          opensAt: new Date(earlyGateMs).toISOString(),
        });
      }

      // Past scheduled end — room should be ended
      if (now > endMs) {
        // Mark as ended in DB if not already
        if (room.status !== 'ENDED') {
          await prisma.foundryRoom.update({
            where: { id: room.id },
            data: { status: 'ENDED', endedAt: new Date() },
          }).catch(() => {});
        }
        return res.status(410).json({ error: 'ROOM_ENDED' });
      }
    }

    // ── Host opens the room ────────────────────────────────────────────────
    if (isHost && !room.hostJoinedAt) {
      await prisma.foundryRoom.update({
        where: { id: room.id },
        data: {
          hostJoinedAt: new Date(),
          status: 'ACTIVE',
          startedAt: room.startedAt ?? new Date(),
        },
      }).catch(() => {});
    }

    // ── Non-host: block until host has joined ─────────────────────────────
    if (!isHost && !room.hostJoinedAt) {
      return res.status(403).json({
        error: 'WAITING_FOR_HOST',
        scheduledAt: room.scheduledAt?.toISOString() || null,
      });
    }

    // ── Issue Daily token ──────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, firstName: true, lastName: true, email: true, avatarUrl: true },
    });

    const userName =
      user?.name ||
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      user?.email ||
      'Guest';

    const dailyRoomName = room.dailyRoomName || resolvedRoomId;

    const token = await createDailyToken({
      roomId: dailyRoomName,
      userId: session.user.id,
      userName,
      isOwner: isHost,
      avatarUrl: user?.avatarUrl || null,
    });

    // Include scheduled end time so client can set auto-end timer
    const scheduledEndAt = room.scheduledAt
      ? new Date(
          new Date(room.scheduledAt).getTime() + (room.durationMinutes || 60) * 60 * 1000
        ).toISOString()
      : null;

    return res.status(200).json({
      token,
      roomUrl: dailyRoomUrl(dailyRoomName),
      dailyRoomName,
      userName,
      isOwner: isHost,
      scheduledEndAt,
    });
  } catch (err) {
    console.error('[foundry/token]', {
      roomId: resolvedRoomId,
      message: String(err?.message || err),
    });
    return res.status(500).json({
      error: 'Could not generate meeting token',
      detail: process.env.NODE_ENV !== 'production' ? String(err?.message || err) : undefined,
    });
  }
}