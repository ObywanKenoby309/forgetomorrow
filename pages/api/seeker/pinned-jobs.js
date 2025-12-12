// pages/api/seeker/pinned-jobs.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  // --- Ensure user is authenticated for all methods ---
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const userId = session.user.id;

  if (req.method === 'GET') {
    try {
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

  if (req.method === 'POST') {
    // Toggle pin/unpin for a given jobId
    try {
      const { jobId } = req.body || {};

      if (!jobId) {
        return res.status(400).json({ error: 'jobId is required' });
      }

      // Ensure jobId is a string/number that matches your schema
      const normalizedJobId =
        typeof jobId === 'string' ? jobId : String(jobId);

      // Check if already pinned
      const existing = await prisma.pinnedJob.findFirst({
        where: {
          userId,
          jobId: normalizedJobId,
        },
      });

      if (existing) {
        // Unpin
        await prisma.pinnedJob.delete({
          where: { id: existing.id },
        });
        return res.status(200).json({ pinned: false });
      }

      // Pin
      const created = await prisma.pinnedJob.create({
        data: {
          userId,
          jobId: normalizedJobId,
        },
      });

      return res.status(200).json({ pinned: true, id: created.id });
    } catch (err) {
      console.error('[POST /api/seeker/pinned-jobs] error', err);
      return res.status(500).json({ error: 'Failed to toggle pinned job' });
    }
  }

  // Any other method is not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
