// pages/api/recruiter/calendar.js
import prisma from '@/lib/prisma';
import { getClientSession } from '@/lib/auth-client'; // adjust if your auth helper lives elsewhere

function toDateOnlyString(date) {
  if (!date) return null;
  const d = new Date(date);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildDateTime(dateStr, timeStr) {
  const date = (dateStr || '').trim();
  const time = (timeStr || '').trim() || '09:00';

  // Simple ISO build: YYYY-MM-DDTHH:mm:00Z
  // You can later adapt this to your real timezone logic if needed.
  return new Date(`${date}T${time}:00Z`);
}

function mapItemToEvent(item) {
  return {
    id: item.id,
    title: item.title,
    date: toDateOnlyString(item.date),
    time: item.time || '09:00',
    type: item.type,
    status: item.status,
    notes: item.notes || '',
    candidateType: item.candidateType,
    candidateUserId: item.candidateUserId,
    candidateName: item.candidateName,
    company: item.company || '',
    jobTitle: item.jobTitle || '',
    req: item.req || '',
    scope: item.scope || 'team',
  };
}

export default async function handler(req, res) {
  try {
    const session = await getClientSession(req, res);
    const userId = session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const method = req.method;

    // ───────────────────────── GET ─────────────────────────
    if (method === 'GET') {
      // All items owned by this recruiter
      const items = await prisma.recruiterCalendarItem.findMany({
        where: { ownerId: userId },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      });

      const events = items.map(mapItemToEvent);
      return res.status(200).json({ events });
    }

    // ───────────────────────── POST (create) ─────────────────────────
    if (method === 'POST') {
      const {
        id, // ignored on create
        title,
        date,
        time,
        type,
        status,
        notes,
        candidateType,
        candidateUserId,
        candidateName,
        company,
        jobTitle,
        req,
        scope,
      } = req.body || {};

      if (!title || !date) {
        return res.status(400).json({ error: 'Title and date are required.' });
      }

      const dt = buildDateTime(date, time);
      if (Number.isNaN(dt.getTime())) {
        return res.status(400).json({ error: 'Invalid date/time.' });
      }

      const safeScope = scope === 'personal' ? 'personal' : 'team';
      const safeCandidateType =
        candidateType === 'internal' ? 'internal' : 'external';

      const created = await prisma.recruiterCalendarItem.create({
        data: {
          ownerId: userId,
          scope: safeScope,
          date: dt,
          time: time || null,
          title,
          type: type || 'Interview',
          status: status || 'Scheduled',
          notes: notes || null,
          candidateType: safeCandidateType,
          candidateUserId:
            safeCandidateType === 'internal' && candidateUserId
              ? String(candidateUserId)
              : null,
          candidateName: candidateName || 'Candidate',
          company: company || null,
          jobTitle: jobTitle || null,
          req: req || null,
        },
      });

      return res.status(200).json({ event: mapItemToEvent(created) });
    }

    // ───────────────────────── PUT (update) ─────────────────────────
    if (method === 'PUT') {
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
        company,
        jobTitle,
        req,
        scope,
      } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: 'id is required for update.' });
      }

      // Make sure this item belongs to the current recruiter
      const existing = await prisma.recruiterCalendarItem.findFirst({
        where: { id: String(id), ownerId: userId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Item not found.' });
      }

      let dt = existing.date;
      if (date || time) {
        const newDateStr = date || toDateOnlyString(existing.date);
        const newTimeStr = time || existing.time || '09:00';
        dt = buildDateTime(newDateStr, newTimeStr);
        if (Number.isNaN(dt.getTime())) {
          return res.status(400).json({ error: 'Invalid date/time.' });
        }
      }

      const safeScope =
        scope === 'personal' || scope === 'team'
          ? scope
          : existing.scope || 'team';

      const safeCandidateType =
        candidateType === 'internal' || candidateType === 'external'
          ? candidateType
          : existing.candidateType || 'external';

      const updated = await prisma.recruiterCalendarItem.update({
        where: { id: existing.id },
        data: {
          title: title ?? existing.title,
          date: dt,
          time: time !== undefined ? time : existing.time,
          type: type ?? existing.type,
          status: status ?? existing.status,
          notes: notes !== undefined ? notes : existing.notes,
          scope: safeScope,
          candidateType: safeCandidateType,
          candidateUserId:
            safeCandidateType === 'internal'
              ? candidateUserId ?? existing.candidateUserId
              : null,
          candidateName: candidateName ?? existing.candidateName,
          company: company !== undefined ? company : existing.company,
          jobTitle: jobTitle !== undefined ? jobTitle : existing.jobTitle,
          req: req !== undefined ? req : existing.req,
        },
      });

      return res.status(200).json({ event: mapItemToEvent(updated) });
    }

    // ───────────────────────── DELETE ─────────────────────────
    if (method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'id is required for delete.' });
      }

      // ensure owner match
      const existing = await prisma.recruiterCalendarItem.findFirst({
        where: { id: String(id), ownerId: userId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Item not found.' });
      }

      await prisma.recruiterCalendarItem.delete({
        where: { id: existing.id },
      });

      return res.status(200).json({ ok: true });
    }

    // ───────────────────────── Method Not Allowed ─────────────────────────
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Recruiter calendar API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
