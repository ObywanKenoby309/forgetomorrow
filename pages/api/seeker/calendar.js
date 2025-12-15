// pages/api/seeker/calendar.js
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = session.user.id;

  try {
    if (req.method === 'GET') {
      // 🔹 Fetch all events for this seeker
      const items = await prisma.seekerCalendarItem.findMany({
        where: { userId },
        orderBy: [{ date: 'asc' }, { time: 'asc' }],
      });

      return res.status(200).json({ items });
    }

    if (req.method === 'POST') {
      const { date, time, title, type, notes } = req.body || {};

      if (!date || !time || !title) {
        return res
          .status(400)
          .json({ error: 'date, time, and title are required' });
      }

      const item = await prisma.seekerCalendarItem.create({
        data: {
          userId,
          date: new Date(date), // expects YYYY-MM-DD
          time,
          title: title.trim(),
          type: type || 'Interview',
          notes: notes || '',
          status: 'Scheduled',
          source: 'personal',
          sourceItemId: null,
        },
      });

      return res.status(201).json({ item });
    }

    if (req.method === 'PUT') {
      const { id, date, time, title, type, notes, status } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      // Ensure the event belongs to this user
      const existing = await prisma.seekerCalendarItem.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Not found' });
      }

      const item = await prisma.seekerCalendarItem.update({
        where: { id },
        data: {
          ...(date ? { date: new Date(date) } : {}),
          ...(time ? { time } : {}),
          ...(title ? { title: title.trim() } : {}),
          ...(type ? { type } : {}),
          ...(status ? { status } : {}),
          ...(notes !== undefined ? { notes } : {}),
        },
      });

      return res.status(200).json({ item });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      // Only delete events owned by this user
      const deleted = await prisma.seekerCalendarItem.deleteMany({
        where: { id, userId },
      });

      if (deleted.count === 0) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error('Seeker calendar API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
