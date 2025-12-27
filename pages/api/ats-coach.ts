// pages/api/ats-coach.ts
// AI Writing Coach for ATS alignment — used by The Forge Hammer
// RESTORED: Groq = Coach. OpenAI = Score (Teacher).

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

type CoachRequestBody = {
  jdText?: string;
  resumeData?: {
    summary?: string;
    skills?: string[];
    workExperiences?: any[];
    experiences?: any[];
    educationList?: any[];
    education?: any[];
  };
  context?: any;
  missing?: any;
};

type CoachResponse =
  | {
      ok: true;
      text: string;
      tips: string[];
      raw?: string;
      upgrade?: boolean;
    }
  | {
      ok: false;
      error: string;
      upgrade?: boolean;
    };

function monthKeyUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function normalizeRole(v: any) {
  return String(v || '').toUpperCase().trim();
}

function roleIsUnlimited(role: string) {
  const r = normalizeRole(role);
  return r === 'RECRUITER' || r === 'COACH' || r === 'ADMIN';
}

/**
 * Forge Hammer Gate (FREE = 3 uses/month across BOTH coach + score).
 * Uses User.resumeAlignFreeUses + User.resumeAlignLastResetMonth (DB source of truth).
 */
async function enforceHammerGate(userId: string) {
  const monthKey = monthKeyUTC(new Date());

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        resumeAlignFreeUses: true,
        resumeAlignLastResetMonth: true,
      },
    });

    const tier = (user?.plan as any) ? String(user?.plan) : 'FREE';
    const isFree = String(tier).toUpperCase() === 'FREE';

    if (!isFree) {
      return { allowed: true, remaining: null as number | null, tier };
    }

    const last = (user?.resumeAlignLastResetMonth || '').toString();
    const currentUses = Number(user?.resumeAlignFreeUses || 0);

    // Reset on new month
    if (last !== monthKey) {
      await tx.user.update({
        where: { id: userId },
        data: {
          resumeAlignFreeUses: 1, // consume this call
          resumeAlignLastResetMonth: monthKey,
        },
      });
      return { allowed: true, remaining: 2, tier };
    }

    // Same month: enforce 3/month
    if (currentUses >= 3) {
      return { allowed: false, remaining: 0, tier };
    }

    const nextUses = currentUses + 1;
    await tx.user.update({
      where: { id: userId },
      data: { resumeAlignFreeUses: { increment: 1 } },
    });

    return { allowed: true, remaining: Math.max(0, 3 - nextUses), tier };
  });
}

async function resolveUserId(session: any): Promise<string | null> {
  const directId = session?.user?.id;
  if (directId) return String(directId);

  const email = session?.user?.email ? String(session.user.email).toLowerCase().trim() : '';
  if (!email) return null;

  const u = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return u?.id ? String(u.id) : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<CoachResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // === AUTH (Hammer is not anonymous) ===
  const session = await getServerSession(req, res, authOptions);
  const userId = await resolveUserId(session);
  if (!userId) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const role = normalizeRole((session?.user as any)?.role);

  // === GATE (FREE = 3/month across Hammer) ===
  // Recruiter/Coach/Admin are NEVER gatekept.
  if (!roleIsUnlimited(role)) {
    try {
      const gate = await enforceHammerGate(userId);

      if (!gate.allowed) {
        return res.status(200).json({
          ok: true,
          upgrade: true,
          text: 'Free tier limit reached (3 Forge Hammer uses/month). Upgrade to Seeker Pro for unlimited Hammer usage.',
          tips: [
            'Free tier: 3 Forge Hammer uses/month used.',
            'Upgrade to Seeker Pro for unlimited Coach + Score and deeper rewrites.',
          ],
          raw: 'Free tier limit reached (3 Forge Hammer uses/month). Upgrade to Seeker Pro for unlimited Hammer usage.',
        });
      }
    } catch (e) {
      console.error('[ats-coach] gate error', e);
      return res.status(500).json({
        ok: false,
        error: 'Unable to validate plan usage. Please try again.',
      });
    }
  }

  // === GROQ KEY ===
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'GROQ_API_KEY is not configured' });
  }

  // Optional model override (keeps behavior stable + configurable)
  const model = process.env.GROQ_COACH_MODEL || 'llama-3.1-8b-instant';

  try {
    const body = (req.body || {}) as CoachRequestBody;

    const jdText = (body.jdText || '').toString();
    const rd = body.resumeData || {};

    const summary = (rd.summary || '').toString();
    const skills = (rd.skills || []) as string[];

    // Support both workExperiences and experiences shapes
    const experiences = (rd.workExperiences || rd.experiences || []) as any[];
    const education = (rd.educationList || rd.education || []) as any[];

    const safeSkills = (skills || []).filter((s) => typeof s === 'string' && s.trim().length > 0);

    const expSnippets = experiences
      .slice(0, 4)
      .map((exp: any, idx: number) => {
        const title = exp.title || exp.jobTitle || exp.role || '';
        const company = exp.company || '';
        const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
        const firstBullet = bullets.find((b: string) => typeof b === 'string' && b.trim().length > 0) || '';
        return `${idx + 1}. ${title} at ${company}${firstBullet ? ` — ${firstBullet}` : ''}`;
      })
      .join('\n');

    const eduSnippets = education
      .slice(0, 3)
      .map((ed: any, idx: number) => {
        const school = ed.school || ed.institution || '';
        const degree = ed.degree || '';
        const field = ed.field || ed.program || '';
        return `${idx + 1}. ${degree} ${field} at ${school}`.trim();
      })
      .join('\n');

    const jdPreview = jdText.length > 1800 ? jdText.slice(0, 1800) + '\n\n[truncated]' : jdText;

    const userPrompt = `
You are a resume-writing COACH helping a job seeker improve their resume against a specific JD.
Be concrete, kind, and focused on real-world improvements — no generic fluff.

JOB DESCRIPTION (JD)
--------------------
${jdPreview || '[No JD supplied]'}

CURRENT RESUME SNAPSHOT
-----------------------
Summary:
${summary || '[No summary provided]'}

Key Skills:
${safeSkills.length ? safeSkills.join(', ') : '[No skills provided]'}

Recent Experience (top 4 roles max):
${expSnippets || '[No experience provided]'}

Education:
${eduSnippets || '[No education data provided]'}

INSTRUCTIONS
------------
1) Start with one short, encouraging sentence.
2) Provide 3–7 specific, ATS-friendly improvements.
   - Call out missing keywords/tools from the JD.
   - Suggest 1–2 measurable bullet ideas (%, $, time).
3) Do NOT rewrite the entire resume. Focus on changes they can make in 15–30 minutes.
4) Return plain text, structured so it can be split into bullet points.
`.trim();

    // Groq OpenAI-compatible chat completions endpoint
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a supportive, practical resume coach. Return plain text.' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 900,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.toString().trim() || '';

    const lines = raw.split('\n').map((l: string) => l.trim());
    const tips: string[] = [];

    for (const line of lines) {
      if (!line) continue;
      const cleaned = line.replace(/^[-•\d.)\s]+/, '').trim();
      if (cleaned) tips.push(cleaned);
    }

    return res.status(200).json({
      ok: true,
      text: raw,
      tips,
      raw,
    });
  } catch (err: any) {
    console.error('[ats-coach] error', err);
    return res.status(500).json({ ok: false, error: 'AI coach request failed. Please try again.' });
  }
}
