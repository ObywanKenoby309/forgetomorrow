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

  // Role gate — seekers cannot host a Foundry
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!CAN_HOST.includes(user?.role)) {
    return res.status(403).json({ error: 'Only coaches and recruiters can open a Foundry.' });
  }

  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

  try {
    const roomId = nanoid(10);

    // Create the Daily room first
    const dailyRoom = await createDailyRoom(roomId);

    // Then create the Foundry DB record, storing the Daily room name
    const room = await prisma.foundryRoom.create({
      data: {
        roomId,
        title: title.trim(),
        hostId: session.user.id,
        status: 'ACTIVE',
        startedAt: new Date(),
        dailyRoomName: dailyRoom.name,  // store Daily's room name
        dailyRoomUrl: dailyRoom.url,    // store full Daily URL
      },
    });

    // Auto-join host as participant
    await prisma.foundryParticipant.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
        role: 'HOST',
        joinedAt: new Date(),
      },
    });

    return res.status(200).json({ roomId });
  } catch (err) {
    console.error('[foundry/create]', err);
    return res.status(500).json({ error: 'Could not create Foundry room' });
  }
}