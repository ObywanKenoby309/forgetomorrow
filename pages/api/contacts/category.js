// pages/api/contacts/category.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function normalizeName(name) {
  return String(name || '').trim();
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = session.user.id;

  try {
    if (req.method === 'POST') {
      const name = normalizeName(req.body?.name);

      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      if (name.toLowerCase() === 'unassigned') {
        return res.status(400).json({ error: 'Unassigned is reserved' });
      }

      const existing = await prisma.contactCategory.findFirst({
        where: {
          userId,
          name: {
            equals: name,
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        return res.status(200).json({ ok: true, category: existing });
      }

      const category = await prisma.contactCategory.create({
        data: {
          userId,
          name,
        },
      });

      return res.status(200).json({ ok: true, category });
    }

    if (req.method === 'DELETE') {
      const categoryId = String(req.body?.categoryId || '').trim();
      const name = normalizeName(req.body?.name);

      if (!categoryId && !name) {
        return res.status(400).json({ error: 'categoryId or name is required' });
      }

      let category = null;

      if (categoryId) {
        category = await prisma.contactCategory.findFirst({
          where: { id: categoryId, userId },
        });
      } else {
        category = await prisma.contactCategory.findFirst({
          where: {
            userId,
            name: {
              equals: name,
              mode: 'insensitive',
            },
          },
        });
      }

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      await prisma.contactCategory.delete({
        where: { id: category.id },
      });

      return res.status(200).json({
        ok: true,
        deletedCategoryId: category.id,
      });
    }

    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('contacts/category error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}