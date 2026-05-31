// pages/api/anvil/onboarding-growth/list.js
// Lists saved Growth & Pivot / Career Roadmaps for use in Foundry's "Your Forge" panel.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const roadmaps = await prisma.careerRoadmap.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: {
        id: true,
        data: true,
        generatedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      roadmaps: roadmaps.map((roadmap) => {
        const data = roadmap.data || {};
        const candidate = safeText(data?.meta?.candidate, 'Candidate');
        const headline = safeText(data?.meta?.headline, 'Growth & Pivot Roadmap');

        return {
          id: roadmap.id,
          name: `${candidate} · Growth & Pivot Roadmap`,
          title: headline,
          generatedAt: roadmap.generatedAt,
          createdAt: roadmap.createdAt,
          updatedAt: roadmap.updatedAt,
        };
      }),
    });
  } catch (err) {
    console.error('[api/anvil/onboarding-growth/list]', err);
    return res.status(500).json({ error: 'Could not load Growth & Pivot roadmaps' });
  }
}
