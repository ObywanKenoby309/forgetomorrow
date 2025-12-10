// pages/api/contacts/list.js
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

    const userId = session.user.id;

    // Contacts (accepted connections)
    const contacts = await prisma.contact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        // pull basic info for the other user
        user: false,
        contactUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            headline: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
    });

    const contactItems = contacts.map((c) => ({
      id: c.id,
      userId: c.contactUserId,
      name:
        c.contactUser.name ||
        [c.contactUser.firstName, c.contactUser.lastName]
          .filter(Boolean)
          .join(' ') ||
        'Member',
      headline: c.contactUser.headline || '',
      status: c.contactUser.status || '',
      avatarUrl: c.contactUser.avatarUrl || null,
      createdAt: c.createdAt,
    }));

    // Incoming requests (to me, still pending)
    const incoming = await prisma.contactRequest.findMany({
      where: { toUserId: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            headline: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
    });

    const incomingItems = incoming.map((r) => ({
      id: r.id,
      userId: r.fromUserId,
      name:
        r.fromUser.name ||
        [r.fromUser.firstName, r.fromUser.lastName].filter(Boolean).join(' ') ||
        'Member',
      headline: r.fromUser.headline || '',
      status: r.fromUser.status || '',
      avatarUrl: r.fromUser.avatarUrl || null,
      createdAt: r.createdAt,
    }));

    // Outgoing requests (from me to others, still pending)
    const outgoing = await prisma.contactRequest.findMany({
      where: { fromUserId: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            headline: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
    });

    const outgoingItems = outgoing.map((r) => ({
      id: r.id,
      userId: r.toUserId,
      name:
        r.toUser.name ||
        [r.toUser.firstName, r.toUser.lastName].filter(Boolean).join(' ') ||
        'Member',
      headline: r.toUser.headline || '',
      status: r.toUser.status || '',
      avatarUrl: r.toUser.avatarUrl || null,
      createdAt: r.createdAt,
    }));

    return res.status(200).json({
      contacts: contactItems,
      incomingRequests: incomingItems,
      outgoingRequests: outgoingItems,
    });
  } catch (err) {
    console.error('[contacts/list] error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
