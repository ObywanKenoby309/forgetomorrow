// pages/api/contacts/assign.js
// Assigns a contact to a category.
// Categories can be personal (accountKey = userId) or org-shared (accountKey = orgKey).
// We search both scopes when resolving categories.
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

async function getRootCategory(categoryId, allowedKeys) {
  let current = await prisma.contactCategory.findFirst({
    where: { id: categoryId, accountKey: { in: allowedKeys } },
    select: { id: true, name: true, parentCategoryId: true, accountKey: true },
  });

  while (current?.parentCategoryId) {
    current = await prisma.contactCategory.findFirst({
      where: { id: current.parentCategoryId, accountKey: { in: allowedKeys } },
      select: { id: true, name: true, parentCategoryId: true, accountKey: true },
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

    const personalKey = userId;
    const orgKey = user.accountKey || userId;
    const allowedKeys = [...new Set([personalKey, orgKey])];

    const contactId = normalizeValue(req.body?.contactId);
    const categoryId = normalizeValue(req.body?.categoryId);

    if (!contactId || !categoryId) {
      return res.status(400).json({ error: 'contactId and categoryId are required' });
    }

    // ── Resolve Contact — always personal ────────────────────────────────────
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId,
        OR: [{ id: contactId }, { contactUserId: contactId }],
      },
      select: { id: true, contactUserId: true, userId: true },
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const resolvedContactId = existingContact.id;

    // ── Validate category — search both personal and org scope ────────────────
    const category = await prisma.contactCategory.findFirst({
      where: { id: categoryId, accountKey: { in: allowedKeys } },
      select: { id: true, name: true, parentCategoryId: true, accountKey: true },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const categoryScope = category.accountKey; // use the category's own scope for assignment

    // ── Determine root and enforce bucket rules ───────────────────────────────
    const rootCategory = await getRootCategory(category.id, allowedKeys);

    if (!rootCategory?.id) {
      return res.status(404).json({ error: 'Root category not found' });
    }

    const rootName = String(rootCategory.name || '').toLowerCase();
    const isSingleBucket = SINGLE_BUCKET_ROOTS.includes(rootName);
    const isMultiBucket = MULTI_BUCKET_ROOTS.includes(rootName);

    if (isSingleBucket || (!isMultiBucket && !isSingleBucket)) {
      // Remove all other assignments in this same root tree
      const sameRootCategories = await prisma.contactCategory.findMany({
        where: {
          accountKey: rootCategory.accountKey,
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
          accountKey: categoryScope,
          contactId: resolvedContactId,
          categoryId: category.id,
        },
      },
      update: { userId },
      create: {
        accountKey: categoryScope,
        userId,
        contactId: resolvedContactId,
        categoryId: category.id,
      },
    });

    return res.status(200).json({ ok: true, assignment, category, rootCategory });
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