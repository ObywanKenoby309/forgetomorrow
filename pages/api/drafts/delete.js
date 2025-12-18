// pages/api/drafts/delete.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  // ✅ Minimal fix: resolve userId via email (do NOT rely on session.user.id)
  if (!session?.user?.email) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user?.id) return res.status(404).json({ error: 'User not found' });

  const userId = user.id;

  try {
    const { key } = req.body || {};
    const k = String(key || '').trim();
    if (!k) return res.status(400).json({ error: 'Missing key' });

    await prisma.userDraft
      .delete({
        where: { userId_key: { userId, key: k } },
      })
      .catch(() => null);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[api/drafts/delete] error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
