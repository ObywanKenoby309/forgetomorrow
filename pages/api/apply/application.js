// pages/api/apply/application.js
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

    if (req.method === 'POST') {
      const { jobId, resumeId, coverId } = req.body || {};
      const jobIdNum = Number(jobId);
      if (!jobIdNum) return res.status(400).json({ error: 'Missing jobId' });

      const job = await prisma.job.findUnique({ where: { id: jobIdNum } });
      if (!job) return res.status(404).json({ error: 'Job not found' });

      const created = await prisma.application.upsert({
        where: { user_job_unique: { userId, jobId: jobIdNum } },
        update: {
          resumeId: resumeId ? Number(resumeId) : null,
          coverId: coverId ? Number(coverId) : null,
          accountKey: job.accountKey || null,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url || null,
        },
        create: {
          userId,
          jobId: jobIdNum,
          resumeId: resumeId ? Number(resumeId) : null,
          coverId: coverId ? Number(coverId) : null,
          accountKey: job.accountKey || null,
          title: job.title,
          company: job.company,
          location: job.location,
          url: job.url || null,
          status: 'Applied',
        },
      });

      return res.status(200).json(created);
    }

    if (req.method === 'PATCH') {
      const { id, resumeId, coverId } = req.body || {};
      const appId = Number(id);
      if (!appId) return res.status(400).json({ error: 'Missing application id' });

      const updated = await prisma.application.update({
        where: { id: appId },
        data: {
          resumeId: resumeId ? Number(resumeId) : null,
          coverId: coverId ? Number(coverId) : null,
        },
      });

      return res.status(200).json(updated);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    // This is where you were seeing "localStorage is not defined"
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
