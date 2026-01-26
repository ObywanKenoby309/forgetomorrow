// pages/api/jobs/[id].js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const id = Number(req.query.id);
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    return res.status(200).json(job);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
