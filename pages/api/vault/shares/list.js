// pages/api/vault/shares/list.js
// Returns everyone a specific doc has been shared with.
// Used by the SharePanel to show current share state.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const { docType, docId, uploadId } = req.query;
    const resolvedUploadId = uploadId ? String(uploadId) : '';
    const resolvedDocType = String(docType || '');
    const resolvedDocId = String(docId || '');

    let where;

    if (resolvedUploadId) {
      const upload = await prisma.vaultUpload.findFirst({
        where: { id: resolvedUploadId, userId: session.user.id },
        select: { id: true, fileName: true },
      });

      where = {
        fromUserId: session.user.id,
        OR: [
          { vaultUploadId: resolvedUploadId },
          // Legacy Foundry-created VaultShare rows did not store vaultUploadId.
          // They only stored the Foundry room fields + fileName, which made
          // Shared With Me work while the owner-side Shared With panel looked empty.
          ...(upload?.fileName
            ? [{
                vaultUploadId: null,
                forgeDocType: null,
                forgeDocId: null,
                foundryRoomId: { not: null },
                fileName: upload.fileName,
              }]
            : []),
        ],
      };
    } else {
      where = {
        fromUserId: session.user.id,
        forgeDocType: resolvedDocType,
        forgeDocId: resolvedDocId,
      };
    }

    const shares = await prisma.vaultShare.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        toUserId: true,
        fileName: true,
        foundryRoomSlug: true,
        foundryRoomId: true,
        message: true,
        readAt: true,
        createdAt: true,
        toUser: {
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

    const normalized = shares.map(s => {
      const name =
        s.toUser?.name ||
        [s.toUser?.firstName, s.toUser?.lastName].filter(Boolean).join(' ') ||
        'Unknown';
      return {
        id: s.id,
        toUserId: s.toUserId,
        name,
        role: s.toUser?.role || null,
        avatarUrl: s.toUser?.avatarUrl || null,
        origin: s.foundryRoomId ? 'foundry' : 'direct',
        foundryRoomSlug: s.foundryRoomSlug || null,
        message: s.message || null,
        readAt: s.readAt,
        hasRead: Boolean(s.readAt),
        createdAt: s.createdAt,
      };
    });

    return res.status(200).json({ shares: normalized });
  } catch (err) {
    console.error('[api/vault/shares/list]', err);
    return res.status(500).json({ error: 'Could not load shares' });
  }
}