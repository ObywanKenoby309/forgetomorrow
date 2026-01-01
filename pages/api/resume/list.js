// pages/api/resume/list.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';

// ─────────────────────────────────────────────────────────────
// ✅ MIN CHANGE: allow auth via NextAuth session OR HttpOnly `auth` cookie
// ─────────────────────────────────────────────────────────────
function getCookie(req, name) {
  try {
    const raw = req.headers?.cookie || '';
    const parts = raw.split(';').map((p) => p.trim());
    for (const p of parts) {
      if (p.startsWith(name + '=')) {
        return decodeURIComponent(p.slice(name.length + 1));
      }
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeEmail(v) {
  const s = String(v || '').toLowerCase().trim();
  return s || null;
}

async function getAuthedEmail(req, res) {
  // 1) Prefer NextAuth session
  const session = await getServerSession(req, res, authOptions);
  const sessionEmail = normalizeEmail(session?.user?.email);
  if (sessionEmail) return sessionEmail;

  // 2) Fallback: custom auth cookie set by /api/auth/verify-email
  const token = getCookie(req, 'auth');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return normalizeEmail(decoded?.email);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const email = await getAuthedEmail(req, res);
    if (!email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user?.id) {
      return res.status(404).json({ error: 'User not found' });
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    // ✅ New account = 200 + empty array
    return res.status(200).json({ resumes });
  } catch (err) {
    console.error('[api/resume/list] Error:', err);
    return res.status(500).json({ error: 'Failed to load resumes.' });
  }
}
