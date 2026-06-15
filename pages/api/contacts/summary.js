// pages/api/contacts/summary.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// Recruiter org categories seed under accountKey — shared with the whole team.
// Personal always seeds under userId — private to the individual.
// Coach categories are personal.
const RECRUITER_ORG_ROOTS = ['Candidates', 'Talent Pools'];
const COACH_PERSONAL_ROOTS = ['Clients'];

async function ensureRootCategory({ scopeKey, userId, name }) {
  const existing = await prisma.contactCategory.findFirst({
    where: { accountKey: scopeKey, parentCategoryId: null, name },
    select: { id: true },
  });
  if (existing?.id) return existing;
  return prisma.contactCategory.create({
    data: { accountKey: scopeKey, userId, name, parentCategoryId: null },
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

    const personalKey = userId;                // always private to this individual
    const orgKey = user.accountKey || userId;  // shared within recruiter org
    const role = String(user.role || 'SEEKER').toUpperCase();
    const isRecruiter = role === 'RECRUITER';
    const isCoach = role === 'COACH';

    // ── 1) Seed categories ────────────────────────────────────────────────────
    // Personal always seeds under userId (never visible to org teammates)
    await ensureRootCategory({ scopeKey: personalKey, userId, name: 'Personal' });

    if (isRecruiter && user.accountKey) {
      for (const name of RECRUITER_ORG_ROOTS) {
        await ensureRootCategory({ scopeKey: orgKey, userId, name });
      }
    }

    if (isCoach) {
      for (const name of COACH_PERSONAL_ROOTS) {
        await ensureRootCategory({ scopeKey: personalKey, userId, name });
      }
    }

    // ── 2) Contacts — always personal ────────────────────────────────────────
    // A recruiter's personal network (who they're connected with as a person)
    // is private. Candidate pipeline contacts live in the org category assignments.
    const contactRows = await prisma.contact.findMany({
      where: { userId },
      include: {
        contactUser: {
          select: {
            id: true, slug: true, name: true, firstName: true, lastName: true,
            headline: true, location: true, status: true, avatarUrl: true, image: true,
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    const contacts = [];
    const personalContactIds = new Set();

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
      personalContactIds.add(String(c.id));
    }

    // ── 3) Categories ─────────────────────────────────────────────────────────
    // Recruiters see org categories (Candidates, Jobs, Talent Pools — shared)
    // plus their own Personal category. Everyone else sees only personal.
    let categories = [];
    let orgCategoryIds = new Set();

    if (isRecruiter && user.accountKey) {
      const [orgCats, personalCats] = await Promise.all([
        prisma.contactCategory.findMany({
          where: { accountKey: orgKey },
          orderBy: [{ parentCategoryId: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, parentCategoryId: true, accountKey: true, createdAt: true },
        }),
        prisma.contactCategory.findMany({
          where: { accountKey: personalKey },
          orderBy: [{ parentCategoryId: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, parentCategoryId: true, accountKey: true, createdAt: true },
        }),
      ]);

      // Track which category IDs belong to the org scope
      for (const cat of orgCats) orgCategoryIds.add(cat.id);

      const seen = new Set();
      for (const cat of [...orgCats, ...personalCats]) {
        if (!seen.has(cat.id)) { seen.add(cat.id); categories.push(cat); }
      }
    } else {
      categories = await prisma.contactCategory.findMany({
        where: { accountKey: personalKey },
        orderBy: [{ parentCategoryId: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, parentCategoryId: true, accountKey: true, createdAt: true },
      });
    }

    // ── 4) Assignments — scope-aware ──────────────────────────────────────────
    // Org categories (Candidates, Jobs, Talent Pools): show ALL assignments
    //   so every recruiter sees the same applicants per job.
    // Personal category: only show assignments for this user's own contacts.
    const categoryIds = categories.map(c => c.id);
    let assignments = [];

    if (categoryIds.length > 0) {
      const orgCatIds = categoryIds.filter(id => orgCategoryIds.has(id));
      const personalCatIds = categoryIds.filter(id => !orgCategoryIds.has(id));

      const [orgAssignments, personalAssignments] = await Promise.all([
        // Org categories: all assignments regardless of who added the contact
        orgCatIds.length === 0 ? [] : prisma.contactCategoryAssignment.findMany({
          where: { categoryId: { in: orgCatIds } },
          select: { id: true, contactId: true, categoryId: true, accountKey: true, userId: true },
        }),
        // Personal categories: only assignments for this user's own contacts
        personalCatIds.length === 0 || personalContactIds.size === 0 ? [] :
          prisma.contactCategoryAssignment.findMany({
            where: {
              categoryId: { in: personalCatIds },
              contactId: { in: Array.from(personalContactIds) },
            },
            select: { id: true, contactId: true, categoryId: true, accountKey: true, userId: true },
          }),
      ]);

      assignments = [...orgAssignments, ...personalAssignments];
    }

    // ── 5) Incoming contact requests ──────────────────────────────────────────
    const incomingRequests = await prisma.contactRequest.findMany({
      where: { toUserId: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    const incomingFromIds = incomingRequests.map((r) => r.fromUserId);
    const incomingUsers = incomingFromIds.length === 0 ? [] : await prisma.user.findMany({
      where: { id: { in: incomingFromIds } },
      select: { id: true, slug: true, name: true, firstName: true, lastName: true, headline: true, location: true, status: true, avatarUrl: true, image: true },
    });

    const incomingUserMap = new Map(incomingUsers.map((u) => [u.id, u]));
    const incoming = incomingRequests.map((r) => {
      const u = incomingUserMap.get(r.fromUserId);
      const name = buildDisplayName(u);
      return {
        id: r.id, requestId: r.id, createdAt: r.createdAt,
        from: u
          ? { id: u.id, slug: u.slug || null, name, headline: u.headline || '', location: u.location || '', status: u.status || '', avatarUrl: u.avatarUrl || u.image || null }
          : { id: r.fromUserId, slug: null, name: 'Member', headline: '', location: '', status: '', avatarUrl: null },
      };
    });

    // ── 6) Outgoing contact requests ──────────────────────────────────────────
    const outgoingRequests = await prisma.contactRequest.findMany({
      where: { fromUserId: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    const outgoingToIds = outgoingRequests.map((r) => r.toUserId);
    const outgoingUsers = outgoingToIds.length === 0 ? [] : await prisma.user.findMany({
      where: { id: { in: outgoingToIds } },
      select: { id: true, slug: true, name: true, firstName: true, lastName: true, headline: true, location: true, status: true, avatarUrl: true, image: true },
    });

    const outgoingUserMap = new Map(outgoingUsers.map((u) => [u.id, u]));
    const outgoing = outgoingRequests.map((r) => {
      const u = outgoingUserMap.get(r.toUserId);
      const name = buildDisplayName(u);
      return {
        id: r.id, requestId: r.id, createdAt: r.createdAt,
        to: u
          ? { id: u.id, slug: u.slug || null, name, headline: u.headline || '', location: u.location || '', status: u.status || '', avatarUrl: u.avatarUrl || u.image || null }
          : { id: r.toUserId, slug: null, name: 'Member', headline: '', location: '', status: '', avatarUrl: null },
      };
    });

    return res.status(200).json({
      ok: true,
      contacts,
      categories,
      assignments,
      incoming,
      outgoing,
      scopeKey: orgKey,
    });
  } catch (err) {
    console.error('contacts/summary error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}