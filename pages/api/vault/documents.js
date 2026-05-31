// pages/api/vault/documents.js
// ForgeVault aggregator — returns artifact types that don't have their own
// standalone list endpoints:
//   - interviewPreps  (SeekerInterviewPrep, joined through Application)
//   - professionalProfile (ProfessionalOperatingProfile, one per user)
//
// All other types (resume, cover, roadmap, negotiation, packet, strategy)
// are fetched client-side from their existing dedicated list endpoints.
//
// Auth: NextAuth session (same pattern as resume/list.js, cover/list.js, etc.)

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

function safe(value, fallback = '') {
  return String(value || '').trim() || fallback;
}

function safeJsonParse(value) {
  try {
    if (!value) return null;
    if (typeof value === 'object') return value;
    return JSON.parse(value);
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
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = session.user.id;

    const [rawPreps, rawProfile] = await Promise.all([
      // Interview prep: pull through applications so we can surface job context
      prisma.seekerInterviewPrep.findMany({
        where: {
          application: { userId },
        },
        orderBy: { generatedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          applicationId: true,
          generatedAt: true,
          updatedAt: true,
          result: true,
          application: {
            select: {
              id: true,
              title: true,
              company: true,
              job: {
                select: { id: true, title: true, company: true },
              },
            },
          },
        },
      }),

      // Professional Operating Profile — one per user
      prisma.professionalOperatingProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          snapshotJson: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
    ]);

    // ── Normalize interview preps ───────────────────────────────────────────
    const interviewPreps = rawPreps.map((p) => {
      const app = p.application || {};
      const job = app.job || {};
      const jobTitle = safe(app.title || job.title, null) || null;
      const company = safe(app.company || job.company, null) || null;

      const nameParts = ['Interview Prep'];
      if (jobTitle) nameParts.push(`· ${jobTitle}`);
      if (company) nameParts.push(`@ ${company}`);

      return {
        id: p.id,
        applicationId: p.applicationId,
        name: nameParts.join(' '),
        jobTitle,
        company,
        generatedAt: p.generatedAt,
        updatedAt: p.updatedAt || p.generatedAt,
        result: safeJsonParse(p.result),
      };
    });

    // ── Normalize POP ──────────────────────────────────────────────────────
    const professionalProfile = rawProfile
      ? {
          id: rawProfile.id,
          snapshotJson: safeJsonParse(rawProfile.snapshotJson),
          updatedAt: rawProfile.updatedAt,
          createdAt: rawProfile.createdAt,
        }
      : null;

    return res.status(200).json({
      interviewPreps,
      professionalProfile,
    });
  } catch (err) {
    console.error('[api/vault/documents]', err);
    return res.status(500).json({ error: 'Could not load vault documents' });
  }
}