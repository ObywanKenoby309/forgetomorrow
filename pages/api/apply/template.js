// pages/api/apply/template.js
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
  try {
    const email = await getAuthedEmail(req, res);
    if (!email) return res.status(401).json({ error: 'Unauthorized' });

    const jobId = Number(req.query.jobId);
    if (!jobId) return res.status(400).json({ error: 'Missing jobId' });

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const accountKey = job.accountKey;
    if (!accountKey) return res.status(400).json({ error: 'Job missing accountKey' });

    const tpl = await prisma.applicationTemplate.findFirst({
      where: { accountKey, isActive: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          include: {
            questions: { orderBy: { key: 'asc' } },
          },
        },
      },
    });

    if (!tpl) {
      return res
        .status(404)
        .json({ error: 'No active application template for this organization' });
    }

    return res.status(200).json(tpl);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
