// pages/api/vault/shared-with-me/remove.js
// Recipient-side removal for Shared With Me.
// Removes only the current user's access/list entry. It does not affect sender-owned documents
// or other recipients.

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

    const { shareId } = req.body || {};
    if (!shareId) return res.status(400).json({ error: 'shareId required' });

    const share = await prisma.vaultShare.findFirst({
      where: { id: String(shareId), toUserId: session.user.id },
      select: { id: true },
    });

    if (!share) return res.status(404).json({ error: 'Share not found' });

    await prisma.vaultShare.delete({ where: { id: share.id } });

    return res.status(200).json({ ok: true, shareId: share.id });
  } catch (err) {
    console.error('[api/vault/shared-with-me/remove]', err);
    return res.status(500).json({ error: 'Could not remove shared document' });
  }
}
