// pages/api/auth/me.js
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(200).json({ ok: true, user: null });
    }

    // Optional: Refresh user from DB (e.g., role/plan changes)
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