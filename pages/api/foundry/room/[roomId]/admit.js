// pages/api/foundry/room/[roomId]/admit.js
// Host/co-host admits one participant or all from the lobby.
//
// POST body:
//   { lobbyId: string }   — admit single participant
//   { admitAll: true }    — admit everyone currently WAITING
//   { lobbyId, decline: true } — decline a participant

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const { roomId } = req.query;
  const resolvedRoomId = Array.isArray(roomId) ? roomId[0] : roomId;

  const room = await prisma.foundryRoom.findUnique({
    where: { roomId: resolvedRoomId },
    select: {
      id: true, hostId: true, coHostUserId: true,
      status: true, roomOpenedAt: true,
    },
  });

  if (!room) return res.status(404).json({ error: 'Foundry not found' });
  if (room.status === 'ENDED') return res.status(410).json({ error: 'ROOM_ENDED' });

  // Only host or co-host can admit
  const isHost = session.user.id === room.hostId;
  const isCoHost = session.user.id === room.coHostUserId;
  if (!isHost && !isCoHost) {
    return res.status(403).json({ error: 'Only the host or co-host can admit participants' });
  }

  const { lobbyId, admitAll, decline } = req.body || {};

  // Mark room as ACTIVE when first admission happens
  const openNow = !room.roomOpenedAt;

  if (admitAll) {
    // Admit everyone currently waiting
    const waiting = await prisma.foundryLobbyParticipant.findMany({
      where: { roomId: room.id, status: 'WAITING' },
      select: { id: true },
    });

    await prisma.foundryLobbyParticipant.updateMany({
      where: { roomId: room.id, status: 'WAITING' },
      data: { status: 'ADMITTED', admittedAt: new Date() },
    });

    if (openNow) {
      await prisma.foundryRoom.update({
        where: { id: room.id },
        data: { status: 'ACTIVE', roomOpenedAt: new Date() },
      });
    }

    return res.status(200).json({
      admitted: waiting.length,
      roomStatus: 'ACTIVE',
    });
  }

  if (!lobbyId) return res.status(400).json({ error: 'lobbyId or admitAll required' });

  if (decline) {
    // Decline single participant
    await prisma.foundryLobbyParticipant.update({
      where: { id: lobbyId },
      data: { status: 'DECLINED' },
    });
    return res.status(200).json({ status: 'DECLINED' });
  }

  // Admit single participant
  await prisma.foundryLobbyParticipant.update({
    where: { id: lobbyId },
    data: { status: 'ADMITTED', admittedAt: new Date() },
  });

  if (openNow) {
    await prisma.foundryRoom.update({
      where: { id: room.id },
      data: { status: 'ACTIVE', roomOpenedAt: new Date() },
    });
  }

  return res.status(200).json({ status: 'ADMITTED', roomStatus: 'ACTIVE' });
}