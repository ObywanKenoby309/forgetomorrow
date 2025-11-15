// pages/api/seeker/dashboard-data.js
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const userId = session.userId;

  const [
    applications,
    views,
    interviews,
    offers,
    lastApplication,
    allApplications
  ] = await Promise.all([
    prisma.application.count({ where: { userId } }),
    prisma.jobView.count({ where: { userId } }),
    prisma.interview.count({ where: { userId, status: "Scheduled" } }),
    prisma.offer.count({ where: { userId } }),
    prisma.application.findFirst({
      where: { userId },
      orderBy: { appliedAt: 'desc' },
      select: { appliedAt: true }
    }),
    prisma.application.findMany({
      where: { userId },
      select: { appliedAt: true }
    })
  ]);

  res.json({
    applications,
    views,
    interviews,
    offers,
    lastApplication: lastApplication?.appliedAt || null,
    allApplications,
  });
}