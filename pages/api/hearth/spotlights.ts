// pages/api/hearth/spotlights.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function asString(v: any) {
  return typeof v === 'string' ? v : '';
}

function asStringArray(v: any) {
  if (Array.isArray(v)) return v.map((x) => String(x || '').trim()).filter(Boolean);
  return [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  // For now: require login for both reading and posting (matches your current Hearth behavior)
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId =
    // next-auth variants (be tolerant)
    (session.user as any)?.id ||
    (session.user as any)?.userId ||
    null;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized (missing user id)' });
  }

  try {
    if (req.method === 'GET') {
      const items = await prisma.hearthSpotlight.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return res.status(200).json({ spotlights: items });
    }

    if (req.method === 'POST') {
      const body = req.body || {};

      const name = asString(body.name).trim();
      const headline = asString(body.headline).trim();
      const summary = asString(body.summary).trim();
      const rate = asString(body.rate || 'Free').trim() || 'Free';
      const availability = asString(body.availability || 'Open to discuss').trim() || 'Open to discuss';
      const contactEmail = asString(body.contactEmail).trim();
      const contactLink = asString(body.contactLink).trim();

      const specialties = asStringArray(body.specialties);

      if (!name || !headline || !summary) {
        return res.status(400).json({ error: 'Name, headline, and summary are required.' });
      }

      if (!contactEmail && !contactLink) {
        return res
          .status(400)
          .json({ error: 'Please provide at least one contact method (email or link).' });
      }

      const created = await prisma.hearthSpotlight.create({
        data: {
          userId,
          name,
          headline,
          summary,
          specialties, // Json in schema
          rate,
          availability,
          contactEmail,
          contactLink,
        },
      });

      return res.status(201).json({ spotlight: created });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (err) {
    console.error('Hearth spotlights error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
