// pages/api/recruiter/calendar.js
//
// Ultra-safe stub so RecruiterCalendar stops getting 500s.
// - GET: returns empty events array
// - POST/PUT: echoes back parsed body
// - DELETE: returns ok: true
//
// This does NOT touch Prisma yet. The calendar component already
// does optimistic local updates, so this is just to keep the API happy.

export default function handler(req, res) {
  try {
    const method = req.method || 'GET';

    if (method === 'GET') {
      // Later: load from Prisma.recruiterCalendarItem
      return res.status(200).json({ events: [] });
    }

    if (method === 'POST' || method === 'PUT') {
      // Safely parse body in case it's a string
      let body = {};
      try {
        if (typeof req.body === 'string') {
          body = req.body ? JSON.parse(req.body) : {};
        } else if (req.body && typeof req.body === 'object') {
          body = req.body;
        }
      } catch (e) {
        console.error('Recruiter calendar: failed to parse body', e);
        body = {};
      }

      // Later: upsert in Prisma
      return res.status(200).json({ event: body });
    }

    if (method === 'DELETE') {
      // Later: delete from Prisma
      return res.status(200).json({ ok: true });
    }

    // Anything else → 405, not 500
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Recruiter calendar API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
