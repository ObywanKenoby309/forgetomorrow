// pages/api/vault/shares/revoke.js
// POST { shareId } — revoke a single share (sender only)
// POST { docType, docId } or { uploadId } — remove ALL shares for a doc

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const { shareId, docType, docId, uploadId, revokeAll } = req.body || {};

    if (revokeAll) {
      // Remove all shares for a specific document
      const where = {
        fromUserId: session.user.id,
        ...(uploadId
          ? { vaultUploadId: String(uploadId) }
          : { forgeDocType: String(docType || ''), forgeDocId: String(docId || '') }
        ),
      };
      const result = await prisma.vaultShare.deleteMany({ where });
      return res.status(200).json({ ok: true, removed: result.count });
    }

    if (shareId) {
      // Revoke single share — must be the sender
      const share = await prisma.vaultShare.findFirst({
        where: { id: String(shareId), fromUserId: session.user.id },
      });
      if (!share) return res.status(404).json({ error: 'Share not found' });

      await prisma.vaultShare.delete({ where: { id: share.id } });
      return res.status(200).json({ ok: true, shareId: share.id });
    }

    return res.status(400).json({ error: 'Provide shareId or revokeAll + docType/docId' });
  } catch (err) {
    console.error('[api/vault/shares/revoke]', err);
    return res.status(500).json({ error: 'Could not revoke share' });
  }
}