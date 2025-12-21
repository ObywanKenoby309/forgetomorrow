// pages/api/signal/block.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const meId = session.user.id;
    const { targetUserId, reason } = req.body || {}; // ✅ NEW: accept optional reason
    if (!targetUserId || typeof targetUserId !== 'string') {
      return res
        .status(400)
        .json({ error: 'Missing or invalid "targetUserId".' });
    }
    if (targetUserId === meId) {
      return res
        .status(400)
        .json({ error: 'You cannot block yourself.' });
    }
    // Make sure target exists
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!target) {
      return res.status(404).json({ error: 'Target user not found.' });
    }
    // Create a block record (id is unique on [blockerId, blockedId])
    await prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: meId,
          blockedId: targetUserId,
        },
      },
      create: {
        blockerId: meId,
        blockedId: targetUserId,
        reason: reason?.trim() || null, // ✅ Save reason if provided
      },
      update: {
        reason: reason?.trim() || null, // ✅ Update reason if changed
      },
    });
    return res.status(200).json({ blocked: true });
  } catch (err) {
    console.error('[signal/block] error', err);
    return res.status(500).json({ error: 'Failed to block user.' });
  }
}