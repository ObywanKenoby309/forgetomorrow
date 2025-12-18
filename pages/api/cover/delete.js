import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user?.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = user.id;
    const { id } = req.body || {};
    const coverId = Number(id);

    if (!coverId || Number.isNaN(coverId)) {
      return res.status(400).json({ error: 'Invalid cover id' });
    }

    const existing = await prisma.cover.findFirst({
      where: { id: coverId, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Cover not found for this user' });
    }

    const wasPrimary = existing.isPrimary;

    await prisma.cover.delete({
      where: { id: coverId },
    });

    if (wasPrimary) {
      const newest = await prisma.cover.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (newest) {
        await prisma.cover.update({
          where: { id: newest.id },
          data: { isPrimary: true },
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[api/cover/delete] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
