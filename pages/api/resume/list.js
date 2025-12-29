// pages/api/resume/list.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    // ✅ Prefer id (matches the rest of your app), fall back to email
    const userId = session?.user?.id ? String(session.user.id).trim() : '';
    const emailRaw = session?.user?.email ? String(session.user.email).trim() : '';
    const email = emailRaw ? emailRaw.toLowerCase() : '';

    if (!userId && !email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let user = null;

    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
    } else if (email) {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const LIMIT = 5;

    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      take: LIMIT,
      select: {
        id: true,
        name: true,
        title: true,
        createdAt: true,
        isPrimary: true,
      },
    });

    return res.status(200).json({
      resumes,
      limit: LIMIT,
      count: resumes.length,
    });
  } catch (err) {
    console.error('[resume/list] Error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
