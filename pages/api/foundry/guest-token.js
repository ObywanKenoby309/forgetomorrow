// pages/api/foundry/guest-token.js
// PUBLIC endpoint — no session required.
// Validates a guest code and returns a Daily meeting token.

import prisma from '@/lib/prisma';
import { createDailyToken, dailyRoomUrl } from '@/lib/foundry/daily';
import { nanoid } from 'nanoid';

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
        id: true, roomId: true, status: true,
        guestToken: true, dailyRoomName: true,
      },
    });

    if (!room) return res.status(404).json({ error: 'Foundry not found' });
    if (room.status === 'ENDED') return res.status(410).json({ error: 'This Foundry has ended' });
    if (room.guestToken !== guestCode) return res.status(403).json({ error: 'Invalid invite code' });

    // Generate a guest-specific user ID (ephemeral, not stored in DB)
    const guestId = `guest_${nanoid(8)}`;
    const dailyRoomName = room.dailyRoomName || room.roomId;

    const token = await createDailyToken({
      roomId: dailyRoomName,
      userId: guestId,
      userName: guestName.trim(),
      isOwner: false,
    });

    return res.status(200).json({
      token,
      roomUrl: dailyRoomUrl(dailyRoomName),
      dailyRoomName,
      guestId,
      guestName: guestName.trim(),
    });
  } catch (err) {
    console.error('[foundry/guest-token]', err);
    return res.status(500).json({ error: 'Could not generate guest token' });
  }
}
