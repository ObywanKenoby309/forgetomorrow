// pages/api/seeker/pinned-jobs.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user || !session.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;
    const { limit } = req.query;
    const take =
      typeof limit === 'string' && !Number.isNaN(parseInt(limit, 10))
        ? Math.min(parseInt(limit, 10), 50)
        : undefined;

    const pinned = await prisma.pinnedJob.findMany({
      where: { userId },
      include: {
        job: true, // assumes relation field is `job`
      },
      orderBy: {
        pinnedAt: 'desc',
      },
      ...(take ? { take } : {}),
    });

    const jobs = pinned.map((p) => ({
      // ID of the underlying job (used for /jobs/apply/:id)
      id: p.jobId,
      // ID of the pinned record (if you later need it for unpin)
      pinnedId: p.id,
      title: p.job ? p.job.title : '',
      company: p.job ? p.job.company : '',
      location: p.job ? p.job.location : '',
      url: p.job ? p.job.url || null : null,
      pinnedAt: p.pinnedAt,
    }));

    return res.status(200).json({ jobs });
  } catch (err) {
    console.error('[GET /api/seeker/pinned-jobs] error', err);
    return res.status(500).json({ error: 'Failed to load pinned jobs' });
  }
}
