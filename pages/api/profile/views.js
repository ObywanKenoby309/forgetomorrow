// pages/api/profile/views.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id || null;

  if (req.method === 'POST') {
    // Log a profile view
    try {
      const { targetUserId, source } = req.body || {};

      // If targetUserId is missing, fail soft instead of throwing a 400
      // This avoids noisy console errors if some caller forgets to pass it.
      if (!targetUserId) {
        return res.status(204).end();
      }

      // Do not log self-views
      if (userId && userId === targetUserId) {
        return res.status(204).end();
      }

      await prisma.profileView.create({
        data: {
          viewerId: userId,
          targetId: targetUserId,
          source: source || 'profile',
        },
      });

      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error('Error logging profile view:', err);
      return res.status(500).json({ error: 'Failed to log profile view' });
    }
  }

  if (req.method === 'GET') {
    // Return recent views for the logged-in user
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
      const limit = parseInt(req.query.limit || '20', 10);

      const views = await prisma.profileView.findMany({
        where: { targetId: userId },
        orderBy: { createdAt: 'desc' },
        take: isNaN(limit) ? 20 : limit,
      });

      const viewerIds = [
        ...new Set(views.map((v) => v.viewerId).filter(Boolean)),
      ];

      let viewersById = {};
      if (viewerIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: viewerIds } },
          select: {
            id: true,
            slug: true,
            name: true,
            headline: true,
            avatarUrl: true,
            image: true,
          },
        });

        viewersById = users.reduce((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {});
      }

      const result = views.map((v) => {
        const viewer =
          v.viewerId && viewersById[v.viewerId]
            ? {
                id: viewersById[v.viewerId].id,
                slug: viewersById[v.viewerId].slug || null,
                name: viewersById[v.viewerId].name,
                headline: viewersById[v.viewerId].headline || null,
                avatarUrl:
                  viewersById[v.viewerId].avatarUrl ||
                  viewersById[v.viewerId].image ||
                  null,
              }
            : null;

        return {
          id: v.id,
          source: v.source,
          createdAt: v.createdAt,
          viewer,
        };
      });

      return res.status(200).json({ views: result });
    } catch (err) {
      console.error('Error fetching profile views:', err);
      return res.status(500).json({ error: 'Failed to load profile views' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}