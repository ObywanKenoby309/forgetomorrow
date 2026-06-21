// pages/api/users/names.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { userIds } = req.body || {};
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'userIds array required' });
  }

  const safeUserIds = [...new Set(userIds.map((id) => String(id)).filter(Boolean))].slice(0, 500);

  try {
    const users = await prisma.user.findMany({
      where: { id: { in: safeUserIds } },
      select: {
        id: true,
        name: true,
        headline: true,
        slug: true,
        avatarUrl: true,
      },
    });

    const byId = new Map(users.map((user) => [String(user.id), user]));

    const orderedUsers = safeUserIds
      .map((id) => byId.get(String(id)))
      .filter(Boolean)
      .map((user) => ({
        id: String(user.id),
        name: user.name || 'Member',
        headline: user.headline || '',
        slug: user.slug || '',
        avatarUrl: user.avatarUrl || '',
      }));

    return res.status(200).json({ users: orderedUsers });
  } catch (err) {
    console.error('[USERS NAMES ERROR]', err);
    return res.status(500).json({ error: 'Failed to fetch user names' });
  }
}
