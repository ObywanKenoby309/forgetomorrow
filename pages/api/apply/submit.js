// pages/api/apply/submit.js
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

    const { applicationId } = req.body || {};
    const appId = Number(applicationId);
    if (!appId) return res.status(400).json({ error: 'Missing applicationId' });

    const app = await prisma.application.findUnique({
      where: { id: appId },
      include: {
        consent: true,
        answers: true,
        template: true,
      },
    });

    if (!app || app.userId !== userId) return res.status(403).json({ error: 'Forbidden' });

    // Mandatory consent enforcement (server-side)
    if (!app.consent || !app.consent.termsAccepted) {
      return res.status(400).json({ error: 'Consent is required before submitting.' });
    }
    const sig = String(app.consent.signatureName || '').trim();
    if (sig.length < 2) {
      return res.status(400).json({ error: 'Signature name is required before submitting.' });
    }

    // Prevent double-submit
    if (app.submittedAt) {
      return res
        .status(200)
        .json({ ok: true, alreadySubmitted: true, submittedAt: app.submittedAt });
    }

    const now = new Date();

    // Submit + bump job counter in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedApp = await tx.application.update({
        where: { id: appId },
        data: {
          submittedAt: now,
          status: 'Applied', // keep consistent with your enum/string
        },
      });

      if (updatedApp.jobId) {
        await tx.job.update({
          where: { id: updatedApp.jobId },
          data: { applicationsCount: { increment: 1 } },
        });
      }

      return updatedApp;
    });

    return res.status(200).json({ ok: true, application: result });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
