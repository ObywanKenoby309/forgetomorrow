// pages/api/foundry/room/[roomId]/end.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).end();

  const { roomId } = req.query;

  try {
    const room = await prisma.foundryRoom.findUnique({ where: { roomId } });
    if (!room) return res.status(404).end();

    // Only host can end
    if (room.hostId !== session.user.id) {
      return res.status(403).json({ error: 'Only the host can end this Foundry.' });
    }

    await prisma.$transaction([
      // Mark room ended
      prisma.foundryRoom.update({
        where: { id: room.id },
        data: { status: 'ENDED', endedAt: new Date() },
      }),
      // Mark all participants as left
      prisma.foundryParticipant.updateMany({
        where: { roomId: room.id, leftAt: null },
        data: { leftAt: new Date() },
      }),
    ]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[foundry/end]', err);
    return res.status(500).end();
  }
}
