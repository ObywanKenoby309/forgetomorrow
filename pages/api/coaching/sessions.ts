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
  const clientId: string | null = row.clientId ?? null;
  const clientType: 'internal' | 'external' = clientId ? 'internal' : 'external';

  return {
    id: row.id as string,
    date,
    time,
    client: clientDisplay ?? '',
    type: row.type as string,
    status: row.status as string,
    clientId,
    clientType,
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
          notes: true,
        },
      });

      // Collect internal client IDs from this coach's sessions
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

      type ClientDisplay = {
        name: string | null;
        firstName: string | null;
        lastName: string | null;
        email: string;
      };

      const clientMap = new Map<string, ClientDisplay>();
      for (const c of clients) {
        clientMap.set(c.id, c);
      }

      const sessions = rows.map((row) => {
        let display: string | null = null;

        // Internal client: derive from User
        if (row.clientId) {
          const c = clientMap.get(row.clientId);
          if (c) {
            display =
              c.name ||
              `${c.firstName || ''} ${c.lastName || ''}`.trim() ||
              c.email;
          }
        }

        // External: parse from notes if we stored it
        if (!display && row.notes && row.notes.startsWith('Client (free text):')) {
          display = row.notes.replace(/^Client \(free text\):\s*/, '');
        }

        return toSessionPayload(row, display);
      });

      return res.status(200).json({ sessions });
    }

    // ───────────── POST: create session ─────────────
    if (req.method === 'POST') {
      const {
        date,
        time,
        clientType,
        clientUserId,
        clientName,
        type,
        status,
      } = (req.body || {}) as {
        date?: string;
        time?: string;
        clientType?: 'internal' | 'external';
        clientUserId?: string | null;
        clientName?: string;
        type?: string;
        status?: string;
      };

      if (!date || !time) {
        return res.status(400).json({ error: 'Missing date or time' });
      }

      const startAt = toStartAt(String(date), String(time));

      let clientId: string | null = null;
      let notes: string | undefined;

      if (clientType === 'internal') {
        if (!clientUserId) {
          return res.status(400).json({ error: 'Missing clientUserId for internal client' });
        }
        clientId = String(clientUserId);
        // Optional: store a hint in notes if you want
        notes = clientName ? `Client (internal display): ${String(clientName)}` : undefined;
      } else {
        // Default to external if not specified
        const name = (clientName || '').trim();
        if (!name) {
          return res.status(400).json({ error: 'Missing client name for external client' });
        }
        clientId = null;
        notes = `Client (free text): ${name}`;
      }

      const created = await prisma.coachingSession.create({
        data: {
          coachId,
          clientId,
          startAt,
          durationMin: 60,
          type: type || 'Strategy',
          status: status || 'Scheduled',
          notes,
        },
      });

      const displayName = (clientName || '').trim();
      return res
        .status(201)
        .json({ session: toSessionPayload(created, displayName || undefined) });
    }

    // ───────────── PUT: update session ─────────────
    if (req.method === 'PUT') {
      const {
        id,
        date,
        time,
        clientType,
        clientUserId,
        clientName,
        type,
        status,
      } = (req.body || {}) as {
        id?: string;
        date?: string;
        time?: string;
        clientType?: 'internal' | 'external';
        clientUserId?: string | null;
        clientName?: string;
        type?: string;
        status?: string;
      };

      if (!id) {
        return res.status(400).json({ error: 'Missing id for update' });
      }

      const data: any = {};

      if (date && time) {
        data.startAt = toStartAt(String(date), String(time));
      }

      // Handle client identity changes
      if (clientType === 'internal') {
        if (!clientUserId) {
          return res
            .status(400)
            .json({ error: 'Missing clientUserId for internal client' });
        }
        data.clientId = String(clientUserId);
        data.notes = clientName
          ? `Client (internal display): ${String(clientName)}`
          : undefined;
      } else if (clientType === 'external') {
        const name = (clientName || '').trim();
        if (!name) {
          return res
            .status(400)
            .json({ error: 'Missing client name for external client' });
        }
        data.clientId = null;
        data.notes = `Client (free text): ${name}`;
      }

      if (typeof type === 'string') data.type = type;
      if (typeof status === 'string') data.status = status;

      const updated = await prisma.coachingSession.update({
        where: { id: String(id) },
        data,
      });

      const displayName = (clientName || '').trim();
      return res
        .status(200)
        .json({ session: toSessionPayload(updated, displayName || undefined) });
    }

    // ───────────── DELETE: delete session ─────────────
    if (req.method === 'DELETE') {
      const { id } = (req.body || {}) as { id?: string };

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
