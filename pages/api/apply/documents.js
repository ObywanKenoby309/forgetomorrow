// pages/api/apply/documents.js
import prisma from '@/lib/prisma';
import { getClientSession } from '@/lib/auth-client';

export default async function handler(req, res) {
  try {
    const session = await getClientSession(req);
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [resumes, covers] = await Promise.all([
      prisma.resume.findMany({
        where: { userId },
        orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
        select: { id: true, name: true, isPrimary: true },
      }),
      prisma.cover.findMany({
        where: { userId },
        orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
        select: { id: true, name: true, isPrimary: true },
      }),
    ]);

    return res.status(200).json({ resumes, covers });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
