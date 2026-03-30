// pages/api/contacts/category.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

const PROTECTED_ROOT_NAMES = ['personal', 'candidates', 'clients', 'talent pools'];

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
      const parentCategoryId = req.body?.parentCategoryId
        ? String(req.body.parentCategoryId).trim()
        : null;

      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      const existing = await prisma.contactCategory.findFirst({
        where: {
          userId,
          parentCategoryId,
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
          parentCategoryId,
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

      const isProtectedRoot =
        !category.parentCategoryId &&
        PROTECTED_ROOT_NAMES.includes(String(category.name || '').toLowerCase());

      if (isProtectedRoot) {
        const sameNamedRoots = await prisma.contactCategory.count({
          where: {
            userId,
            parentCategoryId: null,
            name: {
              equals: category.name,
              mode: 'insensitive',
            },
          },
        });

        if (sameNamedRoots <= 1) {
          return res.status(400).json({ error: `Cannot delete root ${category.name} category` });
        }

        const [childCount, assignmentCount] = await Promise.all([
          prisma.contactCategory.count({
            where: { parentCategoryId: category.id },
          }),
          prisma.contactCategoryAssignment.count({
            where: { categoryId: category.id },
          }),
        ]);

        if (childCount > 0 || assignmentCount > 0) {
          return res.status(400).json({ error: 'Cannot delete a root category that still has children or assignments' });
        }
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