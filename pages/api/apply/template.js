// pages/api/apply/template.js
import prisma from '@/lib/prisma';
import { getClientSession } from '@/lib/auth-client';

export default async function handler(req, res) {
  try {
    const session = await getClientSession(req);
    if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

    const jobId = Number(req.query.jobId);
    if (!jobId) return res.status(400).json({ error: 'Missing jobId' });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const accountKey = job.accountKey;
    if (!accountKey) return res.status(400).json({ error: 'Job missing accountKey' });

    const tpl = await prisma.applicationTemplate.findFirst({
      where: { accountKey, isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: {
            questions: { orderBy: { key: 'asc' } },
          },
        },
      },
    });

    // If org has none yet, you can seed later – for now, fail loudly so you notice.
    if (!tpl) return res.status(404).json({ error: 'No active application template for this organization' });

    return res.status(200).json(tpl);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
