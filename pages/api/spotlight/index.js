// pages/api/spotlight/index.js
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/pages/api/auth/[...nextauth]';

function normalizeString(v) {
  return String(v || '').trim();
}

function normalizeSpecialties(v) {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v.map((s) => String(s || '').trim()).filter(Boolean);
  }
  // allow comma-separated input if UI sends a string
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const {
      name,
      headline,
      summary,
      specialties,
      rate,
      availability,
      contactEmail,
      contactLink,
    } = req.body || {};

    const payload = {
      name: normalizeString(name),
      headline: normalizeString(headline),
      summary: normalizeString(summary),
      specialties: normalizeSpecialties(specialties),
      rate: normalizeString(rate) || 'Free',
      availability: normalizeString(availability) || 'Open to discuss',
      contactEmail: normalizeString(contactEmail) || null,
      contactLink: normalizeString(contactLink) || null,
    };

    // Required fields (keep tight — prevents empty junk rows)
    if (!payload.name || !payload.headline || !payload.summary) {
      return res.status(400).json({
        error: 'Missing required fields: name, headline, summary',
      });
    }

    // Enforce ONE spotlight per user (API-level)
    const existing = await prisma.hearthSpotlight.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    const saved = existing
      ? await prisma.hearthSpotlight.update({
          where: { id: existing.id },
          data: payload,
        })
      : await prisma.hearthSpotlight.create({
          data: { userId, ...payload },
        });

    return res.status(200).json({ spotlight: saved });
  } catch (err) {
    console.error('POST /api/hearth/spotlight error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
