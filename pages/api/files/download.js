// pages/api/files/download.js
// Verifies access then streams the file directly from Cloudflare R2.
// Streaming keeps the URL same-origin so the browser's download attribute works —
// the file saves without opening a new tab, same as Teams/Drive behavior.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { downloadFile, fromR2Reference } from '@/lib/storage';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { fileId, guestCode } = req.query;
  if (!fileId) return res.status(400).json({ error: 'fileId required' });

  try {
    const file = await prisma.foundrySharedFile.findUnique({
      where: { id: String(fileId) },
      include: {
        room: {
          select: {
            id: true,
            hostId: true,
            coHostUserId: true,
            guestToken: true,
            status: true,
          },
        },
      },
    });

    if (!file) return res.status(404).json({ error: 'File not found' });
    if (!file.fileUrl) return res.status(404).json({ error: 'No file stored for this entry' });

    // ── Access control ─────────────────────────────────────────────────────
    const session = await getServerSession(req, res, authOptions).catch(() => null);
    const userId = session?.user?.id || null;
    let hasAccess = false;

    if (userId) {
      if (file.sharedById === userId) hasAccess = true;
      if (file.room?.hostId === userId) hasAccess = true;
      if (file.room?.coHostUserId === userId) hasAccess = true;
      if (!hasAccess && file.room) {
        const participant = await prisma.foundryParticipant.findFirst({
          where: { roomId: file.room.id, userId },
        });
        if (participant) hasAccess = true;
      }
    }

// Guest access
if (!hasAccess && guestCode && file.room?.guestToken === String(guestCode)) {
  hasAccess = true;
}

console.log('[files/download-debug]', {
  fileId,
  guestCode,
  roomGuestToken: file.room?.guestToken,
  userId,
  hasAccessBeforeGuestCheck: hasAccess,
});

if (!hasAccess) {
  return res.status(403).json({ error: 'You do not have access to this file' });
}

    // ── Stream file from Cloudflare R2 ─────────────────────────────────────
    const storagePath = fromR2Reference(file.fileUrl) || file.fileUrl;
    const { buffer, contentType: storedContentType } = await downloadFile(storagePath);

    // Determine content type from file extension
    const ext = file.fileUrl.split('.').pop()?.toLowerCase() || '';
    const mimeMap = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain',
      csv: 'text/csv',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    const contentType = storedContentType || mimeMap[ext] || 'application/octet-stream';

    // Safe filename for Content-Disposition
    const safeFileName = encodeURIComponent(file.fileName || 'download');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"; filename*=UTF-8''${safeFileName}`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-cache');

    return res.status(200).send(buffer);

  } catch (err) {
    console.error('[files/download]', err);
    return res.status(500).json({ error: 'Could not download file' });
  }
}