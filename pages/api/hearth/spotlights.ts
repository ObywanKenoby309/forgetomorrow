// pages/api/hearth/spotlights.ts
//
// GET  — all spotlights, with avg CSAT scores joined per coach
//         supports sort: Newest | Name A–Z | Highest rated | Most sessions
//         supports csatMin filter: 0 | 4.0 | 4.5
// POST — create a new spotlight (authenticated coach only)

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

function avgOrNull(arr: number[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });

  const userId =
    (session.user as any)?.id || (session.user as any)?.userId || null;
  if (!userId) return res.status(401).json({ error: 'Unauthorized (missing user id)' });

  try {
    // ── GET ─────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const sortParam  = asString(req.query.sort  || 'Newest');
      const csatMinRaw = parseFloat(asString(req.query.csatMin || '0'));
      const csatMin    = isNaN(csatMinRaw) ? 0 : csatMinRaw;

      // Fetch all spotlights with user info
      const items = await prisma.hearthSpotlight.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              slug: true,
              name: true,
              image: true,
              avatarUrl: true,
              headline: true,
            },
          },
        },
      });

      // Fetch CSAT aggregates for all relevant coaches in one query
      const coachIds = items.map((i) => i.userId);
      const csatRows = coachIds.length
        ? await prisma.coachingCsatResponse.findMany({
            where: { coachId: { in: coachIds } },
            select: {
              coachId:      true,
              satisfaction: true,
              timeliness:   true,
              quality:      true,
            },
          })
        : [];

      // Build per-coach CSAT map
      type CsatMap = Record<string, {
        satisfaction: number[];
        timeliness:   number[];
        quality:      number[];
        count:        number;
      }>;

      const csatMap: CsatMap = {};
      for (const r of csatRows) {
        if (!csatMap[r.coachId]) {
          csatMap[r.coachId] = { satisfaction: [], timeliness: [], quality: [], count: 0 };
        }
        csatMap[r.coachId].satisfaction.push(r.satisfaction);
        csatMap[r.coachId].timeliness.push(r.timeliness);
        csatMap[r.coachId].quality.push(r.quality);
        csatMap[r.coachId].count++;
      }

      // Normalize and attach CSAT
      let spotlights = items.map((a) => {
        const c = csatMap[a.userId];
        const satisfaction = c ? avgOrNull(c.satisfaction) : null;
        const timeliness   = c ? avgOrNull(c.timeliness)   : null;
        const quality      = c ? avgOrNull(c.quality)      : null;
        const overall      = (satisfaction !== null && timeliness !== null && quality !== null)
          ? (satisfaction + timeliness + quality) / 3
          : null;

        return {
          id:           a.id,
          userId:       a.userId,
          name:         a.name         || '',
          headline:     a.headline     || '',
          summary:      a.summary      || '',
          hook:         a.hook         || '',
          whyICoach:    a.whyICoach    || '',
          specialties:  Array.isArray(a.specialties) ? a.specialties : [],
          rate:         a.rate         || '',
          availability: a.availability || '',
          contactEmail: a.contactEmail || '',
          createdAt:    a.createdAt,
          csat: {
            satisfaction: satisfaction !== null ? +satisfaction.toFixed(1) : null,
            timeliness:   timeliness   !== null ? +timeliness.toFixed(1)   : null,
            quality:      quality      !== null ? +quality.toFixed(1)      : null,
            overall:      overall      !== null ? +overall.toFixed(1)      : null,
            sessions:     c?.count ?? 0,
          },
          user: a.user,
        };
      });

      // Apply csatMin filter
      if (csatMin > 0) {
        spotlights = spotlights.filter(
          (s) => s.csat.overall !== null && s.csat.overall >= csatMin
        );
      }

      // Apply sort
      if (sortParam === 'Name A–Z') {
        spotlights.sort((x, y) => x.name.localeCompare(y.name));
      } else if (sortParam === 'Highest rated') {
        spotlights.sort((x, y) => {
          const a = x.csat.overall ?? -1;
          const b = y.csat.overall ?? -1;
          return b - a;
        });
      } else if (sortParam === 'Most sessions') {
        spotlights.sort((x, y) => y.csat.sessions - x.csat.sessions);
      } else {
        // Newest (default)
        spotlights.sort((x, y) =>
          new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
        );
      }

      return res.status(200).json({ spotlights });
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = req.body || {};

      const name         = asString(body.name).trim();
      const headline     = asString(body.headline).trim();
      const summary      = asString(body.summary).trim();
      const hook         = asString(body.hook).trim()       || null;
      const whyICoach    = asString(body.whyICoach).trim()  || null;
      const rate         = asString(body.rate         || 'Free').trim()             || 'Free';
      const availability = asString(body.availability || 'Open to discuss').trim() || 'Open to discuss';
      const specialties  = asStringArray(body.specialties);

      if (!name || !headline || !summary) {
        return res.status(400).json({ error: 'Name, headline, and summary are required.' });
      }

      const created = await prisma.hearthSpotlight.create({
        data: {
          userId,
          name,
          headline,
          summary,
          hook,
          whyICoach,
          specialties,
          rate,
          availability,
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