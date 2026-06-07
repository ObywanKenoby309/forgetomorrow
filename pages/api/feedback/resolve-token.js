// pages/api/feedback/resolve-token.js
// Resolves a public CSAT token → coachId + coachName.
// Tokens are signed JWTs (no DB table needed).
// Public — no authentication required.
//
// GET ?token=<token>
// Response: { coachId, coachName } | { error }

import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const TOKEN_SECRET = process.env.CSAT_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = String(req.query.token || '').trim();
  if (!raw) {
    return res.status(400).json({ error: 'Missing token' });
  }

  try {
    // Verify the JWT
    let payload;
    try {
      payload = jwt.verify(raw, TOKEN_SECRET);
    } catch {
      return res.status(400).json({ error: 'This feedback link is invalid or has expired.' });
    }

    const coachId = String(payload?.coachId || '').trim();
    if (!coachId) {
      return res.status(400).json({ error: 'Malformed feedback token.' });
    }

    // Confirm coach still exists
    const coach = await prisma.user.findUnique({
      where: { id: coachId },
      select: { id: true, firstName: true, lastName: true, name: true, deletedAt: true },
    });

    if (!coach || coach.deletedAt) {
      return res.status(404).json({ error: 'The coach associated with this link no longer exists.' });
    }

    const coachName = [coach.firstName, coach.lastName].filter(Boolean).join(' ') || coach.name || 'Your coach';

    return res.status(200).json({ coachId: coach.id, coachName });
  } catch (err) {
    console.error('[feedback/resolve-token] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
