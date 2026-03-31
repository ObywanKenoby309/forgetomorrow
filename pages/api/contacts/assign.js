// pages/api/contacts/assign.js
// Assigns a contact to a category.
// Scope: org-level for recruiters (accountKey), personal for everyone else (userId).
//
// Root / sibling enforcement rules:
//   Personal / Clients roots → one bucket at a time within that root
//   Candidates root → child buckets only (jobs), multi-bucket
//   Talent Pools root → root or child allowed, multi-bucket

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// Roots where a contact can only be in ONE bucket at a time
const SINGLE_BUCKET_ROOTS = ['personal', 'clients'];

// Roots where a contact can be in MULTIPLE buckets simultaneously
const MULTI_BUCKET_ROOTS = ['candidates', 'talent pools'];

function normalizeValue(v) {
  return String(v || '').trim();
}

async function getRootCategory(categoryId, scopeKey) {
  let current = await prisma.contactCategory.findFirst({
    where: {
      id: categoryId,
      accountKey: scopeKey,
    },
    select: { id: true, name: true, parentCategoryId: true },
  });

  while (current?.parentCategoryId) {
    current = await prisma.contactCategory.findFirst({
      where: {
        id: current.parentCategoryId,
        accountKey: scopeKey,
      },
      select: { id: true, name: true, parentCategoryId: true },
    });
  }

  return current || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = session.user.id;

  try {
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, accountKey: true, role: true },
});

if (!user) {
  return res.status(401).json({ error: 'User not found' });
}

const scopeKey = user.accountKey || user.id;
// Any org-backed user should use org-scoped contact assignment here.
const isOrgScoped = !!user.accountKey;

    const contactId = normalizeValue(req.body?.contactId);
    const categoryId = normalizeValue(req.body?.categoryId);

    if (!contactId || !categoryId) {
      return res.status(400).json({ error: 'contactId and categoryId are required' });
    }

    // ── Resolve Contact row ───────────────────────────────────────────────────
    // Recruiters use org/shared contacts by accountKey.
    // Everyone else stays personal by userId.
    let existingContact = null;

if (isOrgScoped) {
  const orgMembers = await prisma.organizationMember.findMany({
    where: { accountKey: scopeKey },
    select: { userId: true },
  });

  const orgUserIds = [
    ...new Set(orgMembers.map((m) => String(m.userId || '')).filter(Boolean)),
  ];

  existingContact = orgUserIds.length
    ? await prisma.contact.findFirst({
        where: {
          userId: { in: orgUserIds },
          OR: [
            { id: contactId },
            { contactUserId: contactId },
          ],
        },
        select: { id: true, contactUserId: true, userId: true },
      })
    : null;
} else {
  existingContact = await prisma.contact.findFirst({
    where: {
      userId,
      OR: [
        { id: contactId },
        { contactUserId: contactId },
      ],
    },
    select: { id: true, contactUserId: true, userId: true },
  });
}

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const resolvedContactId = existingContact.id;

    // ── Validate category belongs to this scope ───────────────────────────────
    const category = await prisma.contactCategory.findFirst({
      where: {
        id: categoryId,
        accountKey: scopeKey,
      },
      select: { id: true, name: true, parentCategoryId: true },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // ── Determine root and enforce correct bucket rules ───────────────────────
    const rootCategory = await getRootCategory(category.id, scopeKey);

    if (!rootCategory?.id) {
      return res.status(404).json({ error: 'Root category not found' });
    }

    const rootName = String(rootCategory.name || '').toLowerCase();
    const isSingleBucket = SINGLE_BUCKET_ROOTS.includes(rootName);
    const isMultiBucket = MULTI_BUCKET_ROOTS.includes(rootName);

    // Defensive guard: if neither, just treat it as single bucket.
    if (isSingleBucket || (!isMultiBucket && !isSingleBucket)) {
      // Remove all other assignments in this same root tree
      const sameRootCategories = await prisma.contactCategory.findMany({
        where: {
          accountKey: scopeKey,
          OR: [
            { id: rootCategory.id },
            { parentCategoryId: rootCategory.id },
          ],
        },
        select: { id: true },
      });

      const sameRootIds = sameRootCategories
        .map((c) => c.id)
        .filter((id) => id !== category.id);

      if (sameRootIds.length) {
        await prisma.contactCategoryAssignment.deleteMany({
          where: {
            accountKey: scopeKey,
            contactId: resolvedContactId,
            categoryId: { in: sameRootIds },
          },
        });
      }
    }

    // ── Upsert the assignment ─────────────────────────────────────────────────
    const assignment = await prisma.contactCategoryAssignment.upsert({
      where: {
        accountKey_contactId_categoryId: {
          accountKey: scopeKey,
          contactId: resolvedContactId,
          categoryId: category.id,
        },
      },
      update: {
        userId,
      },
      create: {
        accountKey: scopeKey,
        userId,
        contactId: resolvedContactId,
        categoryId: category.id,
      },
    });

    return res.status(200).json({
      ok: true,
      assignment,
      category,
      rootCategory,
    });
  } catch (err) {
    console.error('contacts/assign error:', err);
	return res.status(500).json({
	error: 'Internal server error',
	detail: err?.message || null,
	code: err?.code || null,
	meta: err?.meta || null,
   });
  }
}