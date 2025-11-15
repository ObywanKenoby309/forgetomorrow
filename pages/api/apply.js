// pages/api/apply.js
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export default async function handler(req, res) {
  const session = await getSession(req);
  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { jobId, resumeId, coverId } = req.body;

  const application = await prisma.application.create({
    data: {
      userId: session.user.id,
      jobId,
      resumeId,
      coverId,
    },
  });

  // Update job applications count
  await prisma.job.update({
    where: { id: jobId },
    data: { applications: { increment: 1 } },
  });

  res.json(application);
}