// pages/api/coaching/clients/[id].js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query || {};

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid id.' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!me) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure this coaching client belongs to the current coach
    const record = await prisma.coachingClient.findFirst({
      where: {
        id,
        coachId: me.id,
      },
      select: { id: true },
    });

    if (!record) {
      return res.status(404).json({ error: 'Coaching client not found.' });
    }

    await prisma.coachingClient.delete({
      where: { id },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/coaching/clients/[id]] error', err);
    return res.status(500).json({ error: 'Failed to delete coaching client.' });
  }
}
