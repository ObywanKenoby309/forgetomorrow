// pages/api/cover/public-download.js
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const id = Number(req.query?.id);
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const cover = await prisma.cover.findFirst({
      where: { id, isPublic: true },
      select: { id: true, name: true, content: true, jobId: true, updatedAt: true },
    });

    if (!cover) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ ok: true, cover });
  } catch (e) {
    console.error('[api/cover/public-download] error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
