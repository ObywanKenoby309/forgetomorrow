// pages/api/recruiter/calendar.js
//
// Temporary safe stub so the RecruiterCalendar UI runs without 500s.
// - GET: returns empty list
// - POST/PUT: echoes back the event payload
// - DELETE: returns ok: true
//
// The RecruiterCalendar component already does optimistic local updates,
// so this is enough to keep behavior working while we wire real persistence.

export default async function handler(req, res) {
  try {
    const { method } = req;

    if (method === 'GET') {
      // Later: fetch events from Prisma based on current recruiter
      return res.status(200).json({ events: [] });
    }

    if (method === 'POST' || method === 'PUT') {
      // Later: upsert in Prisma.recruiterCalendarItem
      const body = req.body || {};
      return res.status(200).json({ event: body });
    }

    if (method === 'DELETE') {
      // Later: delete from Prisma.recruiterCalendarItem by id
      return res.status(200).json({ ok: true });
    }

    // Anything else
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Recruiter calendar API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
