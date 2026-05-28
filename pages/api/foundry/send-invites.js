// pages/api/foundry/send-invites.js
// POST — sends all invites for a scheduled Foundry.
// FT users: notification + Signal message + calendar event on both sides
// External: email with guest join link

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { createNotification } from '@/lib/notifications/writer';
import { sendFoundryInviteEmail } from '@/lib/foundry/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: 'roomId required' });

  try {
    const room = await prisma.foundryRoom.findUnique({
      where: { roomId },
      include: {
        invitees: true,
        host: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!room) return res.status(404).json({ error: 'Foundry not found' });
    if (room.hostId !== session.user.id) return res.status(403).json({ error: 'Only the host can send invites' });

    const hostName = [room.host.firstName, room.host.lastName].filter(Boolean).join(' ') || 'Your host';
    const scheduledAt = room.scheduledAt;
    const timezone = room.timezone || 'America/New_York';
    const roomUrl = `${process.env.NEXTAUTH_URL}/foundry/${room.roomId}`;
    const guestUrl = `${process.env.NEXTAUTH_URL}/foundry/join/${room.roomId}?code=${room.guestToken}`;

    const dateStr = scheduledAt
      ? new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
        }).format(new Date(scheduledAt))
      : 'Time TBD';

    const results = { ft: [], external: [], errors: [] };

    for (const invitee of room.invitees) {
      try {
        // ── FT User (contact) ──────────────────────────────────────────
        if (invitee.userId) {
          const inviteeUser = await prisma.user.findUnique({
            where: { id: invitee.userId },
            select: { firstName: true, lastName: true, role: true },
          });

          const inviteeName = [inviteeUser?.firstName, inviteeUser?.lastName]
            .filter(Boolean).join(' ') || 'Participant';

          // 1. Notification
          await createNotification({
            userId: invitee.userId,
            actorUserId: session.user.id,
            category: 'CALENDAR',
            scope: inviteeUser?.role === 'SEEKER' ? 'SEEKER' : 'RECRUITER',
            entityType: 'CALENDAR_ITEM',
            entityId: room.roomId,
            dedupeKey: `foundry_invite_${room.roomId}_${invitee.userId}`,
            title: `Foundry invite: ${room.title}`,
            body: `${hostName} invited you to a Foundry session on ${dateStr}`,
            requiresAction: true,
            metadata: { roomId: room.roomId, roomUrl, scheduledAt, timezone },
          });

          // 2. Calendar event — host side (RecruiterCalendarItem or CoachingSession mirror)
          const calDate = scheduledAt ? new Date(scheduledAt) : new Date();
          const timeStr = calDate.toTimeString().slice(0, 5); // HH:MM

          // Host calendar item
          const hostCalItem = await prisma.recruiterCalendarItem.create({
            data: {
              ownerId: session.user.id,
              scope: 'personal',
              date: calDate,
              time: timeStr,
              title: room.title,
              type: 'Interview',
              status: 'Scheduled',
              notes: `Foundry room: ${roomUrl}`,
              candidateType: 'internal',
              candidateUserId: invitee.userId,
              candidateName: inviteeName,
            },
          });

          // 3. Mirror onto invitee's Seeker calendar
          await prisma.seekerCalendarItem.upsert({
            where: {
              // Use a synthetic unique key via findFirst + create/update pattern
              // since there's no unique constraint on source+sourceItemId+userId
              // We use the upsert workaround below
              id: 'noop', // will never match, forces create path
            },
            create: {
              userId: invitee.userId,
              date: calDate,
              time: timeStr,
              title: `Foundry with ${hostName}: ${room.title}`,
              type: 'Interview',
              status: 'Scheduled',
              notes: `Join link: ${roomUrl}`,
			  foundryJoinUrl: roomUrl,
			  enableVideo: true,
              source: 'recruiter',
              sourceItemId: hostCalItem.id,
            },
            update: {}, // never hits
          }).catch(async () => {
            // Fallback: direct create (upsert won't work without a unique constraint match)
            const existing = await prisma.seekerCalendarItem.findFirst({
              where: { source: 'recruiter', sourceItemId: hostCalItem.id, userId: invitee.userId },
            });
            if (!existing) {
              await prisma.seekerCalendarItem.create({
                data: {
                  userId: invitee.userId,
                  date: calDate,
                  time: timeStr,
                  title: `Foundry with ${hostName}: ${room.title}`,
                  type: 'Interview',
                  status: 'Scheduled',
                  notes: `Join link: ${roomUrl}`,
				  foundryJoinUrl: roomUrl,
				  enableVideo: true,
                  source: 'recruiter',
                  sourceItemId: hostCalItem.id,
                },
              });
            }
          });

          // 4. Signal message
          try {
            const { getOrCreateConversation } = await import('@/lib/signal');
            const conv = await getOrCreateConversation(session.user.id, invitee.userId);
            if (conv) {
              await prisma.message.create({
                data: {
                  conversationId: conv.id,
                  senderId: session.user.id,
                  content: `📅 I've sent you a Foundry invite for **${room.title}** on ${dateStr}.\n\nJoin here: ${roomUrl}`,
                },
              });
            }
          } catch {
            // Signal not required — calendar + notification are sufficient
          }

          // Mark invitee as sent
          await prisma.foundryInvitee.update({
            where: { id: invitee.id },
            data: { status: 'PENDING' },
          });

          results.ft.push(invitee.userId);

        // ── External Guest ─────────────────────────────────────────────
        } else if (invitee.email) {
          await sendFoundryInviteEmail({
            to: invitee.email,
            toName: invitee.name || invitee.email,
            hostName,
            sessionTitle: room.title,
            dateStr,
            timezone,
            joinUrl: guestUrl,
          });

          results.external.push(invitee.email);
        }
      } catch (err) {
        console.error(`[foundry/send-invites] failed for invitee ${invitee.id}:`, err);
        results.errors.push(invitee.id);
      }
    }

    // Mark invites as sent on the room
    await prisma.foundryRoom.update({
      where: { id: room.id },
      data: { invitesSentAt: new Date() },
    });

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error('[foundry/send-invites]', err);
    return res.status(500).json({ error: 'Failed to send invites' });
  }
}
