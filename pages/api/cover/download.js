// pages/api/cover/download.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const id = Number(req.query?.id);
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const cover = await prisma.cover.findFirst({
      where: { id, userId },
      select: { id: true, name: true, content: true, jobId: true, updatedAt: true },
    });

    if (!cover) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ ok: true, cover });
  } catch (e) {
    console.error('[api/cover/download] error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
