// pages/api/apply/documents.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';

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
  const session = await getServerSession(req, res, authOptions);
  const sessionEmail = normalizeEmail(session?.user?.email);
  if (sessionEmail) return sessionEmail;

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

    let resumes = [];
    let covers = [];

    // Isolate queries so we can see which one breaks in prod
    try {
      resumes = await prisma.resume.findMany({
        where: { userId: user.id },
        orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
        select: { id: true, name: true, isPrimary: true },
      });
    } catch (e) {
      console.error('[apply/documents] resume query error', e);
      return res.status(500).json({
        error: 'Server error',
        hint: 'resume_query_failed',
      });
    }

    try {
      covers = await prisma.cover.findMany({
        where: { userId: user.id },
        orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
        select: { id: true, name: true, isPrimary: true },
      });
    } catch (e) {
      console.error('[apply/documents] cover query error', e);
      return res.status(500).json({
        error: 'Server error',
        hint: 'cover_query_failed',
      });
    }

    return res.status(200).json({
      resumes,
      covers,
      debug: {
        email,
        userId: user.id,
        resumesCount: resumes.length,
        coversCount: covers.length,
      },
    });
  } catch (err) {
    console.error('[apply/documents] error', err);
    return res.status(500).json({ error: 'Server error', hint: 'handler_failed' });
  }
}
