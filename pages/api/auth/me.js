// pages/api/auth/me.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const authCookie = req.cookies?.auth;

    if (!session && !authCookie) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    let userId = null;

    if (session?.user?.id) {
      userId = session.user.id;
    } else if (authCookie) {
      try {
        const payload = verify(authCookie, JWT_SECRET);
        if (payload?.userId) {
          userId = payload.userId;
        }
      } catch (err) {
        console.error('[/api/auth/me] JWT verify failed:', err);
        return res.status(401).json({ ok: false, error: 'Invalid token' });
      }
    }

    if (!userId) {
      return res.status(200).json({ ok: true, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        image: true,
        role: true,
        plan: true,
        newsletter: true,
        slug: true,
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
