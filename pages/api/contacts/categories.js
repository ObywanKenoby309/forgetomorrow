// pages/api/contacts/categories.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const categories = await prisma.contactCategory.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json({ ok: true, categories });
  } catch (err) {
    console.error('contacts/categories error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}