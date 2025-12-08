// pages/api/contacts/request.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;
    const { toUserId } = req.body || {};

    if (!toUserId || typeof toUserId !== 'string') {
      return res.status(400).json({ error: 'Missing toUserId' });
    }

    if (toUserId === userId) {
      return res
        .status(400)
        .json({ error: 'You cannot connect with yourself.' });
    }

    // Already contacts?
    const existingContact = await prisma.contact.findFirst({
      where: {
        OR: [
          { userId, contactUserId: toUserId },
          { userId: toUserId, contactUserId: userId },
        ],
      },
    });

    if (existingContact) {
      return res.status(200).json({ ok: true, alreadyConnected: true });
    }

    // Existing request either way?
    const existingRequest = await prisma.contactRequest.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId },
          { fromUserId: toUserId, toUserId: userId },
        ],
      },
    });

    if (existingRequest) {
      // If it's declined/canceled, we could reopen, but for now just no-op
      return res.status(200).json({
        ok: true,
        alreadyRequested: true,
        status: existingRequest.status,
      });
    }

    const request = await prisma.contactRequest.create({
      data: {
        fromUserId: userId,
        toUserId,
      },
    });

    return res.status(200).json({ ok: true, requestId: request.id });
  } catch (err) {
    console.error('contacts/request error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
