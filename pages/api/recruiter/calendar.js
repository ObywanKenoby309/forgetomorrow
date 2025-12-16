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

    candidateType: item.candidateType, // 'internal' | 'external'
    candidateUserId: item.candidateUserId,
    candidateName: item.candidateName,

    company: item.company || '',
    jobTitle: item.jobTitle || '',
    req: item.req || '',
  };
}

/**
 * Mirror recruiter calendar item into candidate's personal calendar (SeekerCalendarItem)
 * when candidate is INTERNAL.
 * - source = 'recruiter'
 * - sourceItemId = item.id
 */
async function syncRecruiterItemToSeekerCalendar(item, opts = {}) {
  const {
    previousCandidateUserId = null,
    previousCandidateType = null,
  } = opts;

  const itemId = item.id;
  const candidateId = item.candidateUserId || null;
  const candidateType = item.candidateType || 'external';

  // If previous internal candidate changed, clear their mirror
  if (
    previousCandidateUserId &&
    previousCandidateType === 'internal' &&
    previousCandidateUserId !== candidateId
  ) {
    await prisma.seekerCalendarItem.deleteMany({
      where: {
        source: 'recruiter',
        sourceItemId: itemId,
        userId: previousCandidateUserId,
      },
    });
  }

  // If no current internal candidate, ensure mirrors are gone
  if (!candidateId || candidateType !== 'internal') {
    await prisma.seekerCalendarItem.deleteMany({
      where: {
        source: 'recruiter',
        sourceItemId: itemId,
      },
    });
    return;
  }

  // Look up owner (recruiter) + candidate for naming
  const ids = [item.ownerId, candidateId];
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, firstName: true, lastName: true, email: true },
  });

  const owner = users.find((u) => u.id === item.ownerId);
  const candidate = users.find((u) => u.id === candidateId);

  const ownerName =
    owner?.name ||
    `${owner?.firstName || ''} ${owner?.lastName || ''}`.trim() ||
    owner?.email ||
    'Recruiter';

  // Build a nice title for the candidate's calendar
  const baseType = item.type || 'Interview';
  const baseTitle =
    baseType === 'Interview' || baseType === 'Screen'
      ? `${baseType} with ${ownerName}`
      : `${baseType} with ${ownerName}`;

  let jobContext = '';
  if (item.jobTitle && item.company) {
    jobContext = `${item.jobTitle} @ ${item.company}`;
  } else if (item.jobTitle) {
    jobContext = item.jobTitle;
  } else if (item.company) {
    jobContext = item.company;
  }

  const title = jobContext ? `${baseTitle} – ${jobContext}` : baseTitle;

  const time = item.time || '09:00';

  // Find existing mirror (if any)
  const existing = await prisma.seekerCalendarItem.findFirst({
    where: {
      source: 'recruiter',
      sourceItemId: itemId,
      userId: candidateId,
    },
  });

  const baseData = {
    userId: candidateId,
    date: item.date,
    time,
    title,
    type: baseType,
    status: item.status || 'Scheduled',
    notes: existing?.notes || '',
    source: 'recruiter',
    sourceItemId: itemId,
  };

  if (existing) {
    await prisma.seekerCalendarItem.update({
      where: { id: existing.id },
      data: baseData,
    });
  } else {
    await prisma.seekerCalendarItem.create({
      data: baseData,
    });
  }
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
      let previousCandidateUserId = null;
      let previousCandidateType = null;

      if (req.method === 'PUT' && id) {
        const existing = await prisma.recruiterCalendarItem.findUnique({
          where: { id },
          select: {
            candidateUserId: true,
            candidateType: true,
            ownerId: true,
          },
        });

        if (!existing || existing.ownerId !== userId) {
          return res.status(404).json({ error: 'Item not found' });
        }

        previousCandidateUserId = existing.candidateUserId;
        previousCandidateType = existing.candidateType;

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
      } else {
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
      }

      // Mirror to candidate's personal calendar if internal
      await syncRecruiterItemToSeekerCalendar(item, {
        previousCandidateUserId,
        previousCandidateType,
      });

      const event = mapDbToEvent(item);
      return res.status(200).json({ event });
    }

    // ───────────────── DELETE: remove item ────────────────
    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ error: 'Missing id' });
      }

      // Clean up mirrored candidate calendar entries
      await prisma.seekerCalendarItem.deleteMany({
        where: {
          source: 'recruiter',
          sourceItemId: id,
        },
      });

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
