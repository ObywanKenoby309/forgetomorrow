// pages/api/resume/save.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user || !session.user.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { title, data, isPrimary } = req.body || {};

    if (!title || !data) {
      return res.status(400).json({ error: 'Missing "title" or "data" in request body.' });
    }

    // If this should be the primary resume, clear existing primaries
    if (isPrimary) {
      await prisma.resume.updateMany({
        where: { userId: user.id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        title: String(title),
        data,
        isPrimary: !!isPrimary,
      },
    });

    return res.status(200).json({ resume });
  } catch (err) {
    console.error('[api/resume/save] Error:', err);
    return res.status(500).json({ error: 'Failed to save resume.' });
  }
}