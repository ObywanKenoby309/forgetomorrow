// pages/api/foundry/guest-token.js
// PUBLIC endpoint — no session required.
// Validates a guest code and returns a Daily meeting token.
// Enforces the same cost-controlled lifecycle as the authenticated token endpoint.

import prisma from '@/lib/prisma';
import { createDailyToken, dailyRoomUrl } from '@/lib/foundry/daily';
import { nanoid } from 'nanoid';

const EARLY_GATE_MINUTES = 15;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { roomId, guestCode, guestName } = req.body;

  if (!roomId || !guestCode || !guestName?.trim()) {
    return res.status(400).json({ error: 'roomId, guestCode, and guestName are required' });
  }

  try {
    const room = await prisma.foundryRoom.findUnique({
      where: { roomId },
      select: {
        id: true,
        roomId: true,
        status: true,
        guestToken: true,
        dailyRoomName: true,
        scheduledAt: true,
        durationMinutes: true,
        hostJoinedAt: true,
      },
    });

    if (!room) return res.status(404).json({ error: 'Foundry not found' });
    if (room.status === 'ENDED') return res.status(410).json({ error: 'ROOM_ENDED' });
    if (room.guestToken !== guestCode) return res.status(403).json({ error: 'Invalid invite code' });

    const now = Date.now();

    // Scheduled room time gating
    if (room.scheduledAt) {
      const scheduledMs = new Date(room.scheduledAt).getTime();
      const earlyGateMs = scheduledMs - EARLY_GATE_MINUTES * 60 * 1000;
      const duration = room.durationMinutes || 60;
      const endMs = scheduledMs + duration * 60 * 1000;

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

    // Block guests until host has joined
    if (!room.hostJoinedAt) {
      return res.status(403).json({
        error: 'WAITING_FOR_HOST',
        scheduledAt: room.scheduledAt?.toISOString() || null,
      });
    }

    // Issue Daily token
    const guestId = `guest_${nanoid(8)}`;
    const dailyRoomName = room.dailyRoomName || room.roomId;

    const token = await createDailyToken({
      roomId: dailyRoomName,
      userId: guestId,
      userName: guestName.trim(),
      isOwner: false,
    });

    const scheduledEndAt = room.scheduledAt
      ? new Date(
          new Date(room.scheduledAt).getTime() + (room.durationMinutes || 60) * 60 * 1000
        ).toISOString()
      : null;

    return res.status(200).json({
      token,
      roomUrl: dailyRoomUrl(dailyRoomName),
      dailyRoomName,
      guestId,
      guestName: guestName.trim(),
      scheduledEndAt,
    });
  } catch (err) {
    console.error('[foundry/guest-token]', err);
    return res.status(500).json({ error: 'Could not generate guest token' });
  }
}