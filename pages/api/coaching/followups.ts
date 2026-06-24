// pages/api/coaching/followups.ts
//
// Returns two follow-up buckets for the FollowUpsDueCard carousel:
//   sessionFollowups — sessions where followUpDueAt is past and followUpDone is false
//   overdueCheckins  — clients where lastContact is >30 days ago (or never)

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const coachId = session.user.id as string;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    // ── Session follow-ups: past due and not marked done ─────────────────────
    const dueSessions = await prisma.coachingSession.findMany({
      where: {
        coachId,
        followUpDueAt: { lte: now },
        followUpDone: false,
        status: { not: 'Cancelled' },
      },
      orderBy: { followUpDueAt: 'asc' },
      take: 10,
      select: {
        id: true,
        followUpDueAt: true,
        clientId: true,
        coachingClientId: true,
        notes: true,
        coachingClient: {
          select: { id: true, name: true },
        },
      },
    });

    // Resolve any internal user names for sessions linked by clientId
    const internalClientIds = dueSessions
      .map((s) => s.clientId)
      .filter((id): id is string => !!id);

    const internalUsers = internalClientIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: internalClientIds } },
          select: { id: true, name: true, firstName: true, lastName: true, email: true },
        })
      : [];

    const userMap = new Map(internalUsers.map((u) => [u.id, u]));

    const sessionFollowups = dueSessions.map((s) => {
      let clientName = 'Unknown client';
      let clientRecordId: string | null = s.coachingClientId;

      if (s.coachingClient) {
        clientName = s.coachingClient.name;
        clientRecordId = s.coachingClient.id;
      } else if (s.clientId && userMap.has(s.clientId)) {
        const u = userMap.get(s.clientId)!;
        clientName = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
      } else if (s.notes) {
        const match = s.notes.match(/Client \((?:free text|internal display)\):\s*([^|]+)/);
        if (match) clientName = match[1].trim();
      }

      return {
        sessionId: s.id,
        clientRecordId,
        name: clientName,
        dueAt: s.followUpDueAt?.toISOString() ?? null,
        href: clientRecordId
          ? `/dashboard/coaching/clients/${clientRecordId}`
          : '/dashboard/coaching/clients',
      };
    });

    // ── Overdue check-ins: lastContact >30 days ago or never ─────────────────
    const overdueClients = await prisma.coachingClient.findMany({
      where: {
        coachId,
        status: 'Active',
        OR: [
          { lastContact: { lte: thirtyDaysAgo } },
          { lastContact: null },
        ],
      },
      orderBy: { lastContact: 'asc' },
      take: 10,
      select: {
        id: true,
        name: true,
        lastContact: true,
      },
    });

    const overdueCheckins = overdueClients.map((c) => {
      const daysSince = c.lastContact
        ? Math.floor((now.getTime() - c.lastContact.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        clientRecordId: c.id,
        name: c.name,
        lastContact: c.lastContact?.toISOString() ?? null,
        daysSince,
        href: `/dashboard/coaching/clients/${c.id}`,
      };
    });

    return res.status(200).json({ sessionFollowups, overdueCheckins });
  } catch (err) {
    console.error('[followups] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}