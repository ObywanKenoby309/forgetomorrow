// pages/api/foundry/schedule.js
// POST /api/foundry/schedule — create a scheduled Foundry room
// POST /api/foundry/schedule/send — send invites to all invitees

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { createDailyRoom } from '@/lib/foundry/daily';
import { createNotification } from '@/lib/notifications/writer';
import { sendFoundryInviteEmail } from '@/lib/foundry/email';

const CAN_HOST = ['COACH', 'RECRUITER', 'ADMIN', 'OWNER', 'SITE_ADMIN'];

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, firstName: true, lastName: true, email: true },
  });

  if (!CAN_HOST.includes(user?.role)) {
    return res.status(403).json({ error: 'Only coaches and recruiters can schedule a Foundry.' });
  }

  const hostName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Your host';

  // ── POST: Create scheduled room ──────────────────────────────────────
  if (req.method === 'POST') {
    const { title, scheduledAt, timezone, invitees } = req.body;
    // invitees: [{ userId, name } | { email, name }]

    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!scheduledAt) return res.status(400).json({ error: 'Scheduled time is required' });
    if (!invitees?.length) return res.status(400).json({ error: 'At least one invitee is required' });

    // Validate FT invitees are contacts
    const ftInvitees = invitees.filter(i => i.userId);
    if (ftInvitees.length > 0) {
      const contacts = await prisma.contact.findMany({
        where: {
          userId: session.user.id,
          contactUserId: { in: ftInvitees.map(i => i.userId) },
        },
        select: { contactUserId: true },
      });
      const contactIds = new Set(contacts.map(c => c.contactUserId));
      const nonContacts = ftInvitees.filter(i => !contactIds.has(i.userId));
      if (nonContacts.length > 0) {
        return res.status(403).json({
          error: `Some invitees are not in your contacts: ${nonContacts.map(i => i.name).join(', ')}`,
        });
      }
    }

    try {
      const roomId = nanoid(10);
      const guestToken = nanoid(16); // for external join links

      // Create Daily room
      const dailyRoom = await createDailyRoom(roomId);

      // Create FoundryRoom with SCHEDULED status
      const room = await prisma.foundryRoom.create({
        data: {
          roomId,
          title: title.trim(),
          hostId: session.user.id,
          status: 'SCHEDULED',
          scheduledAt: new Date(scheduledAt),
          timezone: timezone || 'America/New_York',
          guestToken,
          dailyRoomName: dailyRoom.name,
          dailyRoomUrl: dailyRoom.url,
        },
      });

      // Auto-join host as participant
      await prisma.foundryParticipant.create({
        data: {
          roomId: room.id,
          userId: session.user.id,
          role: 'HOST',
          joinedAt: new Date(),
        },
      });

      // Create invitee records
      await prisma.foundryInvitee.createMany({
        data: invitees.map(i => ({
          roomId: room.id,
          userId: i.userId || null,
          email: i.email || null,
          name: i.name || null,
          status: 'PENDING',
        })),
      });

      return res.status(200).json({ roomId, guestToken });
    } catch (err) {
      console.error('[foundry/schedule]', err);
      return res.status(500).json({ error: 'Could not schedule Foundry' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
