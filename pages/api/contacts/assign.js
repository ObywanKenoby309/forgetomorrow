// pages/api/contacts/assign.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// System categories that must always exist in the DB.
// These are seeded on first assignment so the UI always gets real cuids.
const SYSTEM_CATEGORY_NAMES = ['Personal', 'Candidates', 'Clients'];

function normalizeValue(v) {
  return String(v || '').trim();
}

async function ensureSystemCategories(userId) {
  // Upsert all system categories for this user so they always have real DB ids.
  const results = await Promise.all(
    SYSTEM_CATEGORY_NAMES.map((name) =>
      prisma.contactCategory.upsert({
        where: { userId_name: { userId, name } },
        update: {},
        create: { userId, name },
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
    const categoryName = normalizeValue(req.body?.categoryName);

    if (!contactId) {
      return res.status(400).json({ error: 'contactId is required' });
    }

    // Resolve to the real Contact row id (accepts either Contact.id or contactUserId)
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId,
        OR: [
          { id: contactId },
          { contactUserId: contactId },
        ],
      },
      select: { id: true, contactUserId: true },
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const resolvedContactId = existingContact.id;

    let categoryId = categoryIdRaw ? normalizeValue(categoryIdRaw) : null;
    let resolvedCategory = null;

    if (categoryName && categoryName.toLowerCase() !== 'unassigned') {
      // Always upsert — this handles both system categories and user-created ones
      resolvedCategory = await prisma.contactCategory.upsert({
  where: {
    userId_parentCategoryId_name: {
      userId,
      parentCategoryId: null,
      name: categoryName,
    },
  },
  update: {},
  create: {
    userId,
    parentCategoryId: null,
    name: categoryName,
  },
});
      categoryId = resolvedCategory.id;
    } else if (categoryId) {
      resolvedCategory = await prisma.contactCategory.findFirst({
        where: { id: categoryId, userId },
      });
    }

    if (!categoryId) {
  await prisma.contactCategoryAssignment.deleteMany({
    where: {
      userId,
      contactId: resolvedContactId,
    },
  });

  return res.status(200).json({
    ok: true,
    assignment: null,
    category: null,
  });
}

const assignment = await prisma.contactCategoryAssignment.upsert({
  where: {
    userId_contactId_categoryId: {
      userId,
      contactId: resolvedContactId,
      categoryId,
    },
  },
  update: {},
  create: {
    userId,
    accountKey,
    contactId: resolvedContactId,
    categoryId,
  },
});

    // Return the full assignment AND the resolved category so the UI can
    // update both localAssignments and localCategories atomically from one response.
    return res.status(200).json({
      ok: true,
      assignment: {
        ...assignment,
        contactId: resolvedContactId, // always the Contact row cuid
      },
      category: resolvedCategory || null,
    });
  } catch (err) {
    console.error('contacts/assign error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}