// pages/api/drafts/get.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

/**
 * Gets a per-user draft payload by key.
 * Query: ?key=cover:draft  (or any key)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user?.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    const key = typeof req.query.key === 'string' ? req.query.key.trim() : '';

    if (!key) {
      return res.status(400).json({ error: 'Missing "key" query param' });
    }

    const draft = await prisma.userDraft.findUnique({
      where: {
        userId_key: {
          userId: user.id,
          key,
        },
      },
    });

    return res.status(200).json({ draft: draft || null });
  } catch (err) {
    console.error('[api/drafts/get] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
