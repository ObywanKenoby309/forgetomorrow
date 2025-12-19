// pages/api/spotlight/[id].js
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

    const id = String(req.query.id || '').trim();
    if (!id) {
      return res.status(400).json({ error: 'Missing spotlight id' });
    }

    if (req.method === 'PUT') {
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

      if (!payload.name || !payload.headline || !payload.summary) {
        return res.status(400).json({
          error: 'Missing required fields: name, headline, summary',
        });
      }

      const existing = await prisma.hearthSpotlight.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Spotlight not found' });
      }

      const saved = await prisma.hearthSpotlight.update({
        where: { id },
        data: payload,
      });

      return res.status(200).json({ spotlight: saved });
    }

    if (req.method === 'DELETE') {
      const existing = await prisma.hearthSpotlight.findFirst({
        where: { id, userId },
        select: { id: true },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Spotlight not found' });
      }

      await prisma.hearthSpotlight.delete({ where: { id } });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (err) {
    console.error('/api/hearth/spotlight/[id] error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
