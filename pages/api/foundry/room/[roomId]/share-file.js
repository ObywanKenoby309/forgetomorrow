// pages/api/foundry/room/[roomId]/share-file.js
// GET  — list shared files in a room (public, guests can read)
// POST — share a file into the room + side-write VaultShare for all participants
// DELETE — remove a shared file (owner, host, or co-host only)

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

  // ── GET ──────────────────────────────────────────────────────────────────────
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
      return res.status(200).json({
        files: sharedFiles.map((file) => normalizeFile(file, guestCode)),
      });
    } catch (err) {
      console.error('[foundry/share-file GET]', err);
      return res.status(500).json({ error: 'Could not load shared files' });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).end();

    const {
      fileName,
      fileUrl,
      storagePath,
      source,
      participantUserIds,
      forgeDocType,
      forgeDocId,
      vaultUploadId,
    } = req.body || {};
    if (!fileName) return res.status(400).json({ error: 'fileName required' });

    try {
      const room = await prisma.foundryRoom.findUnique({
        where: { roomId: resolvedRoomId },
        select: {
          id: true,
          roomId: true,
          status: true,
          hostId: true,
          coHostUserId: true,
        },
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

      const resolvedStoragePath = storagePath || fileUrl || null;

      // Create the FoundrySharedFile (existing behavior, unchanged)
      const file = await prisma.foundrySharedFile.create({
        data: {
          roomId: room.id,
          sharedById: session.user.id,
          sharedByName,
          fileName,
          fileUrl: resolvedStoragePath,
          source: source || 'COMPUTER',
          sharedAt: new Date(),
        },
      });

      // ── Side-write: create VaultShare for every active participant except sender ─
      // We use participantUserIds sent from the client (the live Daily participants list)
      // rather than the FoundryParticipant DB table, which misses users who bypass the lobby
      // (guests, direct-join users). Non-blocking — Foundry share always succeeds.
      try {
        // Fall back to DB participants if client didn't send the list
        let recipientIds = [];

        if (Array.isArray(participantUserIds) && participantUserIds.length > 0) {
          // Client-provided: filter out sender, nulls, and non-cuid strings
          recipientIds = participantUserIds.filter(
            (id) => id && typeof id === 'string' && id !== session.user.id
          );
        } else {
          // Fallback: query DB participant table
          const dbParticipants = await prisma.foundryParticipant.findMany({
            where: {
              roomId: room.id,
              userId: { not: session.user.id },
              leftAt: null,
            },
            select: { userId: true },
          });
          recipientIds = dbParticipants.map((p) => p.userId);
        }

        if (recipientIds.length > 0) {
          const downloadUrl = `/api/files/download?fileId=${file.id}`;
          await prisma.vaultShare.createMany({
            data: recipientIds.map((uid) => ({
              fromUserId: session.user.id,
              toUserId: uid,
              fileName,
              vaultUploadId: vaultUploadId ? String(vaultUploadId) : null,
              forgeDocType: forgeDocType || null,
              forgeDocId: forgeDocId ? String(forgeDocId) : null,
              storagePath: resolvedStoragePath || null,
              downloadUrl,
              foundryRoomId: room.id,
              foundryRoomSlug: room.roomId,
              message: null,
            })),
            skipDuplicates: true,
          });
        }
      } catch (vaultErr) {
        console.error('[foundry/share-file] VaultShare side-write failed (non-blocking):', vaultErr);
      }

      return res.status(200).json({ file: normalizeFile(file) });
    } catch (err) {
      console.error('[foundry/share-file POST]', err);
      return res.status(500).json({ error: 'Could not share file' });
    }
  }

  // ── DELETE ───────────────────────────────────────────────────────────────────
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

      const isOwner  = file.sharedById === session.user.id;
      const isHost   = file.room?.hostId === session.user.id;
      const isCoHost = file.room?.coHostUserId === session.user.id;

      if (!isOwner && !isHost && !isCoHost) {
        return res.status(403).json({ error: 'Only the host or file owner can remove files' });
      }

      // Clean up Supabase Storage if applicable
      if (
        file.fileUrl &&
        !file.fileUrl.startsWith('data:') &&
        !file.fileUrl.startsWith('http')
      ) {
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