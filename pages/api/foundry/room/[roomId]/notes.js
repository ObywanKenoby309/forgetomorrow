// pages/api/foundry/room/[roomId]/notes.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).end();

  const { roomId } = req.query;
  const { notes } = req.body;

  try {
    const room = await prisma.foundryRoom.findUnique({ where: { roomId } });
    if (!room) return res.status(404).end();

    await prisma.foundryNote.upsert({
      where: { roomId_userId: { roomId: room.id, userId: session.user.id } },
      create: { roomId: room.id, userId: session.user.id, content: notes },
      update: { content: notes, updatedAt: new Date() },
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[foundry/notes]', err);
    return res.status(500).end();
  }
}
