// pages/api/cover/list.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const covers = await prisma.cover.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
      select: {
        id: true,
        name: true,
        jobId: true,
        isPrimary: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ ok: true, covers });
  } catch (e) {
    console.error('[api/cover/list] error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
