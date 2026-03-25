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

    // 1) Contacts
    const contactsRows = await prisma.contact.findMany({
      where: {
        OR: [{ userId }, { contactUserId: userId }],
      },
      include: {
        user: true,
        contactUser: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const contactsMap = new Map();

    for (const c of contactsRows) {
      const other = c.userId === userId ? c.contactUser : c.user;
      if (!other?.id) continue;

      if (!contactsMap.has(other.id)) {
        const name =
          other.name ||
          [other.firstName, other.lastName].filter(Boolean).join(' ') ||
          'Member';

        contactsMap.set(other.id, {
          id: other.id,
          slug: other.slug || null,
          name,
          headline: other.headline || '',
          location: other.location || '',
          status: other.status || '',
          avatarUrl: other.avatarUrl || other.image || null,
        });
      }
    }

    const contacts = Array.from(contactsMap.values());

    // 2) Categories + assignments
    const [categories, assignments] = await Promise.all([
  prisma.contactCategory.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  }),
  prisma.contactCategoryAssignment.findMany({
    where: { userId },
  }),
]);

    // 3) Incoming requests
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
              slug: true,
              name: true,
              firstName: true,
              lastName: true,
              headline: true,
              location: true,
              status: true,
              avatarUrl: true,
              image: true,
            },
          });

    const incoming = incomingRequests.map((r) => {
      const u = incomingUsers.find((x) => x.id === r.fromUserId);
      const name =
        u?.name ||
        [u?.firstName, u?.lastName].filter(Boolean).join(' ') ||
        'Member';

      return {
        id: r.id,
        requestId: r.id,
        createdAt: r.createdAt,
        from: u
          ? {
              id: u.id,
              slug: u.slug || null,
              name,
              headline: u.headline || '',
              location: u.location || '',
              status: u.status || '',
              avatarUrl: u.avatarUrl || u.image || null,
            }
          : {
              id: r.fromUserId,
              slug: null,
              name: 'Member',
              headline: '',
              location: '',
              status: '',
              avatarUrl: null,
            },
      };
    });

    // 4) Outgoing requests
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
              slug: true,
              name: true,
              firstName: true,
              lastName: true,
              headline: true,
              location: true,
              status: true,
              avatarUrl: true,
              image: true,
            },
          });

    const outgoing = outgoingRequests.map((r) => {
      const u = outgoingUsers.find((x) => x.id === r.toUserId);
      const name =
        u?.name ||
        [u?.firstName, u?.lastName].filter(Boolean).join(' ') ||
        'Member';

      return {
        id: r.id,
        requestId: r.id,
        createdAt: r.createdAt,
        to: u
          ? {
              id: u.id,
              slug: u.slug || null,
              name,
              headline: u.headline || '',
              location: u.location || '',
              status: u.status || '',
              avatarUrl: u.avatarUrl || u.image || null,
            }
          : {
              id: r.toUserId,
              slug: null,
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
      categories,
      assignments,
      incoming,
      outgoing,
    });
  } catch (err) {
    console.error('contacts/summary error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}