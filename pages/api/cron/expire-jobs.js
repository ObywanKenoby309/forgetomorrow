// pages/api/cron/expire-jobs.js   ← NUCLEAR BYPASS VERSION
import { prisma } from '@/lib/prisma';

// 1. Force Next.js to completely ignore middleware for this route
export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};

// 2. Add a tiny "ping" query param so we can test without auth header first
export default async function handler(req, res) {
  // Allow a public test ping (optional, remove later if you want)
  if (req.query.ping === 'nova') {
    return res.json({ ping: 'pong', time: new Date().toISOString() });
  }

  // Real cron security
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'nah' });
  }

  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const result = await prisma.job.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.log(`Cron: expired ${result.count} jobs`);
  res.json({ deleted: result.count });
}