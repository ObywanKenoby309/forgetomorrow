// pages/api/contacts/respond.js
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
    const { requestId, action } = req.body || {};

    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    const request = await prisma.contactRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const isSender = request.fromUserId === userId;
    const isRecipient = request.toUserId === userId;

    if (!isSender && !isRecipient) {
      return res.status(403).json({ error: 'Not allowed for this request' });
    }

    // --- Accept: only recipient can accept ---
    if (action === 'accept') {
      if (!isRecipient) {
        return res
          .status(403)
          .json({ error: 'Only the recipient can accept this request' });
      }

      if (request.status === 'ACCEPTED') {
        return res.status(200).json({ ok: true, status: request.status });
      }

      // Create contact if it doesn't exist yet
      const existingContact = await prisma.contact.findFirst({
        where: {
          OR: [
            {
              userId: request.fromUserId,
              contactUserId: request.toUserId,
            },
            {
              userId: request.toUserId,
              contactUserId: request.fromUserId,
            },
          ],
        },
      });

      if (!existingContact) {
        await prisma.contact.create({
          data: {
            userId: request.fromUserId,
            contactUserId: request.toUserId,
          },
        });
      }

      await prisma.contactRequest.update({
        where: { id: request.id },
        data: { status: 'ACCEPTED' },
      });

      return res.status(200).json({ ok: true, status: 'ACCEPTED' });
    }

    // --- Decline / Cancel logic ---
    if (action === 'decline' || action === 'cancel') {
      let newStatus;

      if (isRecipient) {
        newStatus = 'DECLINED';
      } else if (isSender) {
        newStatus = 'CANCELED';
      } else {
        return res.status(403).json({ error: 'Not allowed' });
      }

      await prisma.contactRequest.update({
        where: { id: request.id },
        data: { status: newStatus },
      });

      return res.status(200).json({ ok: true, status: newStatus });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('contacts/respond error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
