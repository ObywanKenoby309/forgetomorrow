// pages/api/contacts/categories.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// These are seeded into the DB on every categories fetch so the UI always
// receives real cuids — no more 'sys-candidates' fake IDs.
const SYSTEM_CATEGORY_NAMES = ['Personal', 'Candidates', 'Clients'];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const userId = session.user.id;

  try {
    await Promise.all(
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

    const categories = await prisma.contactCategory.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ ok: true, categories });
  } catch (err) {
    console.error('contacts/categories error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}