// pages/api/appointments/request.ts
//
// POST — creates an AppointmentRequest from a seeker to a coach
//         via the Hearth Spotlight "Book" CTA.
//
// Body:
//   coachId        String   — userId of the coach
//   spotlightId    String   — HearthSpotlight id
//   preferredSlots String[] — array of ISO datetime strings (1–3)
//   timezone       String   — IANA timezone string e.g. "America/New_York"
//   message        String?  — optional note from requester

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const requesterId = session.user.id;
  const { coachId, spotlightId, preferredSlots, timezone, message } = req.body || {};

  // ── Validate ───────────────────────────────────────────────────────────────
  if (!coachId || typeof coachId !== 'string') {
    return res.status(400).json({ error: 'coachId is required' });
  }
  if (!spotlightId || typeof spotlightId !== 'string') {
    return res.status(400).json({ error: 'spotlightId is required' });
  }
  if (!Array.isArray(preferredSlots) || preferredSlots.length === 0) {
    return res.status(400).json({ error: 'At least one preferred time slot is required' });
  }
  if (preferredSlots.length > 3) {
    return res.status(400).json({ error: 'Maximum 3 preferred time slots allowed' });
  }
  if (!timezone || typeof timezone !== 'string') {
    return res.status(400).json({ error: 'Timezone is required' });
  }
  if (requesterId === coachId) {
    return res.status(400).json({ error: 'You cannot request a session with yourself' });
  }

  // Validate all slots are parseable ISO dates
  for (const slot of preferredSlots) {
    if (isNaN(Date.parse(slot))) {
      return res.status(400).json({ error: `Invalid date format: ${slot}` });
    }
  }

  try {
    // Confirm spotlight exists and belongs to this coach
    const spotlight = await prisma.hearthSpotlight.findFirst({
      where: { id: spotlightId, userId: coachId },
    });
    if (!spotlight) {
      return res.status(404).json({ error: 'Spotlight not found' });
    }

    // Check for existing pending request from this requester to this coach
    const existing = await prisma.appointmentRequest.findFirst({
      where: {
        coachId,
        requesterId,
        spotlightId,
        status: 'PENDING',
      },
    });
    if (existing) {
      return res.status(409).json({
        error: 'You already have a pending request with this coach.',
        existingId: existing.id,
      });
    }

    // Create ContactRequest + AppointmentRequest atomically
    const { appt } = await prisma.$transaction(async (tx) => {
      // Upsert ContactRequest — COACHING_REQUEST type
      let contactRequest = await tx.contactRequest.findFirst({
        where: { fromUserId: requesterId, toUserId: coachId },
      });
      if (!contactRequest) {
        contactRequest = await tx.contactRequest.create({
          data: {
            fromUserId: requesterId,
            toUserId:   coachId,
            status:     'PENDING',
            type:       'COACHING_REQUEST',
          },
        });
      }

      const appt = await tx.appointmentRequest.create({
        data: {
          coachId,
          requesterId,
          spotlightId,
          preferredSlots,
          timezone,
          message:          message?.trim() || null,
          status:           'PENDING',
          contactRequestId: contactRequest.id,
        },
      });

      return { appt, contactRequest };
    });

    // ── Notify coach (wrapped in try/catch — must never crash the request) ──
    try {
      const requesterUser = await prisma.user.findUnique({
        where: { id: requesterId },
        select: { firstName: true, lastName: true, name: true },
      });
      const requesterName =
        requesterUser?.firstName
          ? `${requesterUser.firstName} ${requesterUser.lastName || ''}`.trim()
          : requesterUser?.name || 'Someone';

      await prisma.notification.create({
        data: {
          userId:     coachId,
          scope:      'COACH',
          category:   'CALENDAR',
          title:      'New session request',
          body:       `${requesterName} has requested a coaching session with you.`,
          entityType: 'APPOINTMENT_REQUEST',
          entityId:   appt.id,
          dedupeKey:  `appointment_request_${appt.id}`,
          metadata:   { actionUrl: '/dashboard/coaching/sessions', appointmentRequestId: appt.id },
        },
      });
    } catch (notifyErr) {
      console.error('[appointments/request] notification failed:', notifyErr);
    }

    return res.status(201).json({ appointmentRequest: appt });
  } catch (err) {
    console.error('[appointments/request] error:', err);
    return res.status(500).json({ error: 'Failed to submit appointment request' });
  }
}