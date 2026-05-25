// pages/api/foundry/room/[roomId]/token.js
// Returns a Daily meeting token for the authenticated user.
// Called client-side when the Foundry room page loads.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { createDailyToken, dailyRoomUrl } from '@/lib/foundry/daily';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const { roomId } = req.query;

  try {
    const room = await prisma.foundryRoom.findUnique({
      where: { roomId },
      select: { id: true, hostId: true, status: true, dailyRoomName: true },
    });

    if (!room) return res.status(404).json({ error: 'Foundry not found' });
    if (room.status === 'ENDED') return res.status(410).json({ error: 'This Foundry has ended' });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { firstName: true, lastName: true },
    });

    const userName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Guest';
    const isOwner = room.hostId === session.user.id;
    const dailyRoomName = room.dailyRoomName || roomId;

    const token = await createDailyToken({
      roomId: dailyRoomName,
      userId: session.user.id,
      userName,
      isOwner,
    });

    return res.status(200).json({
      token,
      roomUrl: dailyRoomUrl(dailyRoomName),
      dailyRoomName,
      userName,
      isOwner,
    });
  } catch (err) {
    console.error('[foundry/token]', err);
    return res.status(500).json({ error: 'Could not generate meeting token' });
  }
}