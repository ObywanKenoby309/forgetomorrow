// pages/api/resume/save.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const MAX_RESUMES = 4;

const JWT_SECRET =
  process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production';

function getCookie(req, name) {
  try {
    const raw = req.headers?.cookie || '';
    const parts = raw.split(';').map((p) => p.trim());

    for (const part of parts) {
      if (part.startsWith(`${name}=`)) {
        return decodeURIComponent(part.slice(name.length + 1));
      }
    }

    return null;
  } catch {
    return null;
  }
}

function normalizeEmail(value) {
  const email = String(value || '').toLowerCase().trim();
  return email || null;
}

async function getAuthedUser(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const sessionEmail = normalizeEmail(session?.user?.email);

  if (sessionEmail) {
    const user = await prisma.user.findUnique({
      where: { email: sessionEmail },
      select: { id: true },
    });

    return user || null;
  }

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

    return user || null;
  } catch {
    return null;
  }
}

function toResumeId(value) {
  const resumeId = Number(value);

  if (!resumeId || Number.isNaN(resumeId)) {
    return null;
  }

  return resumeId;
}

async function handleDelete(req, res, userId) {
  const { id } = req.body || {};
  const resumeId = toResumeId(id);

  if (!resumeId) {
    return res.status(400).json({ error: 'Invalid resume id' });
  }

  const existing = await prisma.resume.findFirst({
    where: { id: resumeId, userId },
    select: { id: true, isPrimary: true },
  });

  if (!existing) {
    return res.status(404).json({ error: 'Resume not found for this user' });
  }

  await prisma.resume.delete({
    where: { id: resumeId },
  });

  if (existing.isPrimary) {
    const newest = await prisma.resume.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true },
    });

    if (newest) {
      await prisma.resume.update({
        where: { id: newest.id },
        data: { isPrimary: true },
      });
    }
  }

  return res.status(200).json({ success: true });
}

async function handlePost(req, res, userId) {
  const {
    id,
    name,
    content,
    template,
    setPrimary,
  } = req.body || {};

  if (!content) {
    return res.status(400).json({ error: 'Missing resume content' });
  }

  const resumeId = id ? toResumeId(id) : null;

  if (id && !resumeId) {
    return res.status(400).json({ error: 'Invalid resume id' });
  }

  let targetResume = null;

  if (resumeId) {
    targetResume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });

    if (!targetResume) {
      return res.status(404).json({ error: 'Resume not found for this user' });
    }
  }

  const existingCount = await prisma.resume.count({
    where: { userId },
  });

  if (!resumeId && existingCount >= MAX_RESUMES) {
    return res.status(400).json({
      error: `Resume limit reached (max ${MAX_RESUMES}).`,
      limit: MAX_RESUMES,
    });
  }

  const normalized =
    content && content.template && content.data
      ? content
      : {
          template: template || 'reverse',
          data: content,
        };

  const serializedContent =
    typeof normalized === 'string'
      ? normalized
      : JSON.stringify(normalized);

  const shouldBePrimary =
    Boolean(setPrimary) || (!resumeId && existingCount === 0);

  if (shouldBePrimary) {
    await prisma.resume.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });
  }

  let saved;

  if (resumeId) {
    saved = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        name: String(name || targetResume.name || 'Untitled Resume').trim(),
        content: serializedContent,
        isPrimary: shouldBePrimary ? true : targetResume.isPrimary,
      },
    });
  } else {
    saved = await prisma.resume.create({
      data: {
        userId,
        name: String(name || 'Untitled Resume').trim(),
        content: serializedContent,
        isPrimary: shouldBePrimary,
      },
    });
  }

  return res.status(200).json({
    resume: saved,
    limit: MAX_RESUMES,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await getAuthedUser(req, res);

    if (!user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.method === 'DELETE') {
      return handleDelete(req, res, user.id);
    }

    return handlePost(req, res, user.id);
  } catch (err) {
    console.error('[resume/save] Error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
