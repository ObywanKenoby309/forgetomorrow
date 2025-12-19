// pages/api/coaching/csat.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
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
          id: true,
          coachId: true,
          satisfaction: true,
          timeliness: true,
          quality: true,
          comment: true,
          anonymous: true,
          createdAt: true,
        },
      });

      return res.status(200).json({ csat });
    }

    // ───────────── POST: public submission (client not required to be logged in) ─────────────
    if (req.method === 'POST') {
      const {
        coachId,
        satisfaction,
        timeliness,
        quality,
        comment,
        anonymous,
      } = (req.body || {}) as {
        coachId?: string;
        satisfaction?: any;
        timeliness?: any;
        quality?: any;
        comment?: string;
        anonymous?: boolean;
      };

      const coachIdStr = String(coachId || '').trim();
      if (!coachIdStr) return res.status(400).json({ error: 'Missing coachId' });

      const s = clampInt(satisfaction, 1, 5);
      const t = clampInt(timeliness, 1, 5);
      const q = clampInt(quality, 1, 5);

      if (!s || !t || !q) {
        return res.status(400).json({ error: 'Scores must be 1–5' });
      }

      // Validate coach exists (avoid writing garbage ids)
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
          satisfaction: s,
          timeliness: t,
          quality: q,
          comment: (comment || '').trim() || null,
          anonymous: typeof anonymous === 'boolean' ? anonymous : true,
        },
        select: {
          id: true,
          coachId: true,
          satisfaction: true,
          timeliness: true,
          quality: true,
          comment: true,
          anonymous: true,
          createdAt: true,
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
