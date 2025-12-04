// pages/api/support/tickets.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id || null;
  const userEmail = session?.user?.email || null;

  if (req.method === 'GET') {
    if (!userId && !userEmail) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const tickets = await prisma.supportTicket.findMany({
        where: {
          OR: [
            userId ? { userId } : undefined,
            userEmail ? { userEmail } : undefined,
          ].filter(Boolean),
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return res.status(200).json({ tickets });
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      return res
        .status(500)
        .json({ error: 'Failed to fetch support tickets' });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        subject,
        initialMessage,
        personaId,
        intent,
        source = 'support-chat',
      } = req.body || {};

      if (!subject || !initialMessage) {
        return res.status(400).json({
          error: 'subject and initialMessage are required',
        });
      }

      const ticket = await prisma.supportTicket.create({
        data: {
          subject,
          initialMessage,
          personaId,
          intent,
          source,
          status: 'OPEN',
          userId,
          userEmail,
        },
      });

      return res.status(200).json({ ticket });
    } catch (err) {
      console.error('Error creating support ticket:', err);
      return res
        .status(500)
        .json({ error: 'Failed to create support ticket' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
