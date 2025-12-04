// pages/api/support/tickets/status.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

const ALLOWED_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'AWAITING_USER',
  'RESOLVED',
  'CLOSED',
];

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
    const { id, status } = req.body || {};

    if (!id || !status) {
      return res.status(400).json({
        error: 'Both "id" and "status" are required.',
      });
    }

    const normalizedStatus = String(status).toUpperCase();

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      return res.status(400).json({
        error: `Invalid status "${status}". Allowed: ${ALLOWED_STATUSES.join(
          ', '
        )}`,
      });
    }

    // Assumes a Prisma model like:
    // model SupportTicket {
    //   id        String   @id @default(cuid())
    //   status    String
    //   updatedAt DateTime @updatedAt
    //   // ...other fields
    // }
    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: normalizedStatus,
      },
    });

    return res.status(200).json({ ticket: updatedTicket });
  } catch (err) {
    console.error('Error updating ticket status:', err);

    // Common Prisma "record not found"
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    return res.status(500).json({
      error: 'Unable to update ticket status. Please try again.',
    });
  }
}
