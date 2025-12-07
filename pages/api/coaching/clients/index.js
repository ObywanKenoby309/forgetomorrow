// pages/api/coaching/clients/index.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Load coaching clients where this user is the coach
    const records = await prisma.coachingClient.findMany({
      where: { coachId: me.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const clients = records.map((rec) => {
      const client = rec.client || {};
      const fullName =
        client.name ||
        [client.firstName, client.lastName].filter(Boolean).join(' ') ||
        client.email ||
        'Client';

      return {
        id: rec.id,              // coaching relationship id
        clientId: client.id,     // underlying User id (for messaging)
        name: fullName,
        email: client.email || '',
        status: rec.status,
        next:
          rec.nextSession instanceof Date
            ? rec.nextSession.toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : '',
        last:
          rec.lastContact instanceof Date
            ? rec.lastContact.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
              })
            : '',
      };
    });

    return res.status(200).json({ clients });
  } catch (err) {
    console.error('[api/coaching/clients] error', err);
    return res.status(500).json({ error: 'Failed to load coaching clients.' });
  }
}
