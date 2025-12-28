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
    const userId = session?.user?.id ? String(session.user.id) : '';
    const email = session?.user?.email ? String(session.user.email) : '';

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

    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    return res.status(200).json({
      resumes,
      limit: 5,
      count: resumes.length,
    });
  } catch (err) {
    console.error('[resume/list] Error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
