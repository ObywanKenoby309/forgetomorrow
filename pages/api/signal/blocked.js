// pages/api/signal/blocked.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  if (req.method === 'GET') {
    const countOnly = req.query.countOnly === 'true';

    if (countOnly) {
      const count = await prisma.userBlock.count({
        where: { blockerId: userId },
      });
      return res.status(200).json({ count });
    }

    const blocked = await prisma.userBlock.findMany({
      where: { blockerId: userId },
      select: {
        blockedId: true,
        reason: true,
        createdAt: true,
        blocked: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const list = blocked.map(b => ({
      id: b.blockedId,
      name: b.blocked.name || 'Member',
      avatarUrl: b.blocked.avatarUrl,
      reason: b.reason || null,
      createdAt: b.createdAt.toISOString(),
    }));

    return res.status(200).json({ blocked: list });
  }

  if (req.method === 'DELETE') {
    const { blockedId } = req.body;
    if (!blockedId) {
      return res.status(400).json({ error: 'blockedId required' });
    }

    try {
      await prisma.userBlock.delete({
        where: {
          blockerId_blockedId: {
            blockerId: userId,
            blockedId: blockedId,
          },
        },
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('unblock error', err);
      return res.status(500).json({ error: 'Failed to unblock' });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}