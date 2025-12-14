// pages/api/dashboard/coaching/overview.js
import { prisma } from '@/lib/prisma';

function buildDisplayName(user) {
  if (!user) return 'Client';
  if (user.name && user.name.trim().length > 0) return user.name.trim();

  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return 'Client';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { coachId } = req.query;

  if (!coachId || typeof coachId !== 'string') {
    return res.status(400).json({ error: 'coachId query parameter is required' });
  }

  try {
    const now = new Date();

    // Today window in server time (good enough for Phase 1)
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // KPI 1: Sessions Today (non-cancelled)
    const sessionsToday = await prisma.coachingSession.count({
      where: {
        coachId,
        startAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: 'Cancelled',
        },
      },
    });

    // KPI 2: Active Clients
    const activeClients = await prisma.coachingClient.count({
      where: {
        coachId,
        status: 'Active',
      },
    });

    // KPI 3: Follow-ups Due (overdue or due now, and not done)
    const followUpsDue = await prisma.coachingSession.count({
      where: {
        coachId,
        followUpDone: false,
        followUpDueAt: {
          lte: now,
        },
      },
    });

    // Upcoming sessions (next 3)
    const upcomingRaw = await prisma.coachingSession.findMany({
      where: {
        coachId,
        startAt: {
          gte: now,
        },
        status: {
          not: 'Cancelled',
        },
      },
      orderBy: {
        startAt: 'asc',
      },
      take: 3,
      include: {
        client: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const upcomingSessions = upcomingRaw.map((s) => ({
      id: s.id,
      startAt: s.startAt.toISOString(),
      type: s.type,
      status: s.status,
      clientName: buildDisplayName(s.client),
    }));

    // Clients snapshot (most recently updated first)
    const clientsRaw = await prisma.coachingClient.findMany({
      where: {
        coachId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
      include: {
        client: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const clients = clientsRaw.map((c) => ({
      id: c.id,
      name: buildDisplayName(c.client),
      status: c.status,
      nextSession: c.nextSession ? c.nextSession.toISOString() : null,
    }));

    return res.status(200).json({
      kpis: {
        sessionsToday,
        activeClients,
        followUpsDue,
      },
      upcomingSessions,
      clients,
    });
  } catch (err) {
    console.error('Error in /api/dashboard/coaching/overview:', err);
    return res.status(500).json({
      error: 'Failed to load coaching overview',
    });
  }
}
