// pages/api/auth/me.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  // Restrict to GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // Get session
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    // Check for user ID (sub from JWT or id from authorize)
    if (!session.user.id) {
      return res.status(200).json({ ok: true, user: null });
    }

    // Refresh user from database to ensure up-to-date role/plan
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        plan: true,
      },
    });

    if (!user) {
      return res.status(200).json({ ok: true, user: null });
    }

    return res.status(200).json({ ok: true, user });
  } catch (error) {
    console.error('[/api/auth/me] Error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
