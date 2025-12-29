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

    // ✅ Keep this strict + stable: email-based session gating
    const emailRaw = session?.user?.email ? String(session.user.email).trim() : '';
    const email = emailRaw ? emailRaw.toLowerCase() : '';

    if (!email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
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
      limit: 5,
      count: resumes.length,
    });
  } catch (err) {
    console.error('[resume/list] Error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
