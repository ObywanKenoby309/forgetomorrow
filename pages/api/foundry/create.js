// pages/api/foundry/create.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { createDailyRoom } from '@/lib/foundry/daily';

const CAN_HOST = ['COACH', 'RECRUITER', 'ADMIN', 'OWNER', 'SITE_ADMIN'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!CAN_HOST.includes(user?.role)) {
    return res.status(403).json({ error: 'Only coaches and recruiters can open a Foundry.' });
  }

  const { title, durationMinutes } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

  try {
    const roomId = nanoid(10);
    const guestToken = nanoid(16); // always generate — any meeting can be shared

    const dailyRoom = await createDailyRoom(roomId);

    const room = await prisma.foundryRoom.create({
      data: {
        roomId,
        title: title.trim(),
        hostId: session.user.id,
        status: 'ACTIVE',
        startedAt: new Date(),
        dailyRoomName: dailyRoom.name,
        dailyRoomUrl: dailyRoom.url,
        guestToken,
        durationMinutes: durationMinutes === 30 ? 30 : 60,
      },
    });

    await prisma.foundryParticipant.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
        role: 'HOST',
        joinedAt: new Date(),
      },
    });

    return res.status(200).json({ roomId, guestToken });
  } catch (err) {
    console.error('[foundry/create]', err);
    return res.status(500).json({ error: 'Could not create Foundry room' });
  }
}