// pages/api/crm/tickets/index.js
//
// GET  /api/crm/tickets  — list tickets with filters + pagination
// POST /api/crm/tickets  — create a new ticket
//
// Auth: must be logged in + employee:true OR admin role

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { calculateSlaDeadlines } from '@/lib/crm/sla';
import { runWorkflows } from '@/lib/crm/workflow';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // CRM is internal-only — must be employee or admin
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, employee: true, role: true },
  });

  if (!user?.employee && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'CRM access requires employee account' });
  }

  // ─── GET: list tickets ───────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const {
        queueId,
        status,
        priority,
        type,
        assignedToId,
        slaBreached,
        page  = '1',
        limit = '25',
      } = req.query;

      const where = {};
      if (queueId)     where.queueId     = queueId;
      if (status)      where.status      = status;
      if (priority)    where.priority    = priority;
      if (type)        where.type        = type;
      if (assignedToId) where.assignedToId = assignedToId;
      if (slaBreached !== undefined) {
        where.slaBreached = slaBreached === 'true';
      }

      const skip  = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const take  = parseInt(limit, 10);

      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          include: {
            queue:       { select: { id: true, name: true, color: true } },
            assignedTo:  { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            createdBy:   { select: { id: true, firstName: true, lastName: true } },
            requester:   { select: { id: true, firstName: true, lastName: true, email: true } },
            requesterOrg: { select: { id: true, name: true } },
            slaEvents:   { orderBy: { firedAt: 'desc' }, take: 1 },
            _count:      { select: { comments: true, attachments: true } },
          },
        }),
        prisma.ticket.count({ where }),
      ]);

      return res.status(200).json({
        tickets,
        pagination: {
          total,
          page:       parseInt(page, 10),
          limit:      take,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (err) {
      console.error('[CRM TICKETS GET]', err);
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  }

  // ─── POST: create ticket ─────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const {
        type,
        priority = 'P3',
        title,
        description,
        queueId,
        assignedToId,
        requesterId,
        requesterOrgId,
        parentId,
        tags,
        source = 'AGENT',
        externalRef,
      } = req.body || {};

      // Validation
      if (!type)    return res.status(400).json({ error: 'type is required' });
      if (!title)   return res.status(400).json({ error: 'title is required' });
      if (!queueId) return res.status(400).json({ error: 'queueId is required' });

      // Resolve SLA policy — org override beats queue default
      let slaPolicy = null;

      if (requesterOrgId) {
        slaPolicy = await prisma.slaPolicy.findFirst({
          where: { orgId: requesterOrgId },
        });
      }

      if (!slaPolicy) {
        slaPolicy = await prisma.slaPolicy.findUnique({
          where: { queueId },
        });
      }

      // Calculate SLA deadlines
      let slaResponseDue  = null;
      let slaResolveDue   = null;
      let slaPolicyId     = null;

      if (slaPolicy) {
        const deadlines = calculateSlaDeadlines(slaPolicy, priority);
        slaResponseDue  = deadlines.slaResponseDue;
        slaResolveDue   = deadlines.slaResolveDue;
        slaPolicyId     = slaPolicy.id;
      }

      // Create ticket
      const ticket = await prisma.ticket.create({
        data: {
          type,
          priority,
          title,
          description,
          queueId,
          assignedToId:  assignedToId  ?? null,
          createdById:   user.id,
          requesterId:   requesterId   ?? null,
          requesterOrgId: requesterOrgId ?? null,
          parentId:      parentId      ?? null,
          tags:          tags          ?? [],
          source,
          externalRef:   externalRef   ?? null,
          slaPolicyId,
          slaResponseDue,
          slaResolveDue,
          status: assignedToId ? 'ASSIGNED' : 'OPEN',
        },
        include: {
          queue:       { select: { id: true, name: true, color: true } },
          assignedTo:  { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          createdBy:   { select: { id: true, firstName: true, lastName: true } },
          slaPolicy:   true,
        },
      });

      // Audit history — created
      await prisma.ticketHistory.create({
        data: {
          ticketId:  ticket.id,
          actorId:   user.id,
          action:    'created',
          toValue:   ticket.status,
          metadata:  { priority, type, queueId },
        },
      });

      // Run TICKET_CREATED workflows
      await runWorkflows('TICKET_CREATED', ticket);

      return res.status(201).json({ ticket });
    } catch (err) {
      console.error('[CRM TICKETS POST]', err);
      return res.status(500).json({ error: 'Failed to create ticket' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}