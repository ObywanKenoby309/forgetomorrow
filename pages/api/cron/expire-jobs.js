// pages/api/cron/expire-jobs.js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  // Simple secret check so only Vercel can trigger it
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const result = await prisma.job.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.log(`Cleaned up ${result.count} jobs older than 14 days`);
  res.json({ deleted: result.count });
}