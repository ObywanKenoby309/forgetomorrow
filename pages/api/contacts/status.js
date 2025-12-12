// pages/api/contacts/status.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const meId = session.user.id;
    const targetUserId = String(req.query.userId || '').trim();

    if (!targetUserId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // If they're checking themselves, just say "none" (no connect / DM needed).
    if (targetUserId === meId) {
      return res.status(200).json({
        status: 'none',
        requestId: null,
      });
    }

    // 1) Are we already contacts?
    const existingContact = await prisma.contact.findFirst({
      where: {
        OR: [
          { userId: meId, contactUserId: targetUserId },
          { userId: targetUserId, contactUserId: meId },
        ],
      },
    });

    if (existingContact) {
      return res.status(200).json({
        status: 'connected',
        requestId: null,
      });
    }

    // 2) Incoming pending request (they invited me)
    const incoming = await prisma.contactRequest.findFirst({
      where: {
        toUserId: meId,
        fromUserId: targetUserId,
        status: 'PENDING',
      },
    });

    if (incoming) {
      return res.status(200).json({
        status: 'incoming',
        requestId: incoming.id,
      });
    }

    // 3) Outgoing pending request (I invited them)
    const outgoing = await prisma.contactRequest.findFirst({
      where: {
        fromUserId: meId,
        toUserId: targetUserId,
        status: 'PENDING',
      },
    });

    if (outgoing) {
      return res.status(200).json({
        status: 'outgoing',
        requestId: outgoing.id,
      });
    }

    // 4) No relationship yet
    return res.status(200).json({
      status: 'none',
      requestId: null,
    });
  } catch (err) {
    console.error('contacts/status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
