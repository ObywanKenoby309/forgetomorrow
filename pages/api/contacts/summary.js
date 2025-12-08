// pages/api/contacts/summary.js
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

    // 1) Contacts (everyone you're connected to)
    const contactsRows = await prisma.contact.findMany({
      where: { userId },
    });

    const contactUserIds = contactsRows.map((c) => c.contactUserId);

    const contactUsers =
      contactUserIds.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: contactUserIds } },
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              headline: true,
              location: true,
              status: true,
              avatarUrl: true,
            },
          });

    const contacts = contactUsers.map((u) => ({
      id: u.id,
      name:
        u.name ||
        [u.firstName, u.lastName].filter(Boolean).join(' ') ||
        'Member',
      headline: u.headline || '',
      location: u.location || '',
      status: u.status || '',
      avatarUrl: u.avatarUrl || null,
    }));

    // 2) Incoming requests (to you, pending)
    const incomingRequests = await prisma.contactRequest.findMany({
      where: { toUserId: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    const incomingFromIds = incomingRequests.map((r) => r.fromUserId);

    const incomingUsers =
      incomingFromIds.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: incomingFromIds } },
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              headline: true,
              location: true,
              status: true,
              avatarUrl: true,
            },
          });

    const incoming = incomingRequests.map((r) => {
      const u = incomingUsers.find((u) => u.id === r.fromUserId);
      const name =
        u?.name ||
        [u?.firstName, u?.lastName].filter(Boolean).join(' ') ||
        'Member';
      return {
        requestId: r.id,
        createdAt: r.createdAt,
        from: u
          ? {
              id: u.id,
              name,
              headline: u.headline || '',
              location: u.location || '',
              status: u.status || '',
              avatarUrl: u.avatarUrl || null,
            }
          : {
              id: r.fromUserId,
              name: 'Member',
              headline: '',
              location: '',
              status: '',
              avatarUrl: null,
            },
      };
    });

    // 3) Outgoing requests (from you, pending)
    const outgoingRequests = await prisma.contactRequest.findMany({
      where: { fromUserId: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    const outgoingToIds = outgoingRequests.map((r) => r.toUserId);

    const outgoingUsers =
      outgoingToIds.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: outgoingToIds } },
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              headline: true,
              location: true,
              status: true,
              avatarUrl: true,
            },
          });

    const outgoing = outgoingRequests.map((r) => {
      const u = outgoingUsers.find((u) => u.id === r.toUserId);
      const name =
        u?.name ||
        [u?.firstName, u?.lastName].filter(Boolean).join(' ') ||
        'Member';
      return {
        requestId: r.id,
        createdAt: r.createdAt,
        to: u
          ? {
              id: u.id,
              name,
              headline: u.headline || '',
              location: u.location || '',
              status: u.status || '',
              avatarUrl: u.avatarUrl || null,
            }
          : {
              id: r.toUserId,
              name: 'Member',
              headline: '',
              location: '',
              status: '',
              avatarUrl: null,
            },
      };
    });

    return res.status(200).json({
      ok: true,
      contacts,
      incoming,
      outgoing,
    });
  } catch (err) {
    console.error('contacts/summary error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
