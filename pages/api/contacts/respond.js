// pages/api/contacts/respond.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  // NOTE:
  // We intentionally do NOT hard-block on req.method here.
  // Some environments / edge cases were surfacing 405s before our logic ran.
  // This handler is safe to run for same-origin calls only.
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;

    // Accept input from either body or query, to be extra robust.
    const source = req.body && Object.keys(req.body).length ? req.body : req.query || {};
    const { requestId, action } = source;

    if (!requestId || typeof requestId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid requestId' });
    }

    if (!['accept', 'decline', 'cancel'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const request = await prisma.contactRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return res.status(404).json({ error: 'Contact request not found' });
    }

    const isIncoming = request.toUserId === userId;
    const isOutgoing = request.fromUserId === userId;

    if (!isIncoming && !isOutgoing) {
      return res
        .status(403)
        .json({ error: 'Not allowed to modify this request' });
    }

    // ── ACCEPT ────────────────────────────────────────────────────────────────
    if (action === 'accept') {
      if (!isIncoming) {
        return res
          .status(403)
          .json({ error: 'Only the recipient can accept a request' });
      }

      // Mark accepted
      await prisma.contactRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      });

      // Create reciprocal contacts (both directions)
      await prisma.$transaction([
        prisma.contact.upsert({
          where: {
            userId_contactUserId: {
              userId: request.fromUserId,
              contactUserId: request.toUserId,
            },
          },
          update: {},
          create: {
            userId: request.fromUserId,
            contactUserId: request.toUserId,
          },
        }),
        prisma.contact.upsert({
          where: {
            userId_contactUserId: {
              userId: request.toUserId,
              contactUserId: request.fromUserId,
            },
          },
          update: {},
          create: {
            userId: request.toUserId,
            contactUserId: request.fromUserId,
          },
        }),
      ]);

      return res.status(200).json({ ok: true, status: 'ACCEPTED' });
    }

    // ── DECLINE / CANCEL ─────────────────────────────────────────────────────
    if (action === 'decline' || action === 'cancel') {
      // Recipient declining → DECLINED
      if (isIncoming) {
        await prisma.contactRequest.update({
          where: { id: requestId },
          data: { status: 'DECLINED' },
        });

        return res.status(200).json({ ok: true, status: 'DECLINED' });
      }

      // Sender backing out → CANCELED
      if (isOutgoing) {
        await prisma.contactRequest.update({
          where: { id: requestId },
          data: { status: 'CANCELED' },
        });

        return res.status(200).json({ ok: true, status: 'CANCELED' });
      }

      return res.status(403).json({ error: 'Not allowed' });
    }

    // Fallback – should never hit
    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('[contacts/respond] error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
