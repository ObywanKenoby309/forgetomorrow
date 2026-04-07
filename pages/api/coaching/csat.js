// pages/api/coaching/csat.js
//
// GET — returns all CoachingCsatResponse records for the authed coach,
//        ordered newest first. Scoped to session.user.id.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const responses = await prisma.coachingCsatResponse.findMany({
      where: { coachId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id:           true,
        satisfaction: true,
        timeliness:   true,
        quality:      true,
        comment:      true,
        anonymous:    true,
        createdAt:    true,
      },
    });

    return res.status(200).json({ responses });
  } catch (err) {
    console.error('[coaching/csat GET]', err);
    return res.status(500).json({ error: 'Failed to load feedback' });
  }
}