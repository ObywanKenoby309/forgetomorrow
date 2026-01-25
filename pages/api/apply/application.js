// pages/api/apply/application.js
import prisma from '@/lib/prisma';
import { getClientSession } from '@/lib/auth-client';

export default async function handler(req, res) {
  try {
    const session = await getClientSession(req);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'POST') {
      const { jobId, resumeId, coverId } = req.body || {};
      const jobIdNum = Number(jobId);
      if (!jobIdNum) return res.status(400).json({ error: 'Missing jobId' });

      const job = await prisma.job.findUnique({ where: { id: jobIdNum } });
      if (!job) return res.status(404).json({ error: 'Job not found' });

      // enforce one draft per user per job (your @@unique handles it)
      const created = await prisma.application.upsert({
        where: { user_job_unique: { userId, jobId: jobIdNum } },
        update: {
          resumeId: resumeId ? Number(resumeId) : null,
          coverId: coverId ? Number(coverId) : null,
          accountKey: job.accountKey || null,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url || null,
        },
        create: {
          userId,
          jobId: jobIdNum,
          resumeId: resumeId ? Number(resumeId) : null,
          coverId: coverId ? Number(coverId) : null,
          accountKey: job.accountKey || null,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url || null,
          status: 'Applied',
        },
      });

      return res.status(200).json(created);
    }

    if (req.method === 'PATCH') {
      const { id, resumeId, coverId } = req.body || {};
      const appId = Number(id);
      if (!appId) return res.status(400).json({ error: 'Missing application id' });

      const updated = await prisma.application.update({
        where: { id: appId },
        data: {
          resumeId: resumeId ? Number(resumeId) : null,
          coverId: coverId ? Number(coverId) : null,
        },
      });

      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
