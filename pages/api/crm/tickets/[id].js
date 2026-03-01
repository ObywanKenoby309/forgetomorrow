// pages/api/crm/tickets/[id].js
//
// GET   /api/crm/tickets/:id  — fetch single ticket with full detail
// PATCH /api/crm/tickets/:id  — update ticket (status, priority, assignment, etc.)

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

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, employee: true, role: true },
  });

  if (!user?.employee && user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'CRM access requires employee account' });
  }

  const { id } = req.query;

  // ─── GET: single ticket ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const ticket = await prisma.ticket.findUnique({
        where:   { id },
        include: {
          queue:        { select: { id: true, name: true, color: true, icon: true } },
          assignedTo:   { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          createdBy:    { select: { id: true, firstName: true, lastName: true } },
          requester:    { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
          requesterOrg: { select: { id: true, name: true } },
          slaPolicy:    true,
          comments: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
            },
          },
          history: {
            orderBy: { createdAt: 'desc' },
            include: {
              actor: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          attachments: {
            orderBy: { createdAt: 'desc' },
            include: {
              uploadedBy: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          slaEvents:  { orderBy: { firedAt: 'desc' } },
          children:   { select: { id: true, number: true, title: true, status: true, priority: true, type: true } },
          parent:     { select: { id: true, number: true, title: true, status: true } },
        },
      });

      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      return res.status(200).json({ ticket });
    } catch (err) {
      console.error('[CRM TICKET GET]', err);
      return res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  }

  // ─── PATCH: update ticket ────────────────────────────────────────────────
  if (req.method === 'PATCH') {
    try {
      const existing = await prisma.ticket.findUnique({
        where:   { id },
        include: { slaPolicy: true },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Ticket not found' });
      }

      const {
        status,
        priority,
        assignedToId,
        queueId,
        title,
        description,
        tags,
        externalRef,
      } = req.body || {};

      const data    = {};
      const history = [];

      // Status change
      if (status && status !== existing.status) {
        data.status = status;
        history.push({ action: 'status_change', fromValue: existing.status, toValue: status });

        if (status === 'RESOLVED') {
          data.resolvedAt = new Date();
          // Mark SLA resolve met/missed
          data.slaResolveMet = existing.slaResolveDue
            ? new Date() <= existing.slaResolveDue
            : null;
        }

        if (status === 'CLOSED') {
          data.closedAt = new Date();
        }

        // If reopening — clear resolvedAt
        if (status === 'OPEN' || status === 'IN_PROGRESS') {
          if (existing.status === 'RESOLVED') {
            data.resolvedAt    = null;
            data.slaResolveMet = null;
          }
        }
      }

      // Priority change — recalculate SLA deadlines
      if (priority && priority !== existing.priority) {
        data.priority = priority;
        history.push({ action: 'priority_change', fromValue: existing.priority, toValue: priority });

        const policy = existing.slaPolicy;
        if (policy) {
          const deadlines    = calculateSlaDeadlines(policy, priority);
          data.slaResponseDue = deadlines.slaResponseDue;
          data.slaResolveDue  = deadlines.slaResolveDue;
          data.slaBreached    = false; // reset breach on priority change
        }
      }

      // Assignment change
      if (assignedToId !== undefined && assignedToId !== existing.assignedToId) {
        data.assignedToId = assignedToId ?? null;
        history.push({
          action:    'reassigned',
          fromValue: existing.assignedToId ?? 'unassigned',
          toValue:   assignedToId          ?? 'unassigned',
        });

        // Auto-set status to ASSIGNED if currently OPEN
        if (assignedToId && existing.status === 'OPEN') {
          data.status = 'ASSIGNED';
        }
      }

      // Queue transfer
      if (queueId && queueId !== existing.queueId) {
        data.queueId      = queueId;
        data.assignedToId = null; // clear on transfer
        history.push({ action: 'queue_transfer', fromValue: existing.queueId, toValue: queueId });
      }

      // Simple field updates
      if (title       !== undefined) data.title       = title;
      if (description !== undefined) data.description = description;
      if (tags        !== undefined) data.tags        = tags;
      if (externalRef !== undefined) data.externalRef = externalRef;

      // Nothing to update
      if (Object.keys(data).length === 0) {
        return res.status(200).json({ ticket: existing });
      }

      const updated = await prisma.ticket.update({
        where:   { id },
        data,
        include: {
          queue:       { select: { id: true, name: true, color: true } },
          assignedTo:  { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          slaPolicy:   true,
        },
      });

      // Write all history entries
      if (history.length > 0) {
        await prisma.ticketHistory.createMany({
          data: history.map((h) => ({
            ticketId:  id,
            actorId:   user.id,
            action:    h.action,
            fromValue: h.fromValue ?? null,
            toValue:   h.toValue   ?? null,
            metadata:  { source: 'agent' },
          })),
        });
      }

      // Run relevant workflows
      if (data.status)      await runWorkflows('STATUS_CHANGED',   updated);
      if (data.priority)    await runWorkflows('PRIORITY_CHANGED', updated);
      if (data.assignedToId !== undefined) {
        await runWorkflows(data.assignedToId ? 'ASSIGNED' : 'UNASSIGNED_FOR', updated);
      }

      await runWorkflows('TICKET_UPDATED', updated);

      return res.status(200).json({ ticket: updated });
    } catch (err) {
      console.error('[CRM TICKET PATCH]', err);
      return res.status(500).json({ error: 'Failed to update ticket' });
    }
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'Method not allowed' });
}