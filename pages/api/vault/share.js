// pages/api/vault/share.js
// Creates a VaultShare. Enforces role-based share permissions.
// Triggers PDF render via /api/vault/render-pdf before storing URL.
//
// Permission matrix:
//   Seeker   → can share with Coach, Recruiter
//   Coach    → can share with Seeker, Coach, Recruiter
//   Recruiter → can share with Seeker, Coach, Recruiter

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function safe(value, fallback = '') {
  return String(value || '').trim() || fallback;
}

function canShare(senderRole, recipientRole) {
  const s = String(senderRole || '').toUpperCase();
  const r = String(recipientRole || '').toUpperCase();

  if (s === 'SEEKER') return r === 'COACH' || r === 'RECRUITER';
  if (s === 'COACH') return r === 'SEEKER' || r === 'COACH' || r === 'RECRUITER';
  if (s === 'RECRUITER' || s === 'ADMIN' || s === 'OWNER') return r === 'SEEKER' || r === 'COACH' || r === 'RECRUITER';
  return false;
}

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
      forgeDocType,
      forgeDocId,
      vaultUploadId,
      fileName,
      downloadUrl: providedDownloadUrl,
      storagePath: providedStoragePath,
      message,
    } = req.body || {};

    if (!toUserId) return res.status(400).json({ error: 'toUserId required' });
    if (!fileName) return res.status(400).json({ error: 'fileName required' });
    if (!forgeDocId && !vaultUploadId) return res.status(400).json({ error: 'forgeDocId or vaultUploadId required' });

    // Verify contact relationship
    const contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { userId: fromUserId, contactUserId: toUserId },
          { userId: toUserId, contactUserId: fromUserId },
        ],
      },
    });
    if (!contact) return res.status(403).json({ error: 'You can only share with your contacts' });

    // Load sender + recipient roles
    const [sender, recipient] = await Promise.all([
      prisma.user.findUnique({ where: { id: fromUserId }, select: { role: true, name: true, firstName: true, lastName: true } }),
      prisma.user.findUnique({ where: { id: toUserId }, select: { id: true, role: true } }),
    ]);

    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    // Enforce role permissions
    if (!canShare(sender?.role, recipient?.role)) {
      return res.status(403).json({
        error: `Your role (${safe(sender?.role, 'unknown').toLowerCase()}) cannot share documents with ${safe(recipient?.role, 'this user').toLowerCase()}s`,
      });
    }

    const senderName = safe(
      sender?.name || [sender?.firstName, sender?.lastName].filter(Boolean).join(' '),
      'Someone'
    );

    // For forge docs: render PDF via internal fetch (runs as sender's session)
    let finalDownloadUrl = providedDownloadUrl || null;
    let finalStoragePath = providedStoragePath || null;

    if (forgeDocType && forgeDocId) {
      try {
        // Internal render — build absolute URL for server-side fetch
        const baseUrl = process.env.NEXTAUTH_URL || 'https://www.forgetomorrow.com';
        const renderRes = await fetch(`${baseUrl}/api/vault/render-pdf`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Forward the session cookie so render-pdf can auth as the sender
            cookie: req.headers.cookie || '',
          },
          body: JSON.stringify({ docType: forgeDocType, docId: forgeDocId }),
        });

        if (renderRes.ok) {
          const renderData = await renderRes.json();
          finalDownloadUrl = renderData.downloadUrl;
          finalStoragePath = renderData.storagePath;
        } else {
          console.error('[vault/share] render-pdf failed:', await renderRes.text());
          // Non-blocking — share still creates but without a download URL
        }
      } catch (renderErr) {
        console.error('[vault/share] render-pdf error (non-blocking):', renderErr);
      }
    }

    // Create VaultShare
    const share = await prisma.vaultShare.create({
      data: {
        fromUserId,
        toUserId,
        vaultUploadId: vaultUploadId || null,
        forgeDocType: forgeDocType || null,
        forgeDocId: forgeDocId ? String(forgeDocId) : null,
        fileName: safe(fileName, 'Document'),
        storagePath: finalStoragePath || null,
        downloadUrl: finalDownloadUrl || null,
        message: message ? safe(message) : null,
      },
    });

    // Fire notification — non-blocking
    try {
      const scope = scopeForRole(recipient.role);
      await prisma.notification.create({
        data: {
          userId: toUserId,
          actorUserId: fromUserId,
          category: 'VAULT',
          scope,
          entityType: 'VAULT_SHARE',
          entityId: share.id,
          dedupeKey: `vault_share_${share.id}`,
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
      share: { id: share.id, toUserId: share.toUserId, fileName: share.fileName, createdAt: share.createdAt },
    });
  } catch (err) {
    console.error('[api/vault/share]', err);
    return res.status(500).json({ error: 'Could not share document' });
  }
}