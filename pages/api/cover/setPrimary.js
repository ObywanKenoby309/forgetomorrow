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
    const { coverId } = req.body || {};
    const id = Number(coverId);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: 'Missing or invalid coverId' });
    }

    // Ensure target exists + belongs to user
    const existing = await prisma.cover.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Cover not found for this user' });
    }

    await prisma.cover.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });

    await prisma.cover.update({
      where: { id },
      data: { isPrimary: true },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[api/cover/setPrimary] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
