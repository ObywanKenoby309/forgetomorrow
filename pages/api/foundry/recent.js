// pages/api/foundry/recent.js
// GET — returns the host's recent Foundry rooms (active + scheduled + last 5 ended)

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const rooms = await prisma.foundryRoom.findMany({
      where: { hostId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        roomId: true,
        title: true,
        status: true,
        scheduledAt: true,
        startedAt: true,
        endedAt: true,
      },
    });

    return res.status(200).json({ rooms });
  } catch (err) {
    console.error('[foundry/recent]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}