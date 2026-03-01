// pages/api/crm/reports/queue.js
//
// GET /api/crm/reports/queue?queueId=xxx
//
// Returns all dashboard stat card data for a given queue in a single request.
// Used by the dashboard to power the 9 stat cards + recent tickets panel.
//
// Query params:
//   queueId  — required, or 'all' for org-wide stats
//   from     — optional ISO date string, defaults to start of current month
//   to       — optional ISO date string, defaults to now

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, employee: true, role: true },
  });

  if (!user?.employee && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'CRM access requires employee account' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { queueId, from, to } = req.query;

    if (!queueId) {
      return res.status(400).json({ error: 'queueId is required' });
    }

    // Date range — defaults to current month
    const now       = new Date();
    const fromDate  = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate    = to   ? new Date(to)   : now;

    // Base where clause
    const queueWhere = queueId === 'all' ? {} : { queueId };
    const activeWhere = {
      ...queueWhere,
      status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
    };
    const periodWhere = {
      ...queueWhere,
      createdAt: { gte: fromDate, lte: toDate },
    };

    // Run all stat queries in parallel
    const [
      assignedCount,
      openCount,
      unassignedCount,
      onHoldCount,
      pendingCount,
      agingCount,
      slaBreachedCount,
      resolvedThisPeriod,
      sctaskResolvedThisPeriod,
      recentTickets,
      breachTrend,
      myOpenTickets,
    ] = await Promise.all([

      // ASSIGNED — active tickets with an assignee
      prisma.ticket.count({
        where: {
          ...activeWhere,
          assignedToId: { not: null },
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
        },
      }),

      // OPEN — all active (not resolved/closed)
      prisma.ticket.count({ where: activeWhere }),

      // UNASSIGNED — open with no assignee
      prisma.ticket.count({
        where: { ...activeWhere, assignedToId: null, status: 'OPEN' },
      }),

      // ON HOLD
      prisma.ticket.count({
        where: { ...queueWhere, status: 'ON_HOLD' },
      }),

      // PENDING CUSTOMER
      prisma.ticket.count({
        where: { ...queueWhere, status: 'PENDING_CUSTOMER' },
      }),

      // AGING > 7 days — active tickets older than 7 days
      prisma.ticket.count({
        where: {
          ...activeWhere,
          createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),

      // SLA BREACHED — active breached tickets
      prisma.ticket.count({
        where: { ...activeWhere, slaBreached: true },
      }),

      // AVG RESOLUTION — for all types this period
      prisma.ticket.findMany({
        where: {
          ...queueWhere,
          status:     { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { not: null },
          createdAt:  { gte: fromDate, lte: toDate },
        },
        select: { createdAt: true, resolvedAt: true },
      }),

      // AVG FULFILLMENT — SCTASKs only this period
      prisma.ticket.findMany({
        where: {
          ...queueWhere,
          type:       'SCTASK',
          status:     { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { not: null },
          createdAt:  { gte: fromDate, lte: toDate },
        },
        select: { createdAt: true, resolvedAt: true },
      }),

      // RECENT TICKETS — last 10 for the activity panel
      prisma.ticket.findMany({
        where:   queueWhere,
        orderBy: { updatedAt: 'desc' },
        take:    10,
        include: {
          queue:      { select: { id: true, name: true, color: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          slaPolicy:  { select: { warningThreshold: true } },
        },
      }),

      // SLA BREACH TREND — breached tickets per day last 30 days
      prisma.ticket.findMany({
        where: {
          ...queueWhere,
          slaBreached: true,
          createdAt:   { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { createdAt: true },
      }),

      // MY OPEN TICKETS — for the "My Work" panel
      prisma.ticket.findMany({
        where: {
          ...queueWhere,
          assignedToId: user.id,
          status:       { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
        },
        orderBy: { updatedAt: 'desc' },
        take:    10,
        select: {
          id:       true,
          number:   true,
          title:    true,
          priority: true,
          status:   true,
          type:     true,
          slaResolveDue: true,
          slaBreached:   true,
          queue:    { select: { name: true, color: true } },
        },
      }),
    ]);

    // ── Compute avg resolution time ──────────────────────────────────────
    function avgMinutes(rows) {
      if (!rows.length) return null;
      const total = rows.reduce((sum, r) => {
        return sum + (new Date(r.resolvedAt) - new Date(r.createdAt));
      }, 0);
      return Math.round(total / rows.length / 60000); // ms → minutes
    }

    function formatDuration(minutes) {
      if (minutes === null) return null;
      if (minutes < 60)     return `${minutes}m`;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }

    const avgResolutionMin  = avgMinutes(resolvedThisPeriod);
    const avgFulfillmentMin = avgMinutes(sctaskResolvedThisPeriod);

    // ── SLA compliance % ─────────────────────────────────────────────────
    const totalPeriod = await prisma.ticket.count({ where: periodWhere });
    const breachedPeriod = await prisma.ticket.count({
      where: { ...periodWhere, slaBreached: true },
    });
    const slaCompliancePct = totalPeriod > 0
      ? Math.round(((totalPeriod - breachedPeriod) / totalPeriod) * 100)
      : 100;

    // ── Reopen count ─────────────────────────────────────────────────────
    const reopenCount = await prisma.ticketHistory.count({
      where: {
        ticket:    { ...(queueId !== 'all' ? { queueId } : {}) },
        action:    'status_change',
        fromValue: 'RESOLVED',
        toValue:   'OPEN',
        createdAt: { gte: fromDate, lte: toDate },
      },
    });

    return res.status(200).json({
      stats: {
        assigned:          assignedCount,
        open:              openCount,
        unassigned:        unassignedCount,
        onHold:            onHoldCount,
        pending:           pendingCount,
        aging:             agingCount,
        slaBreached:       slaBreachedCount,
        reopen:            reopenCount,
        slaCompliancePct,
        avgResolution:     formatDuration(avgResolutionMin),
        avgResolutionMin,
        avgFulfillment:    formatDuration(avgFulfillmentMin),
        avgFulfillmentMin,
      },
      recentTickets,
      myOpenTickets,
      period: { from: fromDate, to: toDate },
    });

  } catch (err) {
    console.error('[CRM REPORTS QUEUE]', err);
    return res.status(500).json({ error: 'Failed to fetch queue stats' });
  }
}