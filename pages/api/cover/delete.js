// pages/api/cover/delete.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing id' });

    // Ensure ownership
    const existing = await prisma.cover.findFirst({
      where: { id: Number(id), userId },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    await prisma.cover.delete({ where: { id: Number(id) } });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[api/cover/delete] error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
