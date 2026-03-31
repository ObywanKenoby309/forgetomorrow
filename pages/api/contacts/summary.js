// pages/api/contacts/summary.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// System root categories seeded per scope.
// Recruiters get Candidates + Talent Pools.
// Coaches get Clients.
// Everyone gets Personal.
const BASE_SYSTEM_ROOTS = ['Personal'];
const RECRUITER_SYSTEM_ROOTS = ['Candidates', 'Talent Pools'];
const COACH_SYSTEM_ROOTS = ['Clients'];

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

    // Load user to get role and accountKey
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, accountKey: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // scopeKey: org key for recruiters, userId for everyone else
    const scopeKey = user.accountKey || user.id;
    const role = String(user.role || 'SEEKER').toUpperCase();
    const isRecruiter = role === 'RECRUITER';
    const isCoach = role === 'COACH';

    // ── 1) Seed system root categories for this scope ─────────────────────────
    const rootsToSeed = [
      ...BASE_SYSTEM_ROOTS,
      ...(isRecruiter ? RECRUITER_SYSTEM_ROOTS : []),
      ...(isCoach ? COACH_SYSTEM_ROOTS : []),
    ];

    await Promise.all(
      rootsToSeed.map((name) =>
        prisma.contactCategory.upsert({
          where: {
            accountKey_parentCategoryId_name: {
              accountKey: scopeKey,
              parentCategoryId: null,
              name,
            },
          },
          update: {},
          create: {
            accountKey: scopeKey,
            userId,
            name,
            parentCategoryId: null,
          },
        })
      )
    );

    // ── 2) Contacts ───────────────────────────────────────────────────────────
    // Always per-user — a recruiter's contact rows are their own.
    // CRITICAL: return id = Contact row cuid (not User.id).
    const contactRows = await prisma.contact.findMany({
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

    const contacts = contactRows.map((c) => {
      const other = c.contactUser;
      const name =
        other?.name ||
        [other?.firstName, other?.lastName].filter(Boolean).join(' ') ||
        'Member';

      return {
        id: c.id,                // Contact row cuid — matches assignment.contactId
        userId: c.contactUserId, // other person's User.id
        slug: other?.slug || null,
        name,
        headline: other?.headline || '',
        location: other?.location || '',
        status: other?.status || '',
        avatarUrl: other?.avatarUrl || other?.image || null,
      };
    });

    // ── 3) Categories — scoped by accountKey (org or personal) ───────────────
    const categories = await prisma.contactCategory.findMany({
      where: { accountKey: scopeKey },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        parentCategoryId: true,
        accountKey: true,
        createdAt: true,
      },
    });

    // ── 4) Assignments — scoped by accountKey ─────────────────────────────────
    // For recruiters this means all org assignments, not just their own.
    const assignments = await prisma.contactCategoryAssignment.findMany({
      where: { accountKey: scopeKey },
      select: {
        id: true,
        contactId: true,
        categoryId: true,
        accountKey: true,
        userId: true,
      },
    });

    // ── 5) Incoming contact requests ──────────────────────────────────────────
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

    // ── 6) Outgoing contact requests ──────────────────────────────────────────
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
      scopeKey, // useful for client-side debugging
    });
  } catch (err) {
    console.error('contacts/summary error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}