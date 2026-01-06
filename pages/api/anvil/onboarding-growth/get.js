// pages/api/anvil/onboarding-growth/get.js
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

    // Accept both for backward compatibility
    const planId = safeString(req.query?.planId);
    const roadmapId = safeString(req.query?.roadmapId);
    const id = planId || roadmapId;

    if (!id) return res.status(400).json({ error: 'Missing planId (or roadmapId)' });

    const record = await prisma.careerRoadmap.findFirst({
      where: { id, userId },
      select: { id: true, createdAt: true, data: true },
    });

    if (!record) return res.status(404).json({ error: 'Plan not found' });

    // Return both keys so old UI + new UI both work
    return res.status(200).json({
      plan: record,
      roadmap: record,
      planId: record.id,
      roadmapId: record.id,
    });
  } catch (err) {
    console.error('[anvil/onboarding-growth/get] Unhandled error', err);
    return res.status(500).json({ error: 'Failed to load plan' });
  }
}
