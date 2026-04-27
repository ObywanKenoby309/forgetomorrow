// pages/api/ats-coach.ts
// AI Writing Coach for ATS alignment — used by The Forge Hammer
// RESTORED: Groq = Coach. OpenAI = Score (Teacher).

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
const { buildSectionCoachPrompt } = require('@/lib/forge/strategyBrain');

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

    const userPrompt = buildSectionCoachPrompt({
  jdText,
  resumeData: {
    summary,
    skills: safeSkills,
    workExperiences: experiences,
    educationList: education,
  },
  context: body.context || { section: 'overview', keyword: null },
  missing: body.missing || {},
});

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
          { role: 'system', content: 'You are ForgeTomorrow resume intelligence. Return ONLY valid JSON. No markdown. No extra text.' },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.25,
        max_tokens: 1600,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${err}`);
    }

        const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.toString().trim() || '';

    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          parsed = JSON.parse(raw.slice(start, end + 1));
        } catch {
          parsed = null;
        }
      }
    }

    if (!parsed || typeof parsed !== 'object') {
  return res.status(200).json({
    ok: true,
    text: raw || 'Coach returned a response, but it could not be formatted cleanly. Try again.',
    tips: [],
    raw,
  });
}

    const tips: string[] = [
      ...(Array.isArray(parsed.signalGaps) ? parsed.signalGaps : []),
      ...(Array.isArray(parsed.improvementActions)
  ? parsed.improvementActions.map((x: any) =>
      typeof x === 'string'
        ? x
        : x?.requiredSignal || x?.signal || x?.requirement || ''
    )
  : []),
    ]
      .map((x: any) => String(x || '').trim())
      .filter(Boolean);

    const bulletFixText = Array.isArray(parsed.bulletFixes)
      ? parsed.bulletFixes
          .map((b: any, i: number) => {
            const improved = String(b?.improved || '').trim();
            const reason = String(b?.reason || '').trim();
            if (!improved) return '';
            return `${i + 1}. ${improved}${reason ? ` — Why: ${reason}` : ''}`;
          })
          .filter(Boolean)
          .join('\n')
      : '';

    const summaryFixText =
      parsed.summaryFix && typeof parsed.summaryFix === 'object'
        ? [
            String(parsed.summaryFix.improved || '').trim(),
            String(parsed.summaryFix.reason || '').trim()
              ? `Why: ${String(parsed.summaryFix.reason || '').trim()}`
              : '',
          ]
            .filter(Boolean)
            .join('\n')
        : '';

    const textParts = [
      String(parsed.opening || '').trim(),
      String(parsed.matchAssessment || '').trim() ? `Match Assessment: ${String(parsed.matchAssessment).trim()}` : '',
      bulletFixText ? `Bullet Fixes:\n${bulletFixText}` : '',
      summaryFixText ? `Summary Fix:\n${summaryFixText}` : '',
      Array.isArray(parsed.improvementActions) && parsed.improvementActions.length
  ? `Improvement Actions:\n${parsed.improvementActions
      .map((x: any) => {
        if (typeof x === 'string') return `• ${x.trim()}`;

        if (x && typeof x === 'object') {
          const required = String(x.requiredSignal || x.signal || x.requirement || '').trim();
          const evidence = String(x.resumeEvidence || x.evidence || '').trim();
          const ifTrue = String(x.ifTrue || x.if_true || '').trim();
          const ifNotTrue = String(x.ifNotTrue || x.if_not_true || '').trim();
		  const section = String(x.section || '').trim();

          return [
            required ? `• Required signal: ${required}` : '',
			section ? `  Section: ${section}` : '',
            evidence ? `  Resume evidence: ${evidence}` : '',
            ifTrue ? `  If true: ${ifTrue}` : '',
            ifNotTrue ? `  If not true: ${ifNotTrue}` : '',
          ]
            .filter(Boolean)
            .join('\n');
        }

        return '';
      })
      .filter(Boolean)
      .join('\n')}`
  : '',
    ].filter(Boolean);

    return res.status(200).json({
      ok: true,
      text: textParts.join('\n\n'),
      tips,
      raw,
    });
  } catch (err: any) {
    console.error('[ats-coach] error', err);
    return res.status(500).json({ ok: false, error: 'AI coach request failed. Please try again.' });
  }
}
