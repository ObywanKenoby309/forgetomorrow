import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

/**
 * /api/spotlight/me
 *
 * One spotlight per coach.
 * GET    → fetch my spotlight
 * POST   → create (only if none exists)
 * PUT    → update existing
 * DELETE → delete existing
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  // ---- GET ----
  if (req.method === 'GET') {
    const spotlight = await prisma.hearthSpotlight.findUnique({
      where: { userId },
    });

    return res.status(200).json({ spotlight });
  }

  // ---- POST (create) ----
  if (req.method === 'POST') {
    const existing = await prisma.hearthSpotlight.findUnique({
      where: { userId },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: 'Spotlight already exists' });
    }

    const {
      name,
      headline,
      summary,
      specialties,
      rate,
      availability,
    } = req.body || {};

    if (!name || !headline || !summary) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const spotlight = await prisma.hearthSpotlight.create({
      data: {
        userId,
        name,
        headline,
        summary,
        specialties,
        rate,
        availability,
      },
    });

    return res.status(201).json({ spotlight });
  }

  // ---- PUT (update) ----
  if (req.method === 'PUT') {
    const {
      name,
      headline,
      summary,
      specialties,
      rate,
      availability,
    } = req.body || {};

    const spotlight = await prisma.hearthSpotlight.update({
      where: { userId },
      data: {
        name,
        headline,
        summary,
        specialties,
        rate,
        availability,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({ spotlight });
  }

  // ---- DELETE ----
  if (req.method === 'DELETE') {
    await prisma.hearthSpotlight.delete({
      where: { userId },
    });

    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
