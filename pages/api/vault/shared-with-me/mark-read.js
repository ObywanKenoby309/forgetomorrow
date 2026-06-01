// pages/api/vault/shared-with-me/mark-read.js
// Marks a VaultShare as read for the recipient.

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

    // Verify the share belongs to this user
    const share = await prisma.vaultShare.findFirst({
      where: { id: String(shareId), toUserId: session.user.id },
    });

    if (!share) return res.status(404).json({ error: 'Share not found' });
    if (share.readAt) return res.status(200).json({ ok: true, alreadyRead: true });

    await prisma.vaultShare.update({
      where: { id: share.id },
      data: { readAt: new Date() },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[api/vault/shared-with-me/mark-read]', err);
    return res.status(500).json({ error: 'Could not mark as read' });
  }
}