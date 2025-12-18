// pages/api/cover/save.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { id, name, content, jobId, isPrimary } = req.body || {};

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Missing content' });
    }

    // If making primary, clear existing primary first
    if (isPrimary === true) {
      await prisma.cover.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    // Update (if id provided) else create
    const saved = id
      ? await prisma.cover.update({
          where: { id: Number(id) },
          data: {
            name,
            content,
            jobId: jobId ? Number(jobId) : null,
            ...(typeof isPrimary === 'boolean' ? { isPrimary } : {}),
          },
        })
      : await prisma.cover.create({
          data: {
            userId,
            name,
            content,
            jobId: jobId ? Number(jobId) : null,
            isPrimary: isPrimary === true,
          },
        });

    return res.status(200).json({ ok: true, cover: saved });
  } catch (e) {
    console.error('[api/cover/save] error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
