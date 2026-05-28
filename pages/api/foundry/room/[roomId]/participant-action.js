// pages/api/foundry/room/[roomId]/participant-action.js
// Host/co-host participant controls: kick, ban, and lock/unlock.
// Immediate in-room actions are sent via Daily app-message from the room page.
// This endpoint records server-side state so banned users cannot rejoin.

import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const { roomId } = req.query;
  const resolvedRoomId = Array.isArray(roomId) ? roomId[0] : roomId;

  const { action, targetUserId, targetName } = req.body || {};
  const normalizedAction = String(action || '').toUpperCase();

  if (!['KICK', 'BAN', 'LOCK'].includes(normalizedAction)) {
    return res.status(400).json({ error: 'Invalid participant action' });
  }

  try {
    const room = await prisma.foundryRoom.findUnique({
      where: { roomId: resolvedRoomId },
      select: {
        id: true,
        hostId: true,
        coHostUserId: true,
        status: true,
        isLocked: true,
      },
    });

    if (!room) return res.status(404).json({ error: 'Foundry not found' });
    if (room.status === 'ENDED') return res.status(410).json({ error: 'ROOM_ENDED' });

    const isHost = room.hostId === session.user.id;
    const isCoHost = room.coHostUserId === session.user.id;

    if (!isHost && !isCoHost) {
      return res.status(403).json({ error: 'Only host or co-host can manage participants' });
    }

    if (normalizedAction === 'LOCK') {
      const updated = await prisma.foundryRoom.update({
        where: { id: room.id },
        data: { isLocked: !room.isLocked },
        select: { isLocked: true },
      });

      return res.status(200).json({
        ok: true,
        action: 'LOCK',
        isLocked: updated.isLocked,
      });
    }

    if (targetUserId && targetUserId === room.hostId) {
      return res.status(400).json({ error: 'Cannot remove the host' });
    }

    if (targetUserId) {
      await prisma.foundryParticipant.updateMany({
        where: {
          roomId: room.id,
          userId: String(targetUserId),
          leftAt: null,
        },
        data: { leftAt: new Date() },
      }).catch(() => {});

      if (normalizedAction === 'BAN') {
        await prisma.foundryLobbyParticipant.upsert({
          where: {
            roomId_userId: {
              roomId: room.id,
              userId: String(targetUserId),
            },
          },
          update: {
            status: 'BANNED',
          },
          create: {
            roomId: room.id,
            userId: String(targetUserId),
            status: 'BANNED',
          },
        }).catch(async () => {
          await prisma.foundryLobbyParticipant.updateMany({
            where: {
              roomId: room.id,
              userId: String(targetUserId),
            },
            data: { status: 'BANNED' },
          }).catch(() => {});
        });
      }
    } else if (normalizedAction === 'BAN' && targetName) {
      // External guests do not have a platform userId. Best-effort ban by display name.
      await prisma.foundryLobbyParticipant.updateMany({
        where: {
          roomId: room.id,
          guestName: String(targetName),
        },
        data: { status: 'BANNED' },
      }).catch(() => {});
    }

    return res.status(200).json({ ok: true, action: normalizedAction });
  } catch (err) {
    console.error('[foundry/participant-action]', err);
    return res.status(500).json({ error: 'Could not perform participant action' });
  }
}
