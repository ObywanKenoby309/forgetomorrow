// pages/api/contacts/summary.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// Personal is always private to the individual.
// Recruiter org categories (Candidates, Talent Pools, Jobs) are shared by accountKey.
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

    const personalKey = userId;                          // always private to this user
    const orgKey = user.accountKey || userId;            // shared within recruiter org
    const role = String(user.role || 'SEEKER').toUpperCase();
    const isRecruiter = role === 'RECRUITER';
    const isCoach = role === 'COACH';

    // ── 1) Seed categories ────────────────────────────────────────────────────
    // Personal always seeds under userId (never shared with org)
    await ensureRootCategory({ scopeKey: personalKey, userId, name: 'Personal' });

    // Recruiter org categories seed under accountKey (shared with the team)
    if (isRecruiter && user.accountKey) {
      for (const name of RECRUITER_ORG_ROOTS) {
        await ensureRootCategory({ scopeKey: orgKey, userId, name });
      }
    }

    // Coach categories are personal
    if (isCoach) {
      for (const name of COACH_PERSONAL_ROOTS) {
        await ensureRootCategory({ scopeKey: personalKey, userId, name });
      }
    }

    // ── 2) Contacts — always personal, never org-shared ───────────────────────
    // A recruiter's personal contacts are theirs alone.
    // Candidate pipeline data lives in the recruiter candidate/pipeline APIs.
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
    const contactIdSet = new Set();

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
      contactIdSet.add(String(c.id));
    }

    // ── 3) Categories ─────────────────────────────────────────────────────────
    // Recruiters see: org-shared categories (Candidates, Talent Pools, Jobs)
    //                 + their own Personal category
    // Everyone else: only their personal categories
    let categories = [];

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

    // ── 4) Assignments — only for contacts this user personally owns ──────────
    const categoryIds = categories.map(c => c.id);
    const assignments = categoryIds.length === 0 || contactIdSet.size === 0
      ? []
      : await prisma.contactCategoryAssignment.findMany({
          where: {
            categoryId: { in: categoryIds },
            contactId: { in: Array.from(contactIdSet) },
          },
          select: { id: true, contactId: true, categoryId: true, accountKey: true, userId: true },
        });

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