// pages/api/dashboard/applications.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;

    const applications = await prisma.application.findMany({
      where: { userId },
      orderBy: { appliedAt: 'desc' },
      take: 10,
      include: {
        job: {
          select: {
            id: true,
            company: true,
            title: true,
            location: true,
            worksite: true,
          },
        },
      },
    });

    const items = applications.map((a) => ({
      id: a.id,
      status: a.status,
      appliedAt: a.appliedAt,
      updatedAt: a.updatedAt,
      job: a.job
        ? {
            id: a.job.id,
            company: a.job.company,
            title: a.job.title,
            location: a.job.location,
            worksite: a.job.worksite,
          }
        : null,
    }));

    return res.status(200).json({ applications: items });
  } catch (err) {
    console.error('[dashboard/applications] error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
