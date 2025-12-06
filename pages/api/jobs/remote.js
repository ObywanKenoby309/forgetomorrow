import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const jobs = await prisma.externalJob.findMany({
      where: { isActive: true },
      orderBy: { fetchedAt: 'desc' },
      take: 100,
    });

    return res.status(200).json({ jobs });
  } catch (err) {
    console.error('[REMOTE JOBS API ERROR]', err);
    return res.status(500).json({ error: 'Failed to fetch remote jobs' });
  }
}