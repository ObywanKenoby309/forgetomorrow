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

    // 1) Are they already contacts RIGHT NOW?
    const existingContact = await prisma.contact.findFirst({
      where: {
        OR: [
          { userId, contactUserId: toUserId },
          { userId: toUserId, contactUserId: userId },
        ],
      },
    });

    if (existingContact) {
      // Already connected → nothing new to create
      return res.status(200).json({
        ok: true,
        alreadyConnected: true,
      });
    }

    // 2) Any existing request either direction?
    const existingRequest = await prisma.contactRequest.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId },
          { fromUserId: toUserId, toUserId: userId },
        ],
      },
    });

    if (existingRequest) {
      // If there is a *pending* request already, just surface it.
      if (existingRequest.status === 'PENDING') {
        return res.status(200).json({
          ok: true,
          alreadyRequested: true,
          status: existingRequest.status,
          requestId: existingRequest.id,
        });
      }

      // If it was DECLINED / CANCELED / ACCEPTED in the past:
      // 👉 allow a re-request by "re-opening" as a fresh PENDING from the current user.
      const reopened = await prisma.contactRequest.update({
        where: { id: existingRequest.id },
        data: {
          fromUserId: userId,
          toUserId,
          status: 'PENDING',
          createdAt: new Date(),
        },
      });

      return res.status(200).json({
        ok: true,
        status: reopened.status, // "PENDING"
        requestId: reopened.id,
        reopened: true,
      });
    }

    // 3) No contact + no prior request → create brand new PENDING request
    const request = await prisma.contactRequest.create({
      data: {
        fromUserId: userId,
        toUserId,
      },
    });

    return res.status(200).json({
      ok: true,
      status: request.status, // "PENDING"
      requestId: request.id,
      reopened: false,
    });
  } catch (err) {
    console.error('contacts/request error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
