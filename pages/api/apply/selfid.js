// pages/api/apply/selfid.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';

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

async function getAuthedUserId(req, res) {
  // 1) NextAuth session (server-side)
  const session = await getServerSession(req, res, authOptions);
  const sid = session?.user?.id;
  if (sid) return sid;

  // 2) JWT cookie fallback (if you use an "auth" cookie)
  const token = getCookie(req, 'auth');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const email = normalizeEmail(decoded?.email);
    if (!email) return null;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return user?.id || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const userId = await getAuthedUserId(req, res);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const {
      applicationId,
      genderIdentity,
      raceEthnicity,
      veteranStatus,
      disabilityStatus,
    } = req.body || {};

    const appId = Number(applicationId);
    if (!appId) return res.status(400).json({ error: 'Missing applicationId' });

    const app = await prisma.application.findUnique({ where: { id: appId } });
    if (!app || app.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    const saved = await prisma.applicationSelfId.upsert({
      where: { applicationId: appId },
      update: {
        genderIdentity: genderIdentity ? String(genderIdentity) : null,
        raceEthnicity: raceEthnicity ? String(raceEthnicity) : null,
        veteranStatus: veteranStatus ? String(veteranStatus) : null,
        disabilityStatus: disabilityStatus ? String(disabilityStatus) : null,
      },
      create: {
        applicationId: appId,
        genderIdentity: genderIdentity ? String(genderIdentity) : null,
        raceEthnicity: raceEthnicity ? String(raceEthnicity) : null,
        veteranStatus: veteranStatus ? String(veteranStatus) : null,
        disabilityStatus: disabilityStatus ? String(disabilityStatus) : null,
      },
    });

    return res.status(200).json({ ok: true, selfId: saved });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
