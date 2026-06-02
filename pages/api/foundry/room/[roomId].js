// pages/api/foundry/room/[roomId].js
// GET  → returns room + participants
// Middleware enforces auth before this runs.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

const FOUNDER_USER_ID = 'cmivpwcf90009bvz0xnck0acv';
const FOUNDER_EMAIL = 'eric.james@forgetomorrow.com';

function isFounderUser(user) {
  return user?.id === FOUNDER_USER_ID || String(user?.email || '').toLowerCase() === FOUNDER_EMAIL;
}


export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const { roomId } = req.query;

  try {
    const room = await prisma.foundryRoom.findUnique({
      where: { roomId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true },
            },
          },
          where: { leftAt: null },
        },
        host: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        coHost: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
        sharedFiles: {
          orderBy: { sharedAt: 'desc' },
        },
        notes: {
          where: { userId: session.user.id },
          take: 1,
        },
      },
    });

    if (!room) return res.status(404).json({ error: 'Foundry not found' });
    if (room.status === 'ENDED') return res.status(410).json({ error: 'This Foundry has ended' });

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, foundryBackground: true },
    });

    // Auto-join if not already a participant
    const alreadyIn = room.participants.find(p => p.userId === session.user.id);
    if (!alreadyIn) {
      await prisma.foundryParticipant.create({
        data: {
          roomId: room.id,
          userId: session.user.id,
          role: 'PARTICIPANT',
          joinedAt: new Date(),
        },
      });
    }

    return res.status(200).json({
      room: {
        id: room.id,
        roomId: room.roomId,
        title: room.title,
        status: room.status,
        startedAt: room.startedAt,
        isRecording: room.isRecording,
        hostId: room.hostId,
        guestToken: room.guestToken || null,
        coHostUserId: room.coHostUserId || null,
        coHost: room.coHost
          ? {
              id: room.coHost.id,
              name: room.coHost.name || [room.coHost.firstName, room.coHost.lastName].filter(Boolean).join(' ') || 'Co-host',
            }
          : null,
        participants: room.participants.map(p => ({
          id: p.userId,
          name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || 'Unknown',
          role: p.role,
          isHost: p.userId === room.hostId,
          micMuted: p.micMuted,
          videoOff: p.videoOff,
        })),
        sharedFiles: room.sharedFiles.map(f => ({
          id: f.id,
          name: f.fileName,
          url: f.fileUrl,
          sharedBy: f.sharedByName,
          ago: relativeTime(f.sharedAt),
        })),
        notes: room.notes[0]?.content || '',
        currentUserFoundryBackground: currentUser?.foundryBackground || 'none',
        currentUserIsFounder: isFounderUser(currentUser),
      },
    });
  } catch (err) {
    console.error('[foundry/room]', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function relativeTime(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
