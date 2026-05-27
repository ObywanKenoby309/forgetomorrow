// pages/api/coaching/sessions.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const values: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') values[part.type] = part.value;
  });

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return asUtc - date.getTime();
}

function toStartAt(date: string, time: string, timezone?: string | null): Date {
  const tz = timezone || 'America/New_York';
  const [year, month, day] = String(date).split('-').map(Number);
  const [hour, minute] = String(time || '00:00').split(':').map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0, 0));
  const offsetMs = getTimeZoneOffsetMs(utcGuess, tz);
  return new Date(utcGuess.getTime() - offsetMs);
}

function splitDateTime(d: Date, timezone?: string | null) {
  const tz = timezone || 'America/New_York';

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(d);

    const values: Record<string, string> = {};
    parts.forEach((part) => {
      if (part.type !== 'literal') values[part.type] = part.value;
    });

    return {
      date: `${values.year}-${values.month}-${values.day}`,
      time: `${values.hour}:${values.minute}`,
    };
  } catch {
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
}

function toSessionPayload(
  row: any,
  clientDisplay?: string | null,
  participants?: string | null
) {
  const timezone = row.timezone || 'America/New_York';
  const { date, time } = splitDateTime(row.startAt, timezone);
  const clientId: string | null = row.clientId ?? null;
  const clientType: 'internal' | 'external' = clientId ? 'internal' : 'external';

  return {
    id: row.id as string,
    date,
    time,
    timezone,
    client: clientDisplay ?? '',
    type: row.type as string,
    status: row.status as string,
    clientId,
    clientType,
    notes: row.notes || '',
    participants: participants || '',
  };
}

async function syncCoachSessionToSeekerCalendar(opts: {
  sessionId: string;
  coachId: string;
  clientId: string | null;
  startAt: Date;
  timezone: string;
  type: string;
  status: string;
  previousClientId?: string | null;
}) {
  const {
    sessionId,
    coachId,
    clientId,
    startAt,
    timezone,
    type,
    status,
    previousClientId,
  } = opts;

  if (previousClientId && previousClientId !== clientId) {
    await prisma.seekerCalendarItem.deleteMany({
      where: {
        source: 'coach',
        sourceItemId: sessionId,
        userId: previousClientId,
      },
    });
  }

  if (!clientId) {
    await prisma.seekerCalendarItem.deleteMany({
      where: {
        source: 'coach',
        sourceItemId: sessionId,
      },
    });
    return;
  }

  const coach = await prisma.user.findUnique({
    where: { id: coachId },
    select: { name: true, firstName: true, lastName: true, email: true },
  });

  const coachName =
    coach?.name ||
    `${coach?.firstName || ''} ${coach?.lastName || ''}`.trim() ||
    coach?.email ||
    'Coach';

  const { time } = splitDateTime(startAt, timezone);
  const title = `Coaching session with ${coachName}`;

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
    timezone,
    scheduledAtUtc: startAt,
    title,
    type: type || 'Strategy',
    status: status || 'Scheduled',
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
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const coachId = session.user.id as string;

  try {
    if (req.method === 'GET') {
      const rows = await prisma.coachingSession.findMany({
        where: { coachId },
        orderBy: { startAt: 'asc' },
        select: {
          id: true,
          coachId: true,
          clientId: true,
          startAt: true,
          timezone: true,
          type: true,
          status: true,
          notes: true,
        },
      });

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

      const ownSessions = rows.map((row) => {
        let display: string | null = null;
        let participants: string | null = null;

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

        if (!display && row.notes && typeof row.notes === 'string') {
          const firstLine = row.notes.split('|')[0].trim();
          if (firstLine.startsWith('Client (free text):')) {
            const val = firstLine.replace(/^Client \(free text\):\s*/, '');
            display = val || null;
            participants = val || null;
          }
        }

        return toSessionPayload(row, display, participants);
      });

      const inboundMirrors = await prisma.seekerCalendarItem.findMany({
        where: {
          userId: coachId,
          source: 'recruiter',
        },
        orderBy: { date: 'asc' },
      });

      let inboundSessions: any[] = [];

      if (inboundMirrors.length > 0) {
        const sourceItemIds = Array.from(
          new Set(
            inboundMirrors
              .map((m) => m.sourceItemId)
              .filter((id): id is string => typeof id === 'string')
          )
        );

        const recruiterItems =
          sourceItemIds.length > 0
            ? await prisma.recruiterCalendarItem.findMany({
                where: { id: { in: sourceItemIds } },
                select: {
                  id: true,
                  ownerId: true,
                  type: true,
                  status: true,
                },
              })
            : [];

        const recruiterOwnerIds = Array.from(
          new Set(recruiterItems.map((ri) => ri.ownerId))
        );

        const recruiters =
          recruiterOwnerIds.length > 0
            ? await prisma.user.findMany({
                where: { id: { in: recruiterOwnerIds } },
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              })
            : [];

        const recruiterMap = new Map<
          string,
          { name: string | null; firstName: string | null; lastName: string | null; email: string }
        >();
        for (const r of recruiters) {
          recruiterMap.set(r.id, r);
        }

        const recruiterItemMap = new Map<
          string,
          { id: string; ownerId: string; type: string; status: string }
        >();
        for (const ri of recruiterItems) {
          recruiterItemMap.set(ri.id, {
            id: ri.id,
            ownerId: ri.ownerId,
            type: ri.type,
            status: ri.status,
          });
        }

        inboundSessions = inboundMirrors.map((mirror) => {
          const linked = mirror.sourceItemId
            ? recruiterItemMap.get(mirror.sourceItemId)
            : undefined;

          const recruiter =
            linked && recruiterMap.get(linked.ownerId)
              ? recruiterMap.get(linked.ownerId)
              : null;

          const recruiterName =
            recruiter?.name ||
            `${recruiter?.firstName || ''} ${recruiter?.lastName || ''}`.trim() ||
            recruiter?.email ||
            'Recruiter';

          const timezone = mirror.timezone || 'America/New_York';
          const startAt = mirror.scheduledAtUtc || mirror.date;
          const { date, time } = splitDateTime(startAt, timezone);

          return {
            id: mirror.id as string,
            date,
            time,
            timezone,
            client: recruiterName,
            type: mirror.type || linked?.type || 'Strategy',
            status: mirror.status || linked?.status || 'Scheduled',
            clientId: linked ? linked.ownerId : null,
            clientType: linked ? 'internal' : 'external',
            notes: mirror.notes || '',
            participants: recruiterName,
          };
        });
      }

      const allSessions = [...ownSessions, ...inboundSessions].sort((a, b) => {
        const aKey = `${a.date}T${a.time || '00:00'}`;
        const bKey = `${b.date}T${b.time || '00:00'}`;
        return aKey.localeCompare(bKey);
      });

      return res.status(200).json({ sessions: allSessions });
    }

    if (req.method === 'POST') {
      const {
        date,
        time,
        timezone,
        clientType,
        clientUserId,
        clientName,
        clientEmail,
        type,
        status,
        participants,
        notes,
        enableVideo,
        foundryRoomId,
        foundryJoinUrl,
        foundryGuestJoinUrl,
        foundryScheduledAt,
        foundryTimezone,
      } = (req.body || {}) as {
        date?: string;
        time?: string;
        timezone?: string;
        clientType?: 'internal' | 'external';
        clientUserId?: string | null;
        clientName?: string;
        clientEmail?: string;
        type?: string;
        status?: string;
        participants?: string;
        notes?: string;
        enableVideo?: boolean;
        foundryRoomId?: string | null;
        foundryJoinUrl?: string | null;
        foundryGuestJoinUrl?: string | null;
        foundryScheduledAt?: string | null;
        foundryTimezone?: string | null;
      };

      if (!date || !time) {
        return res.status(400).json({ error: 'Missing date or time' });
      }

      const safeTimezone = timezone || foundryTimezone || 'America/New_York';
      const startAt = toStartAt(String(date), String(time), safeTimezone);

      let clientId: string | null = null;
      let storedNotes: string | undefined;

      if (clientType === 'internal') {
        if (!clientUserId) {
          return res.status(400).json({ error: 'Missing clientUserId for internal client' });
        }
        clientId = String(clientUserId);

        const label = clientName
          ? `Client (internal display): ${String(clientName)}`
          : undefined;

        storedNotes = [label, notes].filter(Boolean).join(' | ');
      } else {
        const freeText = (participants || clientName || '').trim();
        if (!freeText) {
          return res.status(400).json({
            error: 'Missing client/participant info for external client',
          });
        }
        clientId = null;
        const label = `Client (free text): ${freeText}`;
        storedNotes = [label, notes].filter(Boolean).join(' | ');
      }

      const foundryNoteParts = [
        enableVideo && foundryJoinUrl ? `Foundry room: ${foundryJoinUrl}` : null,
        enableVideo && foundryGuestJoinUrl ? `Guest join: ${foundryGuestJoinUrl}` : null,
      ].filter(Boolean);

      if (foundryNoteParts.length > 0) {
        storedNotes = [storedNotes, ...foundryNoteParts].filter(Boolean).join(' | ');
      }

      const created = await prisma.coachingSession.create({
        data: {
          coachId,
          clientId,
          startAt,
          timezone: safeTimezone,
          durationMin: 60,
          type: type || 'Strategy',
          status: status || 'Scheduled',
          notes: storedNotes,
        },
      });

      await syncCoachSessionToSeekerCalendar({
        sessionId: created.id,
        coachId,
        clientId,
        startAt,
        timezone: safeTimezone,
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

      return res.status(201).json({
        session: toSessionPayload(created, displayName, participantsOut),
      });
    }

    if (req.method === 'PUT') {
      const {
        id,
        date,
        time,
        timezone,
        clientType,
        clientUserId,
        clientName,
        clientEmail,
        type,
        status,
        participants,
        notes,
        enableVideo,
        foundryRoomId,
        foundryJoinUrl,
        foundryGuestJoinUrl,
        foundryScheduledAt,
        foundryTimezone,
      } = (req.body || {}) as {
        id?: string;
        date?: string;
        time?: string;
        timezone?: string;
        clientType?: 'internal' | 'external';
        clientUserId?: string | null;
        clientName?: string;
        clientEmail?: string;
        type?: string;
        status?: string;
        participants?: string;
        notes?: string;
        enableVideo?: boolean;
        foundryRoomId?: string | null;
        foundryJoinUrl?: string | null;
        foundryGuestJoinUrl?: string | null;
        foundryScheduledAt?: string | null;
        foundryTimezone?: string | null;
      };

      if (!id) {
        return res.status(400).json({ error: 'Missing id for update' });
      }

      const existing = await prisma.coachingSession.findUnique({
        where: { id: String(id) },
        select: {
          coachId: true,
          clientId: true,
          startAt: true,
          timezone: true,
          type: true,
          status: true,
        },
      });

      if (!existing || existing.coachId !== coachId) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const data: any = {};
      const safeTimezone = timezone || foundryTimezone || existing.timezone || 'America/New_York';

      if (date && time) {
        data.startAt = toStartAt(String(date), String(time), safeTimezone);
      }

      if (typeof timezone === 'string') {
        data.timezone = safeTimezone;
      }

      if (clientType === 'internal') {
        if (!clientUserId) {
          return res.status(400).json({ error: 'Missing clientUserId for internal client' });
        }
        data.clientId = String(clientUserId);
        const label = clientName
          ? `Client (internal display): ${String(clientName)}`
          : undefined;
        data.notes = [label, notes].filter(Boolean).join(' | ');
      } else if (clientType === 'external') {
        const freeText = (participants || clientName || '').trim();
        if (!freeText) {
          return res.status(400).json({
            error: 'Missing client/participant info for external client',
          });
        }
        data.clientId = null;
        const label = `Client (free text): ${freeText}`;
        data.notes = [label, notes].filter(Boolean).join(' | ');
      } else if (typeof notes === 'string') {
        data.notes = notes;
      }

      const foundryNoteParts = [
        enableVideo && foundryJoinUrl ? `Foundry room: ${foundryJoinUrl}` : null,
        enableVideo && foundryGuestJoinUrl ? `Guest join: ${foundryGuestJoinUrl}` : null,
      ].filter(Boolean);

      if (foundryNoteParts.length > 0) {
        data.notes = [data.notes || notes, ...foundryNoteParts].filter(Boolean).join(' | ');
      }

      if (typeof type === 'string') data.type = type;
      if (typeof status === 'string') data.status = status;

      const updated = await prisma.coachingSession.update({
        where: { id: String(id) },
        data,
      });

      await syncCoachSessionToSeekerCalendar({
        sessionId: updated.id,
        coachId,
        clientId: updated.clientId ?? null,
        startAt: updated.startAt,
        timezone: updated.timezone || safeTimezone,
        type: updated.type,
        status: updated.status,
        previousClientId: existing.clientId ?? null,
      });

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

      return res.status(200).json({
        session: toSessionPayload(updated, displayName, participantsOut),
      });
    }

    if (req.method === 'DELETE') {
      const { id } = (req.body || {}) as { id?: string };

      if (!id) {
        return res.status(400).json({ error: 'Missing id' });
      }

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

    res.setHeader('Allow', 'GET,POST,PUT,DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Coaching sessions API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
