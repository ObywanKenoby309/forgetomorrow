// pages/api/vault/share.js
// Direct vault share — sender must be connected to recipient via Contact table.
// Creates a VaultShare record and fires a Notification to the recipient.
// Foundry shares are handled separately via the share-file endpoint side-write.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function safe(value, fallback = '') {
  return String(value || '').trim() || fallback;
}

// Derive recipient notification scope from their role
function scopeForRole(role) {
  const r = String(role || '').toUpperCase();
  if (r === 'COACH') return 'COACH';
  if (r === 'RECRUITER' || r === 'ADMIN' || r === 'OWNER') return 'RECRUITER';
  return 'SEEKER';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const fromUserId = session.user.id;

    const {
      toUserId,
      // Forge doc fields (one of these sets):
      forgeDocType,
      forgeDocId,
      // Upload fields:
      vaultUploadId,
      // Always required:
      fileName,
      downloadUrl,
      storagePath,
      // Optional:
      message,
    } = req.body || {};

    if (!toUserId) return res.status(400).json({ error: 'toUserId required' });
    if (!fileName) return res.status(400).json({ error: 'fileName required' });
    if (!forgeDocId && !vaultUploadId) {
      return res.status(400).json({ error: 'Must provide forgeDocId or vaultUploadId' });
    }

    // Verify contact relationship exists (bidirectional)
    const contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { userId: fromUserId, contactUserId: toUserId },
          { userId: toUserId, contactUserId: fromUserId },
        ],
      },
    });

    if (!contact) {
      return res.status(403).json({ error: 'You can only share with your contacts' });
    }

    // If sharing an upload, verify ownership
    if (vaultUploadId) {
      const upload = await prisma.vaultUpload.findFirst({
        where: { id: String(vaultUploadId), userId: fromUserId },
      });
      if (!upload) return res.status(404).json({ error: 'Upload not found' });
    }

    // Get sender info for notification
    const [sender, recipient] = await Promise.all([
      prisma.user.findUnique({
        where: { id: fromUserId },
        select: { name: true, firstName: true, lastName: true },
      }),
      prisma.user.findUnique({
        where: { id: toUserId },
        select: { id: true, role: true },
      }),
    ]);

    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const senderName = safe(
      sender?.name ||
      [sender?.firstName, sender?.lastName].filter(Boolean).join(' '),
      'Someone'
    );

    // Create VaultShare
    const share = await prisma.vaultShare.create({
      data: {
        fromUserId,
        toUserId,
        vaultUploadId: vaultUploadId || null,
        forgeDocType: forgeDocType || null,
        forgeDocId: forgeDocId ? String(forgeDocId) : null,
        fileName: safe(fileName, 'Document'),
        storagePath: storagePath || null,
        downloadUrl: downloadUrl || null,
        message: message ? safe(message) : null,
      },
    });

    // Fire notification — wrapped in try/catch so share never fails if notif fails
    try {
      const scope = scopeForRole(recipient.role);
      const dedupeKey = `vault_share_${share.id}`;

      await prisma.notification.create({
        data: {
          userId: toUserId,
          actorUserId: fromUserId,
          category: 'VAULT',
          scope,
          entityType: 'VAULT_SHARE',
          entityId: share.id,
          dedupeKey,
          title: `${senderName} shared a document with you`,
          body: safe(fileName, 'A document'),
          requiresAction: true,
          metadata: {
            shareId: share.id,
            fileName: share.fileName,
            downloadUrl: share.downloadUrl,
            fromUserId,
            senderName,
            message: share.message || null,
          },
        },
      });
    } catch (notifErr) {
      console.error('[vault/share] notification write failed (non-blocking):', notifErr);
    }

    return res.status(200).json({
      ok: true,
      share: {
        id: share.id,
        toUserId: share.toUserId,
        fileName: share.fileName,
        createdAt: share.createdAt,
      },
    });
  } catch (err) {
    console.error('[api/vault/share]', err);
    return res.status(500).json({ error: 'Could not share document' });
  }
}