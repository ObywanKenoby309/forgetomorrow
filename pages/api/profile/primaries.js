// pages/api/profile/primaries.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;

    // 1) Try explicit primaries
    const [explicitPrimaryResume, explicitPrimaryCover] = await Promise.all([
      prisma.resume.findFirst({
        where: { userId, isPrimary: true },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.cover.findFirst({
        where: { userId, isPrimary: true },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    let primaryResume = explicitPrimaryResume;
    let primaryCover = explicitPrimaryCover;

    // 2) Fallbacks: newest resume / cover if no explicit primary yet
    if (!primaryResume) {
      primaryResume = await prisma.resume.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    if (!primaryCover) {
      primaryCover = await prisma.cover.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return res.status(200).json({
      primaryResume: primaryResume || null,
      primaryCover: primaryCover || null,
    });
  } catch (err) {
    console.error('[api/profile/primaries] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
