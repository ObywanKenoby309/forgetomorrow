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
function toSessionPayload(
  row: any,
  clientDisplay?: string | null,
  participants?: string | null
) {
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
    notes: row.notes || '',
    participants: participants || '',
  };
}

/**
 * Mirror a coaching session into the client's personal calendar (SeekerCalendarItem).
 * - Only for INTERNAL clients (clientId != null)
 * - source = 'coach'
 * - sourceItemId = session.id
 */
async function syncCoachSessionToSeekerCalendar(opts: {
  sessionId: string;
  coachId: string;
  clientId: string | null;
  startAt: Date;
  type: string;
  status: string;
  previousClientId?: string | null;
}) {
  const {
    sessionId,
    coachId,
    clientId,
    startAt,
    type,
    status,
    previousClientId,
  } = opts;

  // If the internal client changed, remove the old mirror
  if (previousClientId && previousClientId !== clientId) {
    await prisma.seekerCalendarItem.deleteMany({
      where: {
        source: 'coach',
        sourceItemId: sessionId,
        userId: previousClientId,
      },
    });
  }

  // If there's no current internal client, ensure mirrors are gone
  if (!clientId) {
    await prisma.seekerCalendarItem.deleteMany({
      where: {
        source: 'coach',
        sourceItemId: sessionId,
      },
    });
    return;
  }

  // Look up coach for display name
  const coach = await prisma.user.findUnique({
    where: { id: coachId },
    select: { name: true, firstName: true, lastName: true, email: true },
  });

  const coachName =
    coach?.name ||
    `${coach?.firstName || ''} ${coach?.lastName || ''}`.trim() ||
    coach?.email ||
    'Coach';

  const { time } = splitDateTime(startAt);
  const title = `Coaching session with ${coachName}`;

  // Find existing mirror (if any)
  const existing = await prisma.seekerCalendarItem.findFirst({
    where: {
      source: 'coach',
      sourceItemId: sessionId,
      userId: clientId,
    },
  });

  const baseData = {
    userId: clientId,
    date: startAt,
    time,
    title,
    type: type || 'Strategy',
    status: status || 'Scheduled',
    // keep notes simple for now; we can expand later
    notes: existing?.notes || '',
    source: 'coach',
    sourceItemId: sessionId,
  };

  if (existing) {
    await prisma.seekerCalendarItem.update({
      where: { id: existing.id },
      data: baseData,
    });
  } else {
    await prisma.seekerCalendarItem.create({
      data: baseData,
    });
  }
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
            .filter(
              (id): id is string => typeof id === 'string' && id.length > 0
            )
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
        let participants: string | null = null;

        // Internal client: derive from User
        if (row.clientId) {
          const c = clientMap.get(row.clientId);
          if (c) {
            const namePart =
              c.name ||
              `${c.firstName || ''} ${c.lastName || ''}`.trim() ||
              c.email;
            display = namePart;
            participants = c.email ? `${namePart} (${c.email})` : namePart;
          }
        }

        // External: parse from notes if we stored it
        if (!display && row.notes && typeof row.notes === 'string') {
          // notes may look like:
          // "Client (free text): John Doe (john@example.com) | some notes..."
          const firstLine = row.notes.split('|')[0].trim();
          if (firstLine.startsWith('Client (free text):')) {
            const val = firstLine.replace(/^Client \(free text\):\s*/, '');
            display = val || null;
            participants = val || null;
          }
        }

        return toSessionPayload(row, display, participants);
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
        participants,
        notes,
      } = (req.body || {}) as {
        date?: string;
        time?: string;
        clientType?: 'internal' | 'external';
        clientUserId?: string | null;
        clientName?: string;
        type?: string;
        status?: string;
        participants?: string;
        notes?: string;
      };

      if (!date || !time) {
        return res.status(400).json({ error: 'Missing date or time' });
      }

      const startAt = toStartAt(String(date), String(time));

      let clientId: string | null = null;
      let storedNotes: string | undefined;

      if (clientType === 'internal') {
        if (!clientUserId) {
          return res
            .status(400)
            .json({ error: 'Missing clientUserId for internal client' });
        }
        clientId = String(clientUserId);

        const label = clientName
          ? `Client (internal display): ${String(clientName)}`
          : undefined;

        storedNotes = [label, notes].filter(Boolean).join(' | ');
      } else {
        // Default to external if not specified
        const freeText = (participants || clientName || '').trim();
        if (!freeText) {
          return res
            .status(400)
            .json({
              error: 'Missing client/participant info for external client',
            });
        }
        clientId = null;
        const label = `Client (free text): ${freeText}`;
        storedNotes = [label, notes].filter(Boolean).join(' | ');
      }

      const created = await prisma.coachingSession.create({
        data: {
          coachId,
          clientId,
          startAt,
          durationMin: 60,
          type: type || 'Strategy',
          status: status || 'Scheduled',
          notes: storedNotes,
        },
      });

      // Mirror into client's personal calendar if internal
      await syncCoachSessionToSeekerCalendar({
        sessionId: created.id,
        coachId,
        clientId,
        startAt,
        type: created.type,
        status: created.status,
      });

      const displayName = (clientName || '').trim() || null;
      let participantsOut: string | null = null;

      if (clientType === 'internal') {
        participantsOut = displayName;
      } else {
        participantsOut = (participants || clientName || '').trim() || null;
      }

      return res
        .status(201)
        .json({ session: toSessionPayload(created, displayName, participantsOut) });
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
        participants,
        notes,
      } = (req.body || {}) as {
        id?: string;
        date?: string;
        time?: string;
        clientType?: 'internal' | 'external';
        clientUserId?: string | null;
        clientName?: string;
        type?: string;
        status?: string;
        participants?: string;
        notes?: string;
      };

      if (!id) {
        return res.status(400).json({ error: 'Missing id for update' });
      }

      // Fetch existing to know prior client for mirror cleanup
      const existing = await prisma.coachingSession.findUnique({
        where: { id: String(id) },
        select: {
          coachId: true,
          clientId: true,
          startAt: true,
          type: true,
          status: true,
        },
      });

      if (!existing || existing.coachId !== coachId) {
        return res.status(404).json({ error: 'Session not found' });
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
        const label = clientName
          ? `Client (internal display): ${String(clientName)}`
          : undefined;
        data.notes = [label, notes].filter(Boolean).join(' | ');
      } else if (clientType === 'external') {
        const freeText = (participants || clientName || '').trim();
        if (!freeText) {
          return res
            .status(400)
            .json({
              error: 'Missing client/participant info for external client',
            });
        }
        data.clientId = null;
        const label = `Client (free text): ${freeText}`;
        data.notes = [label, notes].filter(Boolean).join(' | ');
      } else if (typeof notes === 'string') {
        // If clientType isn't being changed but we got notes, allow direct notes update.
        data.notes = notes;
      }

      if (typeof type === 'string') data.type = type;
      if (typeof status === 'string') data.status = status;

      const updated = await prisma.coachingSession.update({
        where: { id: String(id) },
        data,
      });

      // Mirror into client's personal calendar (or clean up if no internal client)
      await syncCoachSessionToSeekerCalendar({
        sessionId: updated.id,
        coachId,
        clientId: updated.clientId ?? null,
        startAt: updated.startAt,
        type: updated.type,
        status: updated.status,
        previousClientId: existing.clientId ?? null,
      });

      // Re-derive display & participants the same way as GET
      let displayName: string | null = null;
      let participantsOut: string | null = null;

      if (updated.clientId) {
        displayName = clientName ? clientName.trim() || null : null;
        participantsOut = displayName;
      } else if (updated.notes && typeof updated.notes === 'string') {
        const firstLine = updated.notes.split('|')[0].trim();
        if (firstLine.startsWith('Client (free text):')) {
          const val = firstLine.replace(/^Client \(free text\):\s*/, '');
          displayName = val || null;
          participantsOut = val || null;
        }
      }

      return res
        .status(200)
        .json({ session: toSessionPayload(updated, displayName, participantsOut) });
    }

    // ───────────── DELETE: delete session ─────────────
    if (req.method === 'DELETE') {
      const { id } = (req.body || {}) as { id?: string };

      if (!id) {
        return res.status(400).json({ error: 'Missing id' });
      }

      // Clean up any mirrored seeker calendar entries
      await prisma.seekerCalendarItem.deleteMany({
        where: {
          source: 'coach',
          sourceItemId: String(id),
        },
      });

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
