import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;

    // ============================================================
    // GET /api/contacts/request?incoming=true
    // ============================================================
    if (req.method === 'GET') {
      const { incoming } = req.query;

      if (incoming === 'true') {
        const requests = await prisma.contactRequest.findMany({
          where: {
            toUserId: userId,
            status: 'PENDING',
          },
          include: {
            fromUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return res.status(200).json({
          requests: requests.map((r) => ({
            id: r.id,
            fromUserId: r.fromUserId,
            fromName:
              [r.fromUser?.firstName, r.fromUser?.lastName]
                .filter(Boolean)
                .join(' ') || 'User',
            fromAvatarUrl: r.fromUser?.avatarUrl || null,
            createdAt: r.createdAt,
          })),
        });
      }

      return res.status(200).json({ requests: [] });
    }

    // ============================================================
    // POST /api/contacts/request
    // ============================================================
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { toUserId } = req.body || {};

    if (!toUserId || typeof toUserId !== 'string') {
      return res.status(400).json({ error: 'Missing toUserId' });
    }

    if (toUserId === userId) {
      return res
        .status(400)
        .json({ error: 'You cannot connect with yourself.' });
    }

    const existingContact = await prisma.contact.findFirst({
      where: {
        OR: [
          { userId, contactUserId: toUserId },
          { userId: toUserId, contactUserId: userId },
        ],
      },
    });

    if (existingContact) {
      return res.status(200).json({
        ok: true,
        alreadyConnected: true,
      });
    }

    const existingRequest = await prisma.contactRequest.findFirst({
      where: {
        OR: [
          { fromUserId: userId, toUserId },
          { fromUserId: toUserId, toUserId: userId },
        ],
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'PENDING') {
        return res.status(200).json({
          ok: true,
          alreadyRequested: true,
          status: existingRequest.status,
          requestId: existingRequest.id,
        });
      }

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
        status: reopened.status,
        requestId: reopened.id,
        reopened: true,
      });
    }

    const request = await prisma.contactRequest.create({
      data: {
        fromUserId: userId,
        toUserId,
      },
    });

    return res.status(200).json({
      ok: true,
      status: request.status,
      requestId: request.id,
      reopened: false,
    });
  } catch (err) {
    console.error('contacts/request error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}