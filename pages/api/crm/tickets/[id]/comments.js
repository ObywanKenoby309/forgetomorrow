// pages/api/crm/tickets/[id]/comments.js
//
// GET  /api/crm/tickets/:id/comments  — list comments on a ticket
// POST /api/crm/tickets/:id/comments  — add a comment (agent note or reply)

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
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

  // Verify ticket exists
  const ticket = await prisma.ticket.findUnique({
    where:  { id },
    select: {
      id:             true,
      number:         true,
      title:          true,
      status:         true,
      priority:       true,
      type:           true,
      queueId:        true,
      assignedToId:   true,
      createdById:    true,
      firstResponseAt: true,
      slaResponseDue:  true,
      slaPolicy:      true,
      tags:           true,
      source:         true,
    },
  });

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  // ─── GET: list comments ──────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const { includeInternal = 'true' } = req.query;

      const where = { ticketId: id };

      // Only show internal notes to employees
      if (includeInternal === 'false') {
        where.isInternal = false;
      }

      const comments = await prisma.ticketComment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
          },
        },
      });

      return res.status(200).json({ comments });
    } catch (err) {
      console.error('[CRM COMMENTS GET]', err);
      return res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  // ─── POST: add comment ───────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const { body, isInternal = false } = req.body || {};

      if (!body || !body.trim()) {
        return res.status(400).json({ error: 'Comment body is required' });
      }

      const comment = await prisma.ticketComment.create({
        data: {
          ticketId:   id,
          authorId:   user.id,
          body:       body.trim(),
          isInternal: Boolean(isInternal),
        },
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      });

      // Set firstResponseAt if this is the first non-internal comment by an agent
      // and the ticket hasn't had a response yet
      if (!isInternal && !ticket.firstResponseAt) {
        const ticketUpdates = { firstResponseAt: new Date() };

        // Mark slaResponseMet
        if (ticket.slaResponseDue) {
          ticketUpdates.slaResponseMet = new Date() <= ticket.slaResponseDue;
        }

        await prisma.ticket.update({
          where: { id },
          data:  ticketUpdates,
        });
      }

      // History entry
      await prisma.ticketHistory.create({
        data: {
          ticketId:  id,
          actorId:   user.id,
          action:    isInternal ? 'note_added' : 'reply_added',
          metadata:  { commentId: comment.id, isInternal },
        },
      });

      // Run COMMENT_ADDED workflows (only for public replies)
      if (!isInternal) {
        await runWorkflows('COMMENT_ADDED', ticket);
      }

      return res.status(201).json({ comment });
    } catch (err) {
      console.error('[CRM COMMENTS POST]', err);
      return res.status(500).json({ error: 'Failed to add comment' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}