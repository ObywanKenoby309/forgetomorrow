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

async function ensureRootCategory({ scopeKey, userId, name }) {
  const existing = await prisma.contactCategory.findFirst({
    where: {
      accountKey: scopeKey,
      parentCategoryId: null,
      name,
    },
    select: { id: true },
  });

  if (existing?.id) return existing;

  return prisma.contactCategory.create({
    data: {
      accountKey: scopeKey,
      userId,
      name,
      parentCategoryId: null,
    },
    select: { id: true },
  });
}

function buildDisplayName(user) {
  return (
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    'Member'
  );
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, accountKey: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

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

    for (const name of rootsToSeed) {
      await ensureRootCategory({ scopeKey, userId, name });
    }

    // ── 2) Contacts ───────────────────────────────────────────────────────────
    // Recruiter contact center is org-shared.
    // Everyone else stays personal.
    let contactRows = [];

    if (isRecruiter && user.accountKey) {
  const orgMembers = await prisma.organizationMember.findMany({
    where: { accountKey: user.accountKey },
    select: { userId: true },
  });

  const orgUserIds = [
    ...new Set(orgMembers.map((m) => String(m.userId || '')).filter(Boolean)),
  ];

  contactRows =
    orgUserIds.length === 0
      ? []
      : await prisma.contact.findMany({
          where: {
            userId: { in: orgUserIds },
          },
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
          orderBy: [{ createdAt: 'asc' }],
        });
} else {
      contactRows = await prisma.contact.findMany({
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
        orderBy: [{ createdAt: 'asc' }],
      });
    }

    // Build canonical org-shared contacts for recruiters:
    // one visible contact per contactUserId, while preserving assignment mapping.
    const contacts = [];
    const contactIdToCanonicalId = new Map();

    if (isRecruiter && user.accountKey) {
      const rowsByContactUserId = new Map();

      for (const row of contactRows) {
        const key = String(row.contactUserId || '');
        if (!key) continue;
        if (!rowsByContactUserId.has(key)) rowsByContactUserId.set(key, []);
        rowsByContactUserId.get(key).push(row);
      }

      for (const rows of rowsByContactUserId.values()) {
        // Prefer the new org-shared contact row first.
        // If not present, fall back to current recruiter's legacy row, then first row.
        const preferred =
          rows.find((r) => String(r.userId) === String(userId)) ||
          rows[0];

        const other = preferred.contactUser;
        const canonicalId = preferred.id;

        contacts.push({
          id: canonicalId, // canonical shared contact id for the UI
          userId: preferred.contactUserId,
          slug: other?.slug || null,
          name: buildDisplayName(other),
          headline: other?.headline || '',
          location: other?.location || '',
          status: other?.status || '',
          avatarUrl: other?.avatarUrl || other?.image || null,
        });

        for (const row of rows) {
          contactIdToCanonicalId.set(String(row.id), canonicalId);
        }
      }
    } else {
      for (const c of contactRows) {
        const other = c.contactUser;
        contacts.push({
          id: c.id,
          userId: c.contactUserId,
          slug: other?.slug || null,
          name: buildDisplayName(other),
          headline: other?.headline || '',
          location: other?.location || '',
          status: other?.status || '',
          avatarUrl: other?.avatarUrl || other?.image || null,
        });

        contactIdToCanonicalId.set(String(c.id), c.id);
      }
    }

    // ── 3) Categories — scoped by accountKey (org or personal) ───────────────
    const categories = await prisma.contactCategory.findMany({
      where: { accountKey: scopeKey },
      orderBy: [{ parentCategoryId: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        parentCategoryId: true,
        accountKey: true,
        createdAt: true,
      },
    });

    // ── 4) Assignments — scoped by accountKey ─────────────────────────────────
    let rawAssignments = await prisma.contactCategoryAssignment.findMany({
      where: { accountKey: scopeKey },
      select: {
        id: true,
        contactId: true,
        categoryId: true,
        accountKey: true,
        userId: true,
      },
    });

    // For recruiter shared contact center, remap all duplicate recruiter-specific
    // contact rows to the single canonical shared contact id and dedupe.
    let assignments = rawAssignments;

    if (isRecruiter && user.accountKey) {
      const deduped = new Map();

      for (const row of rawAssignments) {
        const canonicalContactId =
          contactIdToCanonicalId.get(String(row.contactId)) || null;

        if (!canonicalContactId) continue;

        const key = `${canonicalContactId}::${row.categoryId}`;
        if (!deduped.has(key)) {
          deduped.set(key, {
            ...row,
            contactId: canonicalContactId,
          });
        }
      }

      assignments = Array.from(deduped.values());
    }

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

    const incomingUserMap = new Map(incomingUsers.map((u) => [u.id, u]));

    const incoming = incomingRequests.map((r) => {
      const u = incomingUserMap.get(r.fromUserId);
      const name = buildDisplayName(u);

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

    const outgoingUserMap = new Map(outgoingUsers.map((u) => [u.id, u]));

    const outgoing = outgoingRequests.map((r) => {
      const u = outgoingUserMap.get(r.toUserId);
      const name = buildDisplayName(u);

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
      scopeKey,
    });
  } catch (err) {
    console.error('contacts/summary error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}