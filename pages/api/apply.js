// pages/api/apply.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { jobId, resumeId, coverId } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }

  try {
    // 🔹 NEW: fetch job accountKey for proper scoping
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { accountKey: true },
    });

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        jobId,
        resumeId: resumeId || null,
        coverId: coverId || null,
        // 🔹 NEW: ensure recruiter/org scoping
        accountKey: job?.accountKey || null,
      },
    });

    // Increment job applications count
    await prisma.job.update({
      where: { id: jobId },
      data: { applicationsCount: { increment: 1 } },
    });

    return res.status(200).json(application);
  } catch (error) {
    console.error('[/api/apply] Error:', error);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
}
