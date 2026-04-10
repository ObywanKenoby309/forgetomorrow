// pages/api/appointments/respond.ts
//
// POST — coach responds to an AppointmentRequest
//
// Body:
//   appointmentRequestId  String
//   action                'CONFIRM' | 'SUGGEST' | 'DECLINE'
//   confirmedTime         String?   — ISO datetime, required for CONFIRM
//   suggestedTime         String?   — ISO datetime, required for SUGGEST
//   coachNotes            String?   — optional note to seeker
//
// On CONFIRM, atomically:
//   1. AppointmentRequest → CONFIRMED
//   2. ContactRequest → ACCEPTED (or created+accepted if missing)
//   3. CoachingClient record created
//   4. CoachingSession created with confirmedTime
//   5. Ghost conversation created (coach + seeker, channel: 'coach')
//   6. Seeker notified
//
// On SUGGEST:
//   1. AppointmentRequest → RESCHEDULED, suggestedAt saved
//   2. Seeker notified with suggested time
//
// On DECLINE:
//   1. AppointmentRequest → DECLINED
//   2. ContactRequest → DECLINED (if exists)
//   3. Seeker notified

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

  const coachId = session.user.id;
  const { appointmentRequestId, action, confirmedTime, suggestedTime, coachNotes } = req.body || {};

  // ── Validate ───────────────────────────────────────────────────────────────
  if (!appointmentRequestId || typeof appointmentRequestId !== 'string') {
    return res.status(400).json({ error: 'appointmentRequestId is required' });
  }
  if (!['CONFIRM', 'SUGGEST', 'DECLINE'].includes(action)) {
    return res.status(400).json({ error: 'action must be CONFIRM, SUGGEST, or DECLINE' });
  }
  if (action === 'CONFIRM' && !confirmedTime) {
    return res.status(400).json({ error: 'confirmedTime is required for CONFIRM' });
  }
  if (action === 'SUGGEST' && !suggestedTime) {
    return res.status(400).json({ error: 'suggestedTime is required for SUGGEST' });
  }

  try {
    // Load the appointment request — verify it belongs to this coach
    const appt = await prisma.appointmentRequest.findFirst({
      where: { id: appointmentRequestId, coachId },
      include: {
        requester: {
          select: {
            id: true, name: true, firstName: true, lastName: true,
            email: true, slug: true,
          },
        },
        coach: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
      },
    });

    if (!appt) {
      return res.status(404).json({ error: 'Appointment request not found' });
    }
    if (appt.status !== 'PENDING' && appt.status !== 'RESCHEDULED') {
      return res.status(409).json({ error: `Request is already ${appt.status}` });
    }

    const requesterId = appt.requesterId;
    const requesterName = appt.requester.firstName
      ? `${appt.requester.firstName} ${appt.requester.lastName || ''}`.trim()
      : appt.requester.name || 'Someone';
    const coachName = appt.coach.firstName
      ? `${appt.coach.firstName} ${appt.coach.lastName || ''}`.trim()
      : appt.coach.name || 'Your coach';

    // ── DECLINE ────────────────────────────────────────────────────────────
    if (action === 'DECLINE') {
      await prisma.appointmentRequest.update({
        where: { id: appointmentRequestId },
        data: { status: 'DECLINED', coachNotes: coachNotes?.trim() || null },
      });

      // Decline the linked ContactRequest if it exists
      if (appt.contactRequestId) {
        await prisma.contactRequest.update({
          where: { id: appt.contactRequestId },
          data: { status: 'DECLINED' },
        }).catch(() => {});
      }

      // Notify seeker
      try {
        await prisma.notification.create({
          data: {
            userId:     requesterId,
            scope:      'SEEKER',
            category:   'CALENDAR',
            title:      'Session request declined',
            body:       `${coachName} was unable to accept your session request at this time.`,
            entityType: 'APPOINTMENT_REQUEST',
            entityId:   appt.id,
            dedupeKey:  `appt_declined_${appt.id}`,
            metadata:   { actionUrl: '/the-hearth?module=mentorship' },
          },
        });
      } catch (e) {
        console.error('[appointments/respond] decline notify failed:', e);
      }

      return res.status(200).json({ status: 'DECLINED' });
    }

    // ── SUGGEST ANOTHER TIME ───────────────────────────────────────────────
    if (action === 'SUGGEST') {
      const suggestedDate = new Date(suggestedTime);
      if (isNaN(suggestedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid suggestedTime format' });
      }

      await prisma.appointmentRequest.update({
        where: { id: appointmentRequestId },
        data: {
          status:      'RESCHEDULED',
          suggestedAt: suggestedDate,
          coachNotes:  coachNotes?.trim() || null,
        },
      });

      // Notify seeker with proposed time
      try {
        const friendlyTime = suggestedDate.toLocaleString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit',
        });
        await prisma.notification.create({
          data: {
            userId:     requesterId,
            scope:      'SEEKER',
            category:   'CALENDAR',
            title:      'Coach suggested a new time',
            body:       `${coachName} proposed ${friendlyTime} for your session.`,
            entityType: 'APPOINTMENT_REQUEST',
            entityId:   appt.id,
            dedupeKey:  `appt_suggested_${appt.id}_${suggestedDate.getTime()}`,
            metadata:   {
              actionUrl:     '/dashboard/appointments',
              suggestedTime: suggestedTime,
              coachNotes:    coachNotes?.trim() || null,
            },
          },
        });
      } catch (e) {
        console.error('[appointments/respond] suggest notify failed:', e);
      }

      return res.status(200).json({ status: 'RESCHEDULED', suggestedAt: suggestedDate });
    }

    // ── CONFIRM ────────────────────────────────────────────────────────────
    const confirmedDate = new Date(confirmedTime);
    if (isNaN(confirmedDate.getTime())) {
      return res.status(400).json({ error: 'Invalid confirmedTime format' });
    }

    // Run everything atomically
    const result = await prisma.$transaction(async (tx) => {

      // 1. Update AppointmentRequest → CONFIRMED
      const confirmedAppt = await tx.appointmentRequest.update({
        where: { id: appointmentRequestId },
        data: { status: 'CONFIRMED', coachNotes: coachNotes?.trim() || null },
      });

      // 2. Accept ContactRequest (or create+accept if missing)
      if (appt.contactRequestId) {
        await tx.contactRequest.update({
          where: { id: appt.contactRequestId },
          data: { status: 'ACCEPTED' },
        }).catch(() => {});
      } else {
        // Upsert in case one already exists
        const existing = await tx.contactRequest.findFirst({
          where: { fromUserId: requesterId, toUserId: coachId },
        });
        if (existing) {
          await tx.contactRequest.update({
            where: { id: existing.id },
            data: { status: 'ACCEPTED' },
          });
        } else {
          await tx.contactRequest.create({
            data: {
              fromUserId: requesterId,
              toUserId:   coachId,
              status:     'ACCEPTED',
              type:       'COACHING_REQUEST',
            },
          });
        }
      }

      // 3. Ensure Contact record exists in both directions
      await tx.contact.upsert({
        where: { userId_contactUserId: { userId: coachId, contactUserId: requesterId } },
        create: { userId: coachId, contactUserId: requesterId },
        update: {},
      });
      await tx.contact.upsert({
        where: { userId_contactUserId: { userId: requesterId, contactUserId: coachId } },
        create: { userId: requesterId, contactUserId: coachId },
        update: {},
      });

      // 4. Create CoachingClient record (if not already one)
      let coachingClient = await tx.coachingClient.findFirst({
        where: { coachId, clientId: requesterId },
      });
      if (!coachingClient) {
        const requesterUser = await tx.user.findUnique({
          where: { id: requesterId },
          select: { name: true, firstName: true, lastName: true, email: true },
        });
        const clientName = requesterUser?.firstName
          ? `${requesterUser.firstName} ${requesterUser.lastName || ''}`.trim()
          : requesterUser?.name || 'Client';
        coachingClient = await tx.coachingClient.create({
          data: {
            coachId,
            clientId:    requesterId,
            name:        clientName,
            email:       requesterUser?.email || null,
            status:      'New Intake',
            lastContact: new Date(),
          },
        });
      }

      // 5. Create CoachingSession
      const coachingSession = await tx.coachingSession.create({
        data: {
          coachId,
          clientId:        requesterId,
          coachingClientId: coachingClient.id,
          startAt:         confirmedDate,
          status:          'Scheduled',
          type:            'Strategy',
          notes:           coachNotes?.trim() || null,
        },
      });

      // 6. Create ghost conversation (coach channel, seeker can't see until coach messages)
      const existingConvo = await tx.conversation.findFirst({
        where: {
          channel: 'coach',
          participants: {
            every: { userId: { in: [coachId, requesterId] } },
          },
        },
        include: { participants: true },
      });

      let conversationId: number;
      if (existingConvo && existingConvo.participants.length === 2) {
        conversationId = existingConvo.id;
      } else {
        const convo = await tx.conversation.create({
          data: {
            channel: 'coach',
            title:   `${requesterName} — Coaching`,
            participants: {
              create: [
                { userId: coachId,      role: 'coach'  },
                { userId: requesterId,  role: 'client' },
              ],
            },
          },
        });
        conversationId = convo.id;
      }

      return { confirmedAppt, coachingClient, coachingSession, conversationId };
    });

    // 7. Notify seeker (outside transaction — must never crash it)
    try {
      const friendlyTime = confirmedDate.toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
      });
      await prisma.notification.create({
        data: {
          userId:     requesterId,
          scope:      'SEEKER',
          category:   'CALENDAR',
          title:      'Session confirmed!',
          body:       `${coachName} confirmed your session for ${friendlyTime}.`,
          entityType: 'APPOINTMENT_REQUEST',
          entityId:   appt.id,
          dedupeKey:  `appt_confirmed_${appt.id}`,
          metadata:   {
            actionUrl:      '/dashboard/coaching/sessions',
            conversationId: result.conversationId,
            sessionId:      result.coachingSession.id,
          },
        },
      });
    } catch (e) {
      console.error('[appointments/respond] confirm notify failed:', e);
    }

    return res.status(200).json({
      status:         'CONFIRMED',
      coachingClient: result.coachingClient,
      sessionId:      result.coachingSession.id,
      conversationId: result.conversationId,
    });

  } catch (err) {
    console.error('[appointments/respond] error:', err);
    return res.status(500).json({ error: 'Failed to process response' });
  }
}