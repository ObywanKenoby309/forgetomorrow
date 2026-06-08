// pages/api/feedback/coach-wallpaper.js
// Public endpoint — returns the wallpaper URL and coach name for a given coachId.
// Used by the external public CSAT page to match the coach's profile aesthetic.
// No authentication required.
//
// GET ?coachId=<id>
// Response: { wallpaperUrl, coachName }

import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const coachId = String(req.query.coachId || '').trim();
  if (!coachId) {
    return res.status(400).json({ error: 'coachId is required' });
  }

  try {
    const coach = await prisma.user.findUnique({
      where: { id: coachId },
      select: {
        firstName:    true,
        lastName:     true,
        name:         true,
        wallpaperUrl: true,
        deletedAt:    true,
      },
    });

    if (!coach || coach.deletedAt) {
      return res.status(404).json({ error: 'Coach not found' });
    }

    const coachName = [coach.firstName, coach.lastName].filter(Boolean).join(' ')
      || coach.name
      || 'Your coach';

    return res.status(200).json({
      coachName,
      wallpaperUrl: coach.wallpaperUrl || null,
    });
  } catch (err) {
    console.error('[feedback/coach-wallpaper] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
