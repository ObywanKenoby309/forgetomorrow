// pages/api/cron/expire-jobs.js   ← FINAL VERSION (bypasses auth middleware)
import { prisma } from '@/lib/prisma';

// Bypass any auth middleware (next-auth, clerk, etc.)
export const config = {
  api: {
    externalResolver: true,       // important for some middlewares
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  // 1. Security check first
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'nah' });
  }

  // 2. Delete old jobs
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const result = await prisma.job.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.log(`Cron: expired ${result.count} jobs`);
  return res.json({ deleted: result.count });
}