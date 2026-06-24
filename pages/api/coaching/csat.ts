// pages/api/coaching/csat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { COACHING_CSAT_SCORE_KEYS } from '@/lib/coaching/coachingCsat';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

function clampInt(n: any, min: number, max: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  const i = Math.trunc(v);
  if (i < min || i > max) return null;
  return i;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ───────────── GET: coach-only view of their CSAT ─────────────
    if (req.method === 'GET') {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.id) return res.status(401).json({ error: 'Unauthorized' });

      const coachId = session.user.id as string;

      const csat = await prisma.coachingCsatResponse.findMany({
        where: { coachId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id:             true,
          coachId:        true,
          satisfaction:   true,
          timeliness:     true,
          quality:        true,
          communication:  true,
          helpfulness:    true,
          progress:       true,
          recommendation: true,
          comment:        true,
          anonymous:      true,
          createdAt:      true,
        },
      });

      return res.status(200).json({ responses: csat, csat });
    }

    // ───────────── POST: public submission (no auth required) ─────────────
    if (req.method === 'POST') {
      const {
  coachId,
  comment,
  anonymous,
} = (req.body || {}) as Record<string, any>;

      const coachIdStr = String(coachId || '').trim();
      if (!coachIdStr) return res.status(400).json({ error: 'Missing coachId' });

      // Required fields
      const validatedScores = Object.fromEntries(
  COACHING_CSAT_SCORE_KEYS.map((key) => [
    key,
    clampInt(req.body?.[key], 1, 5),
  ])
);

const invalidField = COACHING_CSAT_SCORE_KEYS.find(
  (key) => !validatedScores[key]
);

if (invalidField) {
  return res.status(400).json({
    error: `Missing or invalid score for ${invalidField}`,
  });
}

      // Validate coach exists
      const coach = await prisma.user.findUnique({
        where: { id: coachIdStr },
        select: { id: true },
      });

      if (!coach?.id) {
        return res.status(404).json({ error: 'Coach not found' });
      }

      const created = await prisma.coachingCsatResponse.create({
        data: {
		  coachId: coachIdStr,
		  satisfaction: validatedScores.satisfaction,
		  quality: validatedScores.quality,
		  communication: validatedScores.communication,
		  helpfulness: validatedScores.helpfulness,
		  progress: validatedScores.progress,
		  recommendation: validatedScores.recommendation,  
		  comment: (comment || '').trim() || null,
		  anonymous: typeof anonymous === 'boolean' ? anonymous : true,
        },
        select: {
          id:             true,
          satisfaction:   true,
          quality:        true,
          communication:  true,
          helpfulness:    true,
          progress:       true,
          recommendation: true,
          comment:        true,
          anonymous:      true,
          createdAt:      true,
        },
      });

      return res.status(201).json({ csat: created });
    }

    res.setHeader('Allow', 'GET,POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Coaching CSAT API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}