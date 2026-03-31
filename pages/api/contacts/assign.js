// pages/api/contacts/assign.js
// Assigns a contact to a category.
// Scope: org-level for recruiters (accountKey), personal for everyone else (userId).
//
// Sibling enforcement rules:
//   Personal / Clients roots → one child at a time (replace siblings)
//   Candidates / Talent Pools roots → multiple children allowed (don't replace)

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// Roots where a contact can only be in ONE child at a time
const SINGLE_BUCKET_ROOTS = ['personal', 'clients'];

// Roots where a contact can be in MULTIPLE children simultaneously
const MULTI_BUCKET_ROOTS = ['candidates', 'talent pools'];

function normalizeValue(v) {
  return String(v || '').trim();
}

async function getRootName(categoryId) {
  // Walk up the tree to find the root category name
  let current = await prisma.contactCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, name: true, parentCategoryId: true },
  });

  while (current?.parentCategoryId) {
    current = await prisma.contactCategory.findUnique({
      where: { id: current.parentCategoryId },
      select: { id: true, name: true, parentCategoryId: true },
    });
  }

  return String(current?.name || '').toLowerCase();
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
    // Load user for scopeKey
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, accountKey: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const scopeKey = user.accountKey || user.id;

    const contactId = normalizeValue(req.body?.contactId);
    const categoryId = normalizeValue(req.body?.categoryId);

    if (!contactId || !categoryId) {
      return res.status(400).json({ error: 'contactId and categoryId are required' });
    }

// ── Resolve Contact row ───────────────────────────────────────────────────
// Recruiters use org-shared contacts by accountKey.
// Everyone else stays personal by userId.
const existingContact = user.accountKey
  ? await prisma.contact.findFirst({
      where: {
        accountKey: scopeKey,
        OR: [
          { id: contactId },
          { contactUserId: contactId },
        ],
      },
      select: { id: true },
    })
  : await prisma.contact.findFirst({
      where: {
        userId,
        OR: [
          { id: contactId },
          { contactUserId: contactId },
        ],
      },
      select: { id: true },
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const resolvedContactId = existingContact.id;

    // ── Validate category belongs to this scope ───────────────────────────────
    const category = await prisma.contactCategory.findFirst({
      where: { id: categoryId, accountKey: scopeKey },
      select: { id: true, name: true, parentCategoryId: true },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // ── Determine root type to enforce correct sibling rule ───────────────────
    if (category.parentCategoryId) {
      const rootName = await getRootName(category.id);

      if (SINGLE_BUCKET_ROOTS.includes(rootName)) {
        // Remove all sibling assignments under the same parent
        const siblings = await prisma.contactCategory.findMany({
          where: {
            accountKey: scopeKey,
            parentCategoryId: category.parentCategoryId,
          },
          select: { id: true },
        });

        const siblingIds = siblings
          .map((s) => s.id)
          .filter((id) => id !== category.id);

        if (siblingIds.length) {
          await prisma.contactCategoryAssignment.deleteMany({
            where: {
              accountKey: scopeKey,
              contactId: resolvedContactId,
              categoryId: { in: siblingIds },
            },
          });
        }

        // Also remove any root-level assignment (legacy bad state)
        await prisma.contactCategoryAssignment.deleteMany({
          where: {
            accountKey: scopeKey,
            contactId: resolvedContactId,
            categoryId: category.parentCategoryId,
          },
        });
      }

      // MULTI_BUCKET_ROOTS: no sibling removal — contact stays in all buckets
      // Just add the new assignment below
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
      update: { userId }, // update who last assigned
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
    });
  } catch (err) {
    console.error('contacts/assign error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}