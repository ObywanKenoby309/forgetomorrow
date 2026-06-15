// pages/api/contacts/unassign.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function normalizeValue(v) {
  return String(v || '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
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

    // ── Resolve contact — always personal ────────────────────────────────────
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

    // ── Resolve category — search both personal and org scope ─────────────────
    const category = await prisma.contactCategory.findFirst({
      where: { id: categoryId, accountKey: { in: allowedKeys } },
      select: { id: true, name: true, parentCategoryId: true, accountKey: true },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const deleted = await prisma.contactCategoryAssignment.deleteMany({
      where: {
        contactId: existingContact.id,
        categoryId: category.id,
      },
    });

    return res.status(200).json({
      ok: true,
      deletedCount: deleted.count,
      contactId: existingContact.id,
      categoryId: category.id,
    });
  } catch (err) {
    console.error('contacts/unassign error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      detail: err?.message || null,
      code: err?.code || null,
      meta: err?.meta || null,
    });
  }
}