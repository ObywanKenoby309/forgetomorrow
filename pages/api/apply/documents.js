// pages/api/apply/documents.js
import prisma from '@/lib/prisma';
import { getClientSession } from '@/lib/auth-client';

function pickModel(client, candidates) {
  for (const name of candidates) {
    if (client && client[name] && typeof client[name].findMany === 'function') return client[name];
  }
  return null;
}

async function safeFindMany(model, args, fallbacks = []) {
  try {
    return await model.findMany(args);
  } catch (e) {
    // Retry with simplified queries if schema fields differ (orderBy/select mismatches)
    for (const fb of fallbacks) {
      try {
        return await model.findMany(fb);
      } catch {}
    }
    throw e;
  }
}

export default async function handler(req, res) {
  try {
    const session = await getClientSession(req);
    const userId = session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Your schema might use different model names. Try the most common ones.
    const resumeModel = pickModel(prisma, [
      'resume',
      'resumes',
      'Resume',
      'ResumeDraft',
      'resumeDraft',
      'ResumeDocument',
      'resumeDocument',
      'ResumeVersion',
      'resumeVersion',
    ]);

    const coverModel = pickModel(prisma, [
      'cover',
      'covers',
      'Cover',
      'CoverLetter',
      'coverLetter',
      'CoverDraft',
      'coverDraft',
      'CoverDocument',
      'coverDocument',
      'CoverVersion',
      'coverVersion',
    ]);

    // If your DB doesn’t have these models (yet), don't 500 — just return empty arrays.
    if (!resumeModel && !coverModel) {
      return res.status(200).json({ resumes: [], covers: [] });
    }

    const resumesPromise = resumeModel
      ? safeFindMany(
          resumeModel,
          {
            where: { userId },
            orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
            select: { id: true, name: true, isPrimary: true },
          },
          [
            // fallback 1: orderBy only updatedAt
            {
              where: { userId },
              orderBy: [{ updatedAt: 'desc' }],
              select: { id: true, name: true, isPrimary: true },
            },
            // fallback 2: orderBy createdAt
            {
              where: { userId },
              orderBy: [{ createdAt: 'desc' }],
              select: { id: true, name: true, isPrimary: true },
            },
            // fallback 3: no orderBy
            {
              where: { userId },
              select: { id: true, name: true, isPrimary: true },
            },
            // fallback 4: minimal select (if name/isPrimary differ)
            {
              where: { userId },
              select: { id: true },
            },
          ]
        )
      : Promise.resolve([]);

    const coversPromise = coverModel
      ? safeFindMany(
          coverModel,
          {
            where: { userId },
            orderBy: [{ isPrimary: 'desc' }, { updatedAt: 'desc' }],
            select: { id: true, name: true, isPrimary: true },
          },
          [
            {
              where: { userId },
              orderBy: [{ updatedAt: 'desc' }],
              select: { id: true, name: true, isPrimary: true },
            },
            {
              where: { userId },
              orderBy: [{ createdAt: 'desc' }],
              select: { id: true, name: true, isPrimary: true },
            },
            {
              where: { userId },
              select: { id: true, name: true, isPrimary: true },
            },
            {
              where: { userId },
              select: { id: true },
            },
          ]
        )
      : Promise.resolve([]);

    const [resumesRaw, coversRaw] = await Promise.all([resumesPromise, coversPromise]);

    // Normalize output shape even if fallbacks returned partial fields
    const resumes = (resumesRaw || []).map((r) => ({
      id: r.id,
      name: r.name || r.title || r.filename || 'Resume',
      isPrimary: !!r.isPrimary,
    }));

    const covers = (coversRaw || []).map((c) => ({
      id: c.id,
      name: c.name || c.title || c.filename || 'Cover Letter',
      isPrimary: !!c.isPrimary,
    }));

    return res.status(200).json({ resumes, covers });
  } catch (e) {
    console.error('[apply/documents] error', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
