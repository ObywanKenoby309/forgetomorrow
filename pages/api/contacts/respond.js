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

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const request = await prisma.contactRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const isTarget = request.toUserId === userId;
    const isSender = request.fromUserId === userId;

    if (!isTarget && !isSender) {
      return res
        .status(403)
        .json({ error: 'Not allowed to modify this request' });
    }

    if (request.status !== 'PENDING') {
      return res.status(200).json({ ok: true, status: request.status });
    }

    // DECLINE: either side can do this (target = decline, sender = cancel)
    if (action === 'decline') {
      const updated = await prisma.contactRequest.update({
        where: { id: requestId },
        data: { status: 'DECLINED' },
      });
      return res.status(200).json({ ok: true, status: updated.status });
    }

    // ACCEPT: only target can accept
    if (action === 'accept' && !isTarget) {
      return res.status(403).json({
        error: 'Only the invited user can accept this request',
      });
    }

    // ACCEPT: create mutual contacts + update request
    await prisma.$transaction(async (tx) => {
      await tx.contactRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      });

      const a = request.fromUserId;
      const b = request.toUserId;

      const existingAB = await tx.contact.findFirst({
        where: { userId: a, contactUserId: b },
      });
      if (!existingAB) {
        await tx.contact.create({
          data: { userId: a, contactUserId: b },
        });
      }

      const existingBA = await tx.contact.findFirst({
        where: { userId: b, contactUserId: a },
      });
      if (!existingBA) {
        await tx.contact.create({
          data: { userId: b, contactUserId: a },
        });
      }
    });

    return res.status(200).json({ ok: true, status: 'ACCEPTED' });
  } catch (err) {
    console.error('contacts/respond error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
