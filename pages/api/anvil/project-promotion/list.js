// pages/api/anvil/project-promotion/list.js
// Returns all saved Project & Promotion Intelligence results for the current user.
// Consumed by ForgeVault to show in the Forge Documents tab.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const results = await prisma.projectPromotionResult.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error('[api/anvil/project-promotion/list]', err);
    return res.status(500).json({ error: 'Could not load project promotion results' });
  }
}