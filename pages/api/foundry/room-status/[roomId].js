// pages/api/foundry/room-status/[roomId].js
// Public lightweight Foundry room status check.
// Used by internal and external room clients to self-eject when host ends the room.

import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomId } = req.query;
  const resolvedRoomId = Array.isArray(roomId) ? roomId[0] : roomId;

  if (!resolvedRoomId) {
    return res.status(400).json({ error: 'Missing roomId' });
  }

  try {
    const room = await prisma.foundryRoom.findUnique({
      where: { roomId: resolvedRoomId },
      select: {
        status: true,
        endedAt: true,
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    return res.status(200).json({
      status: room.status,
      endedAt: room.endedAt,
    });
  } catch (err) {
    console.error('[foundry/room-status]', err);
    return res.status(500).json({ error: 'Could not check room status' });
  }
}
