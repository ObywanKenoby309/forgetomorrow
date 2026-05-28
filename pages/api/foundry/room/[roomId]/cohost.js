// pages/api/foundry/room/[roomId]/cohost.js
// Host assigns a co-host. Must be COACH or RECRUITER.
// Can also be called to remove co-host (coHostUserId: null).
//
// POST body: { coHostUserId: string | null }

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const COHOST_ELIGIBLE = ['COACH', 'RECRUITER', 'ADMIN', 'OWNER', 'SITE_ADMIN'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const { roomId } = req.query;
  const resolvedRoomId = Array.isArray(roomId) ? roomId[0] : roomId;

  const room = await prisma.foundryRoom.findUnique({
    where: { roomId: resolvedRoomId },
    select: { id: true, hostId: true, status: true },
  });

  if (!room) return res.status(404).json({ error: 'Foundry not found' });
  if (room.status === 'ENDED') return res.status(410).json({ error: 'ROOM_ENDED' });
  if (room.hostId !== session.user.id) {
    return res.status(403).json({ error: 'Only the host can assign a co-host' });
  }

  const { coHostUserId } = req.body || {};

  // Removing co-host
  if (!coHostUserId) {
    await prisma.foundryRoom.update({
      where: { id: room.id },
      data: { coHostUserId: null },
    });
    return res.status(200).json({ coHostUserId: null });
  }

  // Validate the proposed co-host's role
  const candidate = await prisma.user.findUnique({
    where: { id: coHostUserId },
    select: { id: true, name: true, firstName: true, lastName: true, role: true },
  });

  if (!candidate) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!COHOST_ELIGIBLE.includes(String(candidate.role).toUpperCase())) {
    return res.status(403).json({
      error: 'Co-host must be a Coach or Recruiter',
    });
  }

  await prisma.foundryRoom.update({
    where: { id: room.id },
    data: { coHostUserId: candidate.id },
  });

  const coHostName = candidate.name ||
    [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') ||
    'Co-host';

  return res.status(200).json({
    coHostUserId: candidate.id,
    coHostName,
    coHostRole: candidate.role,
  });
}