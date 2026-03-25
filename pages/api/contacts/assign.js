// pages/api/contacts/assign.js
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

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = session.user.id;

  try {
    const contactId = normalizeValue(req.body?.contactId);
    const categoryIdRaw = req.body?.categoryId;
    const categoryName = normalizeValue(req.body?.categoryName);

    if (!contactId) {
      return res.status(400).json({ error: 'contactId is required' });
    }

    // Safety: only assign your real contacts
    const existingContact = await prisma.contact.findFirst({
      where: {
        OR: [
          { userId, contactUserId: contactId },
          { userId: contactId, contactUserId: userId },
        ],
      },
      select: { id: true },
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    let categoryId = categoryIdRaw ? normalizeValue(categoryIdRaw) : null;

    if (!categoryId && categoryName && categoryName.toLowerCase() !== 'unassigned') {
      const existingCategory = await prisma.contactCategory.findFirst({
        where: {
          userId,
          name: {
            equals: categoryName,
            mode: 'insensitive',
          },
        },
      });

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const newCategory = await prisma.contactCategory.create({
          data: {
            userId,
            name: categoryName,
          },
        });
        categoryId = newCategory.id;
      }
    }

    const assignment = await prisma.contactCategoryAssignment.upsert({
      where: {
        userId_contactId: {
          userId,
          contactId,
        },
      },
      update: {
        categoryId: categoryId || null,
      },
      create: {
        userId,
        contactId,
        categoryId: categoryId || null,
      },
    });

    return res.status(200).json({ ok: true, assignment });
  } catch (err) {
    console.error('contacts/assign error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}