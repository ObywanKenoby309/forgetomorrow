// pages/api/foundry/room/[roomId]/share-file.js
// Records and returns files shared into the Foundry session workspace.
// source: 'FORGE' (platform doc) or 'COMPUTER' (upload)

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

function relativeTime(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function normalizeFile(file) {
  return {
    id: file.id,
    name: file.fileName,
    url: file.fileUrl,
    sharedBy: file.sharedByName || 'Unknown',
    ago: relativeTime(file.sharedAt),
    source: file.source || 'COMPUTER',
  };
}

export default async function handler(req, res) {
  const { roomId } = req.query;
  const resolvedRoomId = Array.isArray(roomId) ? roomId[0] : roomId;

  if (req.method === 'GET') {
    try {
      const room = await prisma.foundryRoom.findUnique({
        where: { roomId: resolvedRoomId },
        select: { id: true, status: true },
      });

      if (!room) return res.status(404).json({ error: 'Foundry not found' });
      if (room.status === 'ENDED') return res.status(410).json({ error: 'Session has ended' });

      const sharedFiles = await prisma.foundrySharedFile.findMany({
        where: { roomId: room.id },
        orderBy: { sharedAt: 'desc' },
      });

      return res.status(200).json({ files: sharedFiles.map(normalizeFile) });
    } catch (err) {
      console.error('[foundry/share-file GET]', err);
      return res.status(500).json({ error: 'Could not load shared files' });
    }
  }

  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).end();

  const { fileName, fileUrl, source } = req.body || {};
  if (!fileName) return res.status(400).json({ error: 'fileName required' });

  try {
    const room = await prisma.foundryRoom.findUnique({
      where: { roomId: resolvedRoomId },
      select: { id: true, status: true },
    });

    if (!room) return res.status(404).end();
    if (room.status === 'ENDED') return res.status(410).json({ error: 'Session has ended' });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, firstName: true, lastName: true, email: true },
    });

    const sharedByName =
      user?.name ||
      [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
      user?.email ||
      'Unknown';

    const file = await prisma.foundrySharedFile.create({
      data: {
        roomId: room.id,
        sharedById: session.user.id,
        sharedByName,
        fileName,
        fileUrl: fileUrl || null,
        source: source || 'COMPUTER',
        sharedAt: new Date(),
      },
    });

    return res.status(200).json({ file: normalizeFile(file) });
  } catch (err) {
    console.error('[foundry/share-file POST]', err);
    return res.status(500).json({ error: 'Could not share file' });
  }

  if (req.method === 'DELETE') {
    const session2 = await getServerSession(req, res, authOptions);
    if (!session2?.user?.id) return res.status(401).end();

    const { fileId } = req.body || {};
    if (!fileId) return res.status(400).json({ error: 'fileId required' });

    try {
      const file = await prisma.foundrySharedFile.findUnique({
        where: { id: fileId },
        select: { id: true, sharedById: true, roomId: true,
          room: { select: { hostId: true, coHostUserId: true } } },
      });

      if (!file) return res.status(404).json({ error: 'File not found' });

      const isOwner = file.sharedById === session2.user.id;
      const isHost = file.room?.hostId === session2.user.id;
      const isCoHost = file.room?.coHostUserId === session2.user.id;

      if (!isOwner && !isHost && !isCoHost) {
        return res.status(403).json({ error: 'Only the host or file owner can remove files' });
      }

      await prisma.foundrySharedFile.delete({ where: { id: fileId } });
      return res.status(200).json({ ok: true, fileId });
    } catch (err) {
      console.error('[foundry/share-file DELETE]', err);
      return res.status(500).json({ error: 'Could not remove file' });
    }
  }
}