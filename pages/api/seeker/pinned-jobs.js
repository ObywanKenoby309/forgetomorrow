// pages/api/seeker/pinned-jobs.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  let session;
  try {
    session = await getServerSession(req, res, authOptions);
  } catch (err) {
    console.error('[PinnedJobs] session error', err);
    return res.status(500).json({ error: 'Failed to get session' });
  }

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = session.user.id;

  // ----------------- GET: list pinned jobs -----------------
  if (req.method === 'GET') {
    try {
      const { limit } = req.query;
      const take =
        typeof limit === 'string' && !Number.isNaN(parseInt(limit, 10))
          ? Math.min(parseInt(limit, 10), 50)
          : undefined;

      const pinned = await prisma.pinnedJob.findMany({
        where: { userId },
        include: { job: true }, // assumes relation field is `job`
        orderBy: { pinnedAt: 'desc' },
        ...(take ? { take } : {}),
      });

      const jobs = pinned.map((p) => ({
        id: p.jobId,
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

  // ----------------- POST: toggle pin / unpin -----------------
  if (req.method === 'POST') {
    try {
      const { jobId } = req.body || {};

      if (jobId === undefined || jobId === null) {
        return res.status(400).json({ error: 'jobId is required' });
      }

      const numericJobId =
        typeof jobId === 'number' ? jobId : parseInt(jobId, 10);

      if (Number.isNaN(numericJobId)) {
        return res.status(400).json({ error: 'jobId must be a number' });
      }

      const existing = await prisma.pinnedJob.findFirst({
        where: {
          userId,
          jobId: numericJobId,
        },
      });

      if (existing) {
        await prisma.pinnedJob.delete({
          where: { id: existing.id },
        });
        return res.status(200).json({ pinned: false });
      }

      const created = await prisma.pinnedJob.create({
        data: {
          userId,
          jobId: numericJobId,
        },
      });

      return res.status(200).json({ pinned: true, id: created.id });
    } catch (err) {
      console.error('[POST /api/seeker/pinned-jobs] error', err);
      return res.status(500).json({ error: 'Failed to toggle pinned job' });
    }
  }

  // Anything else (PUT, PATCH, etc.)
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
