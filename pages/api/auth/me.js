// pages/api/auth/me.js
//
// Returns the *currently authenticated* user,
// based on the same logic we use in /api/profile/slug:
// 1) NextAuth session (JWT)
// 2) Fallback to custom JWT cookie ("auth")

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verify } from 'jsonwebtoken';

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';

async function getUserIdFromRequest(req, res) {
  // 1) Try NextAuth session (same as /api/profile/slug)
  try {
    const session = await getServerSession(req, res, authOptions);
    if (session && session.user && session.user.id) {
      return session.user.id;
    }
  } catch (err) {
    console.error('[/api/auth/me] getServerSession failed:', err);
  }

  // 2) Fallback: custom JWT cookie from older auth flow
  const authCookie = req.cookies?.auth;
  if (authCookie) {
    try {
      const payload = verify(authCookie, JWT_SECRET);
      if (payload && payload.userId) {
        return payload.userId;
      }
    } catch (err) {
      console.error('[/api/auth/me] JWT verify failed:', err);
    }
  }

  return null;
}

export default async function handler(req, res) {
  try {
    const userId = await getUserIdFromRequest(req, res);

    if (!userId) {
      return res.status(401).json({ ok: false, error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        plan: true,
        slug: true,

        // public profile fields
        pronouns: true,
        headline: true,
        location: true,
        status: true,
        avatarUrl: true,
        coverUrl: true,
      },
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    const fullName =
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      'Unnamed';

    return res.json({
      ok: true,
      user: {
        ...user,
        name: fullName,
      },
    });
  } catch (err) {
    console.error('[/api/auth/me] Error:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
