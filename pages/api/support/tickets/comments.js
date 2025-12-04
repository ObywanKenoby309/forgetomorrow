// pages/api/support/tickets/comments.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
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

    if (!ticketId || !body || !body.trim()) {
      return res.status(400).json({
        error: 'Both "ticketId" and non-empty "body" are required',
      });
    }

    // Ensure ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const comment = await prisma.supportTicketComment.create({
      data: {
        ticketId,
        body: body.trim(),
        isInternal: true,
        authorId: session.user?.id || null,
        authorEmail: session.user?.email || null,
      },
    });

    return res.status(200).json({
      comment: {
        id: comment.id,
        body: comment.body,
        isInternal: comment.isInternal,
        authorId: comment.authorId,
        authorEmail: comment.authorEmail,
        createdAt: comment.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error creating support ticket comment:', err);
    return res
      .status(500)
      .json({ error: 'Failed to create internal note' });
  }
}
