// pages/api/coaching/sessions.js
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // adjust path if your authOptions live elsewhere

// Helper: map DB record -> DTO shape used by the UI
function mapSessionToDTO(s) {
  // Derive local-ish date and time from startAt
  let date = null;
  let time = null;

  if (s.startAt) {
    const dt = new Date(s.startAt);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');

    date = `${y}-${m}-${d}`;
    time = `${hh}:${mm}`;
  }

  return {
    id: s.id,
    date: date,
    time: time,
    // For now, we store the "client name" in notes so the UI has something to display
    client: s.notes || '',
    type: s.type || 'Strategy',
    status: s.status || 'Scheduled',
  };
}

// Helper: turn date + time into a Date for startAt
function buildStartAt(date, time) {
  if (!date) return new Date();
  const safeTime = time || '00:00';
  // Treat as UTC-ish; good enough for now
  return new Date(`${date}T${safeTime}:00.000Z`);
}

export default async function handler(req, res) {
  // --- Auth guard (coach must be logged in) ---
  const session = await getServerSession(req, res, authOptions).catch(() => null);
  const userId = session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const method = req.method;

  // ─────────────────────────────────────────────
  // GET /api/coaching/sessions
  // ─────────────────────────────────────────────
  if (method === 'GET') {
    try {
      const sessions = await prisma.coachingSession.findMany({
        where: { coachId: userId },
        orderBy: { startAt: 'asc' },
      });

      const dto = sessions.map(mapSessionToDTO);
      return res.status(200).json({ sessions: dto });
    } catch (err) {
      console.error('Error fetching coaching sessions', err);
      return res.status(500).json({ error: 'Failed to load sessions' });
    }
  }

  // ─────────────────────────────────────────────
  // POST /api/coaching/sessions  (create)
  // body: { date, time, client, type, status }
  // ─────────────────────────────────────────────
  if (method === 'POST') {
    const { date, time, client, type, status } = req.body || {};

    if (!date || !client || !client.trim()) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const startAt = buildStartAt(date, time);

      const created = await prisma.coachingSession.create({
        data: {
          coachId: userId,
          clientId: null,          // we can wire real client linking later
          coachingClientId: null,  // same here
          startAt,
          durationMin: 60,
          type: type || 'Strategy',
          status: status || 'Scheduled',
          // For now, store the display client name in notes so the UI can show it
          notes: client.trim(),
        },
      });

      const dto = mapSessionToDTO(created);
      return res.status(201).json({ session: dto });
    } catch (err) {
      console.error('Error creating coaching session', err);
      return res.status(500).json({ error: 'Failed to create session' });
    }
  }

  // ─────────────────────────────────────────────
  // PUT /api/coaching/sessions  (update)
  // body: { id, date, time, client, type, status }
  // ─────────────────────────────────────────────
  if (method === 'PUT') {
    const { id, date, time, client, type, status } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: 'Session id is required' });
    }

    try {
      const startAt = date ? buildStartAt(date, time) : undefined;

      const updated = await prisma.coachingSession.update({
        where: { id },
        data: {
          startAt,
          type,
          status,
          notes: typeof client === 'string' ? client.trim() : undefined,
        },
      });

      const dto = mapSessionToDTO(updated);
      return res.status(200).json({ session: dto });
    } catch (err) {
      console.error('Error updating coaching session', err);
      return res.status(500).json({ error: 'Failed to update session' });
    }
  }

  // ─────────────────────────────────────────────
  // DELETE /api/coaching/sessions  (delete)
  // body: { id }
  // ─────────────────────────────────────────────
  if (method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: 'Session id is required' });
    }

    try {
      await prisma.coachingSession.delete({
        where: { id },
      });

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error deleting coaching session', err);
      return res.status(500).json({ error: 'Failed to delete session' });
    }
  }

  // ─────────────────────────────────────────────
  // Fallback for other methods
  // ─────────────────────────────────────────────
  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).end(`Method ${method} Not Allowed`);
}
