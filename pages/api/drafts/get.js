// pages/api/drafts/get.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { verify as verifyJwt } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';

function getAuthCookie(req) {
  try {
    return String(req?.cookies?.auth || '').trim();
  } catch {
    return '';
  }
}

function getEmailFromAuthCookie(req) {
  const token = getAuthCookie(req);
  if (!token) return null;

  try {
    const payload = verifyJwt(token, JWT_SECRET);
    const email = payload?.email ? String(payload.email) : '';
    return email || null;
  } catch {
    return null;
  }
}

/**
 * Gets a per-user draft payload by key.
 * Query: ?key=cover:draft  (or any key)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Accept either NextAuth session OR our `auth` JWT cookie
    const session = await getServerSession(req, res, authOptions);
    const email = session?.user?.email || getEmailFromAuthCookie(req);

    if (!email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
      select: { id: true },
    });

    if (!user?.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    const key = typeof req.query.key === 'string' ? req.query.key.trim() : '';
    if (!key) {
      return res.status(400).json({ error: 'Missing "key" query param' });
    }

    const draft = await prisma.userDraft.findUnique({
      where: {
        userId_key: {
          userId: user.id,
          key,
        },
      },
    });

    return res.status(200).json({ draft: draft || null });
  } catch (err) {
    console.error('[api/drafts/get] error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
