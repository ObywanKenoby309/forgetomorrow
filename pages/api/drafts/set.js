// pages/api/drafts/set.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ PROD: NextAuth is the single source of truth
    const session = await getServerSession(req, res, authOptions);
    const email = session?.user?.email ? String(session.user.email).toLowerCase() : '';

    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user?.id) return res.status(404).json({ error: 'User not found' });

    const { key, content } = req.body || {};
    const k = String(key || '').trim();
    if (!k) return res.status(400).json({ error: 'Missing key' });

    // content can be string/object/array - stored as Json
    const saved = await prisma.userDraft.upsert({
      where: { userId_key: { userId: user.id, key: k } },
      update: { content },
      create: { userId: user.id, key: k, content },
      select: { key: true, updatedAt: true },
    });

    return res.status(200).json({ ok: true, draft: saved });
  } catch (e) {
    console.error('[api/drafts/set] error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
