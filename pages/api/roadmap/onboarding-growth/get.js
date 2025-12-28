// pages/api/roadmap/onboarding-growth/get.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function safeString(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const roadmapId = safeString(req.query?.roadmapId);
    if (!roadmapId) return res.status(400).json({ error: 'Missing roadmapId' });

    const roadmap = await prisma.careerRoadmap.findFirst({
      where: { id: roadmapId, userId },
      select: { id: true, createdAt: true, data: true },
    });

    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });

    return res.status(200).json({ roadmap });
  } catch (err) {
    console.error('[roadmap/onboarding-growth/get] Unhandled error', err);
    return res.status(500).json({ error: 'Failed to load roadmap' });
  }
}
