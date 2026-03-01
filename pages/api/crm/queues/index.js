// pages/api/crm/queues/index.js
//
// GET  /api/crm/queues  — list all active queues (for dropdowns + queue selector)
// POST /api/crm/queues  — create a new queue (admin only)

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

  // ─── GET: list queues ────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { includeInactive = 'false', withStats = 'false' } = req.query;

      const where = includeInactive === 'true' ? {} : { isActive: true };

      const queues = await prisma.queue.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          slaPolicy: {
            select: {
              id: true, name: true,
              p1ResponseMin: true, p2ResponseMin: true,
              p3ResponseMin: true, p4ResponseMin: true,
              warningThreshold: true, useBusinessHours: true,
            },
          },
          _count: {
            select: { agents: true },
          },
        },
      });

      // Optionally include open ticket counts per queue
      let statsMap = {};
      if (withStats === 'true') {
        const stats = await prisma.ticket.groupBy({
          by:     ['queueId'],
          where:  { status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] } },
          _count: { id: true },
        });
        statsMap = Object.fromEntries(stats.map((s) => [s.queueId, s._count.id]));
      }

      const result = queues.map((q) => ({
        ...q,
        openTicketCount: statsMap[q.id] ?? null,
      }));

      return res.status(200).json({ queues: result });
    } catch (err) {
      console.error('[CRM QUEUES GET]', err);
      return res.status(500).json({ error: 'Failed to fetch queues' });
    }
  }

  // ─── POST: create queue (admin only) ─────────────────────────────────────
  if (req.method === 'POST') {
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create queues' });
    }

    try {
      const { name, description, color, icon } = req.body || {};

      if (!name?.trim()) {
        return res.status(400).json({ error: 'Queue name is required' });
      }

      const queue = await prisma.queue.create({
        data: {
          name:        name.trim(),
          description: description ?? null,
          color:       color       ?? null,
          icon:        icon        ?? null,
          isActive:    true,
        },
      });

      return res.status(201).json({ queue });
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: `Queue '${req.body?.name}' already exists` });
      }
      console.error('[CRM QUEUES POST]', err);
      return res.status(500).json({ error: 'Failed to create queue' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}