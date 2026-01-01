// pages/api/drafts/set.js
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Accept either NextAuth session OR our `auth` JWT cookie
    const session = await getServerSession(req, res, authOptions);
    const email = session?.user?.email || getEmailFromAuthCookie(req);

    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase() },
      select: { id: true },
    });

    if (!user?.id) return res.status(404).json({ error: 'User not found' });

    const { key, content } = req.body || {};
    const k = String(key || '').trim();
    if (!k) return res.status(400).json({ error: 'Missing key' });

    // content can be string/object/array - stored as Json
    const saved = await prisma.userDraft.upsert({
      where: { userId_key: { userId: user.id, key: k } },
      update: { content },
      create: { userId: user.id, key: k, content },
      select: { key: true, updatedAt: true },
    });

    return res.status(200).json({ ok: true, draft: saved });
  } catch (e) {
    console.error('[api/drafts/set] error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
