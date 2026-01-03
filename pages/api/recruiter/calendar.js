// pages/api/recruiter/calendar.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

function readCookie(req, name) {
  try {
    const raw = req.headers?.cookie || '';
    const parts = raw.split(';').map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + '=')) return decodeURIComponent(p.slice(name.length + 1));
    }
    return '';
  } catch {
    return '';
  }
}

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
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
    },
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
    const realUserId = session?.user?.id;

    if (!realUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // ✅ Impersonation-aware effective user (Platform Admin only)
    let effectiveUserId = realUserId;
    const isPlatformAdmin = !!session?.user?.isPlatformAdmin;

    if (isPlatformAdmin) {
      const imp = readCookie(req, 'ft_imp');
      if (imp) {
        try {
          const decoded = jwt.verify(
            imp,
            process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production'
          );
          if (decoded && typeof decoded === 'object' && decoded.targetUserId) {
            effectiveUserId = String(decoded.targetUserId);
          }
        } catch {
          // ignore invalid/expired cookie
        }
      }
    }

    // ───────────────── GET: list items for this recruiter ────────────────
    if (req.method === 'GET') {
      const [items, inboundMirrors] = await Promise.all([
        prisma.recruiterCalendarItem.findMany({
          where: { ownerId: effectiveUserId },
          orderBy: { date: 'asc' },
        }),
        prisma.seekerCalendarItem.findMany({
          where: {
            userId: effectiveUserId,
            source: 'coach',
          },
          orderBy: { date: 'asc' },
        }),
      ]);

      const events = items.map(mapDbToEvent).filter(Boolean);

      // Map inbound coach invites (mirrored in SeekerCalendarItem) into event shape
      const inboundEvents = inboundMirrors
        .map((mirror) => {
          // Treat these as personal scope items for display in recruiter calendar
          const dbShape = {
            id: mirror.id,
            ownerId: effectiveUserId,
            scope: 'personal',
            date: mirror.date,
            time: mirror.time || '09:00',
            title: mirror.title || 'Coaching session',
            type: mirror.type || 'Interview',
            status: mirror.status || 'Scheduled',
            notes: mirror.notes || '',
            candidateType: 'external',
            candidateUserId: null,
            candidateName: '',
            company: '',
            jobTitle: '',
            req: '',
          };
          return mapDbToEvent(dbShape);
        })
        .filter(Boolean);

      return res.status(200).json({ events: [...events, ...inboundEvents] });
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

        if (!existing || existing.ownerId !== effectiveUserId) {
          return res.status(404).json({ error: 'Item not found' });
        }

        previousCandidateUserId = existing.candidateUserId;
        previousCandidateType = existing.candidateType;

        // Update existing calendar item - but only if it belongs to this recruiter
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
            ownerId: effectiveUserId,
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

      // ✅ Ensure recruiter can only delete their own items (effective user)
      const existing = await prisma.recruiterCalendarItem.findUnique({
        where: { id },
        select: { ownerId: true },
      });

      if (!existing || existing.ownerId !== effectiveUserId) {
        return res.status(404).json({ error: 'Item not found' });
      }

      // Clean up mirrored candidate calendar entries
      await prisma.seekerCalendarItem.deleteMany({
        where: {
          source: 'recruiter',
          sourceItemId: id,
        },
      });

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
