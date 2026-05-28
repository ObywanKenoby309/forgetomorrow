// pages/api/foundry/room/[roomId]/destroy-daily.js

import prisma from '@/lib/prisma';
import { deleteDailyRoom } from '@/lib/foundry/daily';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { roomId } = req.query;

    if (!roomId) {
      return res.status(400).json({ error: 'Missing roomId' });
    }

    const room = await prisma.foundryRoom.findUnique({
      where: { roomId: String(roomId) },
      select: {
        id: true,
        hostId: true,
        dailyRoomName: true,
        dailyRoomUrl: true,
      },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Only host can destroy room
    if (room.hostId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const dailyRoomName =
      room.dailyRoomName ||
      room.dailyRoomUrl?.split('/').pop() ||
      room.roomId;

    if (dailyRoomName) {
      try {
        await deleteDailyRoom(dailyRoomName);
      } catch (err) {
        console.error('[foundry] deleteDailyRoom failed:', err);
      }
    }

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.error('[foundry] destroy-daily error:', err);

    return res.status(500).json({
      error: 'Failed to destroy Daily room',
    });
  }
}