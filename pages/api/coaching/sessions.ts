// pages/api/coaching/sessions.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function toStartAt(date: string, time: string): Date {
  // Simple local → Date helper; backend stores as UTC
  return new Date(`${date}T${time || '00:00'}:00`);
}

function splitDateTime(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return {
    date: `${y}-${m}-${day}`,
    time: `${hh}:${mm}`,
  };
}

// Normalize a CoachingSession row → UI payload
function toSessionPayload(row: any, clientDisplay?: string | null) {
  const { date, time } = splitDateTime(row.startAt);
  return {
    id: row.id,
    date,
    time,
    client: clientDisplay ?? '',
    type: row.type,
    status: row.status,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Auth: require logged-in coach
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const coachId = session.user.id as string;

  try {
    // ───────────── GET: list sessions for this coach ─────────────
    if (req.method === 'GET') {
      const rows = await prisma.coachingSession.findMany({
        where: { coachId },
        orderBy: { startAt: 'asc' },
        select: {
          id: true,
          coachId: true,
          clientId: true,
          startAt: true,
          type: true,
          status: true,
        },
      });

      // Optionally hydrate client display names if clientId exists
const clientIds = Array.from(
  new Set(
    rows
      .map((r) => r.clientId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
  )
);
      const clients =
        clientIds.length > 0
          ? await prisma.user.findMany({
              where: { id: { in: clientIds } },
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            })
          : [];

      const clientMap = new Map<
        string,
        { name: string | null; firstName: string | null; lastName: string | null; email: string }
      >();
      for (const c of clients) {
        clientMap.set(c.id, c);
      }

      const sessions = rows.map((row) => {
        let display: string | null = null;
        if (row.clientId) {
          const c = clientMap.get(row.clientId);
          if (c) {
            display =
              c.name ||
              `${c.firstName || ''} ${c.lastName || ''}`.trim() ||
              c.email;
          }
        }
        return toSessionPayload(row, display);
      });

      return res.status(200).json({ sessions });
    }

    // ───────────── POST: create session ─────────────
    if (req.method === 'POST') {
      const { date, time, client, type, status } = req.body || {};

      if (!date || !time) {
        return res.status(400).json({ error: 'Missing date or time' });
      }

      const startAt = toStartAt(String(date), String(time));

      const created = await prisma.coachingSession.create({
        data: {
          coachId,
          clientId: null, // MVP: free-text clients only
          startAt,
          type: type || 'Strategy',
          status: status || 'Scheduled',
          // We park the client display name in notes for now so it’s not lost.
          notes: client ? `Client (free text): ${String(client)}` : undefined,
        },
      });

      return res
        .status(201)
        .json({ session: toSessionPayload(created, client || '') });
    }

    // ───────────── PUT: update session ─────────────
    if (req.method === 'PUT') {
      const { id, date, time, client, type, status } = req.body || {};

      if (!id || !date || !time) {
        return res
          .status(400)
          .json({ error: 'Missing id, date, or time for update' });
      }

      const startAt = toStartAt(String(date), String(time));

      const updated = await prisma.coachingSession.update({
        where: { id: String(id) },
        data: {
          startAt,
          type: type || 'Strategy',
          status: status || 'Scheduled',
          notes: client ? `Client (free text): ${String(client)}` : undefined,
        },
      });

      return res
        .status(200)
        .json({ session: toSessionPayload(updated, client || '') });
    }

    // ───────────── DELETE: delete session ─────────────
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'Missing id' });
      }

      await prisma.coachingSession.delete({
        where: { id: String(id) },
      });

      return res.status(200).json({ ok: true });
    }

    // ───────────── Method not allowed ─────────────
    res.setHeader('Allow', 'GET,POST,PUT,DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Coaching sessions API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
