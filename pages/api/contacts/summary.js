// pages/api/contacts/summary.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

const SYSTEM_CATEGORY_NAMES = ['Personal', 'Candidates', 'Clients'];

async function ensureRootSystemCategories(userId) {
  for (const name of SYSTEM_CATEGORY_NAMES) {
    const existing = await prisma.contactCategory.findFirst({
      where: {
        userId,
        parentCategoryId: null,
        name,
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.contactCategory.create({
        data: {
          userId,
          parentCategoryId: null,
          name,
        },
      });
    }
  }
}

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

    const contactsRows = await prisma.contact.findMany({
      where: { userId },
      include: {
        contactUser: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const contacts = contactsRows.map((c) => {
      const other = c.contactUser;
      const name =
        other?.name ||
        [other?.firstName, other?.lastName].filter(Boolean).join(' ') ||
        'Member';

      return {
        id: c.id,
        userId: c.contactUserId,
        slug: other?.slug || null,
        name,
        headline: other?.headline || '',
        location: other?.location || '',
        status: other?.status || '',
        avatarUrl: other?.avatarUrl || other?.image || null,
      };
    });

    await ensureRootSystemCategories(userId);

    const [categories, assignments] = await Promise.all([
      prisma.contactCategory.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      }),
      prisma.contactCategoryAssignment.findMany({
        where: { userId },
      }),
    ]);

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