// pages/api/support/tickets/comments.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ticketId, body } = req.body || {};

    const trimmedBody = typeof body === 'string' ? body.trim() : '';

    if (!ticketId || !trimmedBody) {
      return res.status(400).json({
        error: 'Both "ticketId" and a non-empty "body" are required.',
      });
    }

    // Optional: ensure ticket exists and belongs to this user/org
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Assumes a Prisma model like:
    // model SupportComment {
    //   id        String   @id @default(cuid())
    //   ticketId  String
    //   userId    String
    //   body      String
    //   createdAt DateTime @default(now())
    //   // ...
    // }
    const comment = await prisma.supportComment.create({
      data: {
        ticketId,
        userId: session.user.id,
        body: trimmedBody,
      },
    });

    // (Optional) bump the ticket's updatedAt for freshness
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    return res.status(200).json({ comment });
  } catch (err) {
    console.error('Error creating ticket comment:', err);
    return res.status(500).json({
      error: 'Unable to add comment. Please try again.',
    });
  }
}
