// pages/api/recruiter/calendar.js
import { prisma } from '@/lib/prisma'; // ⬅️ CHANGED: named import
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Helper – convert Date to "YYYY-MM-DD"
function toYMD(date) {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Map DB row → API event shape used by RecruiterCalendar
function mapItemToEvent(item) {
  return {
    id: item.id,
    title: item.title,
    date: toYMD(item.date),
    time: item.time || '',
    type: item.type || 'Interview',
    status: item.status || 'Scheduled',
    notes: item.notes || '',
    candidateType: item.candidateType || 'external',
    candidateUserId: item.candidateUserId || null,
    candidateName: item.candidateName || '',
    scope: item.scope || 'team',
    company: item.company || '',
    jobTitle: item.jobTitle || '',
    req: item.req || '',
  };
}

// Parse incoming body into safe values for Prisma
function parseBody(body, ownerId) {
  const {
    id,
    title,
    date,
    time,
    type,
    status,
    notes,
    candidateType,
    candidateUserId,
    candidateName,
    scope,
    company,
    jobTitle,
    req,
  } = body || {};

  const safeTitle = (title || '').trim();
  if (!safeTitle) {
    throw new Error('Title is required');
  }

  if (!date) {
    throw new Error('Date is required');
  }

  const timeStr = time || '09:00';
  // Store as full DateTime for sorting; assume UTC for now
  const fullDate = new Date(`${date}T${timeStr || '09:00'}:00.000Z`);

  const safeScope = scope === 'personal' ? 'personal' : 'team';
  const safeCandidateType =
    candidateType === 'internal' ? 'internal' : 'external';

  return {
    id: id || undefined,
    ownerId,
    title: safeTitle,
    scope: safeScope,
    date: fullDate,
    time: timeStr,
    type: type || 'Interview',
    status: status || 'Scheduled',
    notes: notes || '',
    candidateType: safeCandidateType,
    candidateUserId: candidateUserId || null,
    candidateName: (candidateName || '').trim(),
    company: company || null,
    jobTitle: jobTitle || null,
    req: req || null,
  };
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      // Fetch all items for this recruiter (owner)
      const items = await prisma.recruiterCalendarItem.findMany({
        where: { ownerId: userId },
        orderBy: { date: 'asc' },
      });

      const events = items.map(mapItemToEvent);
      return res.status(200).json({ events });
    }

    if (req.method === 'POST') {
      const parsed = parseBody(req.body, userId);

      const created = await prisma.recruiterCalendarItem.create({
        data: {
          ownerId: parsed.ownerId,
          scope: parsed.scope,
          date: parsed.date,
          time: parsed.time,
          title: parsed.title,
          type: parsed.type,
          status: parsed.status,
          notes: parsed.notes,
          candidateType: parsed.candidateType,
          candidateUserId: parsed.candidateUserId,
          candidateName: parsed.candidateName,
          company: parsed.company,
          jobTitle: parsed.jobTitle,
          req: parsed.req,
        },
      });

      return res.status(201).json({ event: mapItemToEvent(created) });
    }

    if (req.method === 'PUT') {
      const parsed = parseBody(req.body, userId);

      if (!parsed.id) {
        return res.status(400).json({ error: 'Missing event id' });
      }

      const existing = await prisma.recruiterCalendarItem.findUnique({
        where: { id: parsed.id },
      });

      if (!existing || existing.ownerId !== userId) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const updated = await prisma.recruiterCalendarItem.update({
        where: { id: parsed.id },
        data: {
          scope: parsed.scope,
          date: parsed.date,
          time: parsed.time,
          title: parsed.title,
          type: parsed.type,
          status: parsed.status,
          notes: parsed.notes,
          candidateType: parsed.candidateType,
          candidateUserId: parsed.candidateUserId,
          candidateName: parsed.candidateName,
          company: parsed.company,
          jobTitle: parsed.jobTitle,
          req: parsed.req,
        },
      });

      return res.status(200).json({ event: mapItemToEvent(updated) });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'Missing event id' });
      }

      const existing = await prisma.recruiterCalendarItem.findUnique({
        where: { id },
      });

      if (!existing || existing.ownerId !== userId) {
        return res.status(404).json({ error: 'Event not found' });
      }

      await prisma.recruiterCalendarItem.delete({
        where: { id },
      });

      return res.status(200).json({ ok: true });
    }

    // Fallback for unsupported methods
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error('Recruiter calendar API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
