// pages/api/coaching/sessions/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

// Helper to parse date+time from the client into a Date
function toStartAt(date: string, time: string): Date {
  // Expecting "YYYY-MM-DD" and "HH:MM"
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  // Store as local time; DB will keep UTC
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🔐 Auth check – uses your existing NextAuth setup
  const session = await getServerSession(req, res, authOptions);

  // TEMPORARY: if this is blocking you in preview, you *can* comment this out
  // while only you + John are inside. But keep it ON in real prod.
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const coachId = session.user.id as string;

  try {
    switch (req.method) {
      case 'GET': {
        // List sessions for this coach
        const sessions = await prisma.coachingSession.findMany({
          where: { coachId },
          orderBy: { startAt: 'asc' },
        });

        // Map to the shape your UI expects (date/time strings, etc.)
        const result = sessions.map((s) => {
          const dt = new Date(s.startAt);
          const yyyy = dt.getFullYear();
          const mm = String(dt.getMonth() + 1).padStart(2, '0');
          const dd = String(dt.getDate()).padStart(2, '0');
          const hh = String(dt.getHours()).padStart(2, '0');
          const mi = String(dt.getMinutes()).padStart(2, '0');

          return {
            id: s.id,
            date: `${yyyy}-${mm}-${dd}`,
            time: `${hh}:${mi}`,
            client: s.clientId || '',   // you can replace with a display name later
            type: s.type,
            status: s.status,
          };
        });

        return res.status(200).json({ sessions: result });
      }

      case 'POST': {
        const { date, time, client, type, status } = req.body as {
          date: string;
          time: string;
          client: string;
          type: string;
          status: string;
        };

        if (!date || !time || !client) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const startAt = toStartAt(date, time);

        // For v1 we’ll treat `client` as a free-text label (no strict FK)
        const created = await prisma.coachingSession.create({
          data: {
            coachId,
            clientId: client || null, // later this can be real user.id if you want
            startAt,
            durationMin: 60,
            type: type || 'Strategy',
            status: status || 'Scheduled',
          },
        });

        return res.status(201).json({ id: created.id });
      }

      case 'PUT': {
        const { id, date, time, client, type, status } = req.body as {
          id: string;
          date: string;
          time: string;
          client: string;
          type: string;
          status: string;
        };

        if (!id) {
          return res.status(400).json({ error: 'Missing session id' });
        }

        const data: any = {};

        if (date && time) data.startAt = toStartAt(date, time);
        if (typeof client === 'string') data.clientId = client || null;
        if (typeof type === 'string') data.type = type;
        if (typeof status === 'string') data.status = status;

        await prisma.coachingSession.update({
          where: { id },
          data,
        });

        return res.status(200).json({ ok: true });
      }

      case 'DELETE': {
        const { id } = req.body as { id: string };

        if (!id) {
          return res.status(400).json({ error: 'Missing session id' });
        }

        await prisma.coachingSession.delete({
          where: { id },
        });

        return res.status(200).json({ ok: true });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
  } catch (err) {
    console.error('Error in /api/coaching/sessions:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
