// pages/api/contacts/assign.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

const SYSTEM_CATEGORY_NAMES = ['Personal', 'Candidates', 'Clients'];

function normalizeValue(v) {
  return String(v || '').trim();
}

async function ensureSystemCategories(userId) {
  const results = await Promise.all(
    SYSTEM_CATEGORY_NAMES.map((name) =>
      prisma.contactCategory.upsert({
        where: {
          userId_parentCategoryId_name: {
            userId,
            parentCategoryId: null,
            name,
          },
        },
        update: {},
        create: {
          userId,
          parentCategoryId: null,
          name,
        },
      })
    )
  );
  return results;
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
  const accountKey = session.user.accountKey || null;

  try {
    const contactId = normalizeValue(req.body?.contactId);
    const categoryIdRaw = req.body?.categoryId;

    if (!contactId || !categoryIdRaw) {
      return res.status(400).json({ error: 'contactId and categoryId are required' });
    }

    await ensureSystemCategories(userId);

    // Resolve contact
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId,
        OR: [{ id: contactId }, { contactUserId: contactId }],
      },
      select: { id: true },
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const resolvedContactId = existingContact.id;

    // 🔥 CRITICAL: category MUST already exist (no more root creation here)
    const category = await prisma.contactCategory.findFirst({
      where: {
        id: normalizeValue(categoryIdRaw),
        userId,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // 🔥 RULE: ONE CHILD BUCKET ONLY PER ROOT
    // remove any existing assignment under same parent tree
    if (category.parentCategoryId) {
      const siblings = await prisma.contactCategory.findMany({
        where: {
          userId,
          parentCategoryId: category.parentCategoryId,
        },
        select: { id: true },
      });

      const siblingIds = siblings.map((s) => s.id);

      await prisma.contactCategoryAssignment.deleteMany({
        where: {
          userId,
          contactId: resolvedContactId,
          categoryId: { in: siblingIds },
        },
      });
    }

    // create assignment
    const assignment = await prisma.contactCategoryAssignment.upsert({
      where: {
        userId_contactId_categoryId: {
          userId,
          contactId: resolvedContactId,
          categoryId: category.id,
        },
      },
      update: {},
      create: {
        userId,
        accountKey,
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