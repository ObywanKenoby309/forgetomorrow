// pages/api/recruiter/calendar.js

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function mapDbToEvent(item) {
  if (!item) return null;

  return {
    id: item.id,
    ownerId: item.ownerId,
    scope: item.scope, // 'team' | 'personal'

    // frontend expects plain Y-M-D + time string
    date: item.date.toISOString().slice(0, 10),
    time: item.time || '',

    title: item.title,
    type: item.type,
    status: item.status,
    notes: item.notes || '',

    candidateType: item.candidateType,       // 'internal' | 'external'
    candidateUserId: item.candidateUserId,
    candidateName: item.candidateName,

    company: item.company || '',
    jobTitle: item.jobTitle || '',
    req: item.req || '',
  };
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ───────────────── GET: list items for this recruiter ────────────────
    if (req.method === 'GET') {
      const items = await prisma.recruiterCalendarItem.findMany({
        where: { ownerId: userId },
        orderBy: { date: 'asc' },
      });

      const events = items.map(mapDbToEvent).filter(Boolean);
      return res.status(200).json({ events });
    }

    // Extract shared payload fields
    const {
      id,
      title,
      date,
      time,
      type,
      status,
      notes,
      candidateType,
      candidateUserId,
      candidateName,
      scope,
      company,
      jobTitle,
      req: reqCode, // avoid shadowing `req` object
    } = req.body || {};

    // ───────────────── POST / PUT: create or update item ────────────────
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!title || !date) {
        return res
          .status(400)
          .json({ error: 'Missing required fields: title, date' });
      }

      const safeScope =
        scope === 'personal' || scope === 'team' ? scope : 'team';

      const safeCandidateType =
        candidateType === 'internal' || candidateType === 'external'
          ? candidateType
          : 'external';

      const safeTime = time || '09:00';
      const dateTime = new Date(`${date}T${safeTime}:00Z`);

      let item;

      if (req.method === 'POST' || !id) {
        // Create new calendar item
        item = await prisma.recruiterCalendarItem.create({
          data: {
            ownerId: userId,
            scope: safeScope,
            date: dateTime,
            time: safeTime,
            title,
            type: type || 'Interview',
            status: status || 'Scheduled',
            notes: notes || null,

            candidateType: safeCandidateType,
            candidateUserId:
              safeCandidateType === 'internal' && candidateUserId
                ? candidateUserId
                : null,
            candidateName: candidateName || 'Candidate',

            company: company || null,
            jobTitle: jobTitle || null,
            req: reqCode || null,
          },
        });
      } else {
        // Update existing calendar item — but only if it belongs to this recruiter
        item = await prisma.recruiterCalendarItem.update({
          where: {
            id,
          },
          data: {
            scope: safeScope,
            date: dateTime,
            time: safeTime,
            title,
            type: type || 'Interview',
            status: status || 'Scheduled',
            notes: notes || null,

            candidateType: safeCandidateType,
            candidateUserId:
              safeCandidateType === 'internal' && candidateUserId
                ? candidateUserId
                : null,
            candidateName: candidateName || 'Candidate',

            company: company || null,
            jobTitle: jobTitle || null,
            req: reqCode || null,
          },
        });
      }

      const event = mapDbToEvent(item);
      return res.status(200).json({ event });
    }

    // ───────────────── DELETE: remove item ────────────────
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'Missing id' });
      }

      // Ensure recruiter can only delete their own items
      await prisma.recruiterCalendarItem.delete({
        where: { id },
      });

      return res.status(200).json({ ok: true });
    }

    // ───────────────── Method not allowed ────────────────
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Recruiter calendar API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
