// pages/api/files/download.js
// Verifies the requester has access to a shared file, then redirects
// to a short-lived signed URL from Supabase Storage.
//
// GET /api/files/download?fileId=xxx
// GET /api/files/download?fileId=xxx&guestCode=xxx  (for guests in a Foundry)
//
// Access rules:
//   - FT authenticated user who is in the same Foundry as the file
//   - Guest with valid guestCode for the Foundry room the file was shared in
//   - The user who originally uploaded the file (owner always has access)
//   - Host or co-host of the Foundry room

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { getSignedUrl } from '@/lib/storage';

const SIGNED_URL_EXPIRY = 60 * 60; // 1 hour

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

    const session = await getServerSession(req, res, authOptions).catch(() => null);
    const userId = session?.user?.id || null;

    let hasAccess = false;

    if (userId) {
      // File owner always has access
      if (file.sharedById === userId) hasAccess = true;
      // Host or co-host
      if (file.room?.hostId === userId) hasAccess = true;
      if (file.room?.coHostUserId === userId) hasAccess = true;
      // Any FT participant in an active or recently ended room
      if (!hasAccess && file.room) {
        const participant = await prisma.foundryParticipant.findFirst({
          where: { roomId: file.room.id, userId },
        });
        if (participant) hasAccess = true;
      }
    }

    // Guest access via guestCode
    if (!hasAccess && guestCode && file.room?.guestToken === guestCode) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have access to this file' });
    }

    // file.fileUrl is the Supabase Storage path (e.g. userId/foundry/roomId/filename.pdf)
    // Generate a signed URL that expires in 1 hour
    const signedUrl = await getSignedUrl(file.fileUrl, SIGNED_URL_EXPIRY);

    // Redirect to the signed URL — browser handles the download
    return res.redirect(302, signedUrl);

  } catch (err) {
    console.error('[files/download]', err);
    return res.status(500).json({ error: 'Could not generate download link' });
  }
}