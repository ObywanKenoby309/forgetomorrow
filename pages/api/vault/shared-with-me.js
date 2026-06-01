// pages/api/vault/shared-with-me.js
// Returns all documents shared with the current user —
// both direct vault shares and Foundry-originated shares.
// Marks returned shares as read.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function safe(value, fallback = '') {
  return String(value || '').trim() || fallback;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const toUserId = session.user.id;

    const shares = await prisma.vaultShare.findMany({
      where: { toUserId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        fromUserId: true,
        forgeDocType: true,
        forgeDocId: true,
        vaultUploadId: true,
        foundryRoomId: true,
        foundryRoomSlug: true,
        fileName: true,
        downloadUrl: true,
        storagePath: true,
        message: true,
        readAt: true,
        createdAt: true,
        fromUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    const normalized = shares.map((s) => {
      const fromName = safe(
        s.fromUser?.name ||
        [s.fromUser?.firstName, s.fromUser?.lastName].filter(Boolean).join(' '),
        'ForgeTomorrow User'
      );

      const origin = s.foundryRoomId ? 'foundry' : 'direct';

      return {
        id: s.id,
        fileName: s.fileName,
        downloadUrl: s.downloadUrl,
        message: s.message || null,
        readAt: s.readAt,
        createdAt: s.createdAt,
        isUnread: !s.readAt,
        origin,
        foundryRoomSlug: s.foundryRoomSlug || null,
        forgeDocType: s.forgeDocType || null,
        isUpload: Boolean(s.vaultUploadId),
        from: {
          id: s.fromUser?.id || s.fromUserId,
          name: fromName,
          avatarUrl: s.fromUser?.avatarUrl || null,
          role: s.fromUser?.role || null,
        },
      };
    });

    // Count unread for badge purposes
    const unreadCount = normalized.filter((s) => s.isUnread).length;

    return res.status(200).json({ shares: normalized, unreadCount });
  } catch (err) {
    console.error('[api/vault/shared-with-me]', err);
    return res.status(500).json({ error: 'Could not load shared documents' });
  }
}