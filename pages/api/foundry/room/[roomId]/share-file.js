// pages/api/foundry/room/[roomId]/share-file.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

function relativeTime(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function normalizeFile(file, guestCode = '') {
  return {
    id: file.id,
    name: file.fileName,
    downloadUrl: guestCode
	  ? `/api/files/download?fileId=${file.id}&guestCode=${encodeURIComponent(guestCode)}`
	  : `/api/files/download?fileId=${file.id}`,
    hasFile: !!file.fileUrl,
    sharedBy: file.sharedByName || 'Unknown',
    ago: relativeTime(file.sharedAt),
    source: file.source || 'COMPUTER',
  };
}

export default async function handler(req, res) {
  const { roomId } = req.query;
  const resolvedRoomId = Array.isArray(roomId) ? roomId[0] : roomId;

  // ── GET — public, no auth required (guests can fetch file list) ───────────
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
      const guestCode = typeof req.query.guestCode === 'string' ? req.query.guestCode : '';
	  return res.status(200).json({ files: sharedFiles.map((file) => normalizeFile(file, guestCode)) });
    } catch (err) {
      console.error('[foundry/share-file GET]', err);
      return res.status(500).json({ error: 'Could not load shared files' });
    }
  }

  // ── POST — authenticated, share a file ────────────────────────────────────
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).end();

    const { fileName, fileUrl, storagePath, source } = req.body || {};
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
        user?.email || 'Unknown';

      const file = await prisma.foundrySharedFile.create({
        data: {
          roomId: room.id,
          sharedById: session.user.id,
          sharedByName,
          fileName,
          fileUrl: storagePath || fileUrl || null, // storagePath from new upload API, fileUrl for legacy
          source: source || 'COMPUTER',
          sharedAt: new Date(),
        },
      });
      return res.status(200).json({ file: normalizeFile(file) });
    } catch (err) {
      console.error('[foundry/share-file POST]', err);
      return res.status(500).json({ error: 'Could not share file' });
    }
  }

  // ── DELETE — authenticated, remove a file ─────────────────────────────────
  if (req.method === 'DELETE') {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).end();

    const { fileId } = req.body || {};
    if (!fileId) return res.status(400).json({ error: 'fileId required' });

    try {
      const file = await prisma.foundrySharedFile.findUnique({
        where: { id: fileId },
        include: {
          room: { select: { hostId: true, coHostUserId: true } },
        },
      });
      if (!file) return res.status(404).json({ error: 'File not found' });

      const isOwner = file.sharedById === session.user.id;
      const isHost = file.room?.hostId === session.user.id;
      const isCoHost = file.room?.coHostUserId === session.user.id;

      if (!isOwner && !isHost && !isCoHost) {
        return res.status(403).json({ error: 'Only the host or file owner can remove files' });
      }

      // Clean up from Supabase Storage if stored there
      if (file.fileUrl && !file.fileUrl.startsWith('data:') && !file.fileUrl.startsWith('http')) {
        try {
          const { deleteFile } = await import('@/lib/storage');
          await deleteFile(file.fileUrl);
        } catch (storageErr) {
          console.error('[share-file DELETE] storage cleanup:', storageErr);
        }
      }

      await prisma.foundrySharedFile.delete({ where: { id: fileId } });
      return res.status(200).json({ ok: true, fileId });
    } catch (err) {
      console.error('[foundry/share-file DELETE]', err);
      return res.status(500).json({ error: 'Could not remove file' });
    }
  }

  return res.status(405).end();
}