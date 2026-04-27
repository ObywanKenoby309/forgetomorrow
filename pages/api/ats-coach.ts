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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatActionForText(action: any) {
  if (typeof action === 'string') return `• ${action.trim()}`;

  if (!action || typeof action !== 'object') return '';

  const section = String(action.section || '').trim();
  const required = String(action.requiredSignal || action.signal || action.requirement || '').trim();
  const evidence = String(action.resumeEvidence || action.evidence || '').trim();
  const impact = String(action.hiringImpact || '').trim();
  const ifTrue = String(action.ifTrue || action.if_true || '').trim();
  const ifNotTrue = String(action.ifNotTrue || action.if_not_true || '').trim();
  const future = String(action.futurePositioning || '').trim();

  return [
    required ? `• Required signal: ${required}` : '',
    section ? `  Section: ${section}` : '',
    evidence ? `  Resume evidence: ${evidence}` : '',
    impact ? `  Hiring impact: ${impact}` : '',
    ifTrue ? `  If true: ${ifTrue}` : '',
    ifNotTrue ? `  If not true: ${ifNotTrue}` : '',
    future ? `  Future positioning: ${future}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function tipFromAction(action: any) {
  if (typeof action === 'string') return action;
  if (!action || typeof action !== 'object') return '';
  return String(action.requiredSignal || action.signal || action.requirement || '').trim();
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
You are a senior hiring strategist embedded inside ForgeTomorrow.

You are NOT a generic writing assistant.
You are evaluating why this resume would get rejected or advanced for this specific job description.

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

FORGETOMORROW RESUME COACHING MODE
----------------------------------
Before generating any suggestion, you MUST:

1) Detect the dominant hiring environment from the JD:
- Enterprise / Commercial
- Startup / Growth
- Nonprofit / Mission-driven
- Government / Public sector

2) Think like the hiring manager:
- Why would this resume get rejected right now?
- What signal is missing?
- What exact wording would improve the decision?

3) Focus on decision-changing improvements only:
- missing hiring signals
- weak or generic phrasing
- missing keywords/tools only if they are clearly relevant
- missing proof of ownership, outcomes, scale, speed, or ambiguity tolerance depending on the environment

OUTPUT RULES
------------
Return ONLY valid JSON in this exact shape:

{
  "opening": "",
  "environment": "",
  "matchAssessment": "",
  "signalGaps": [],
  "improvementActions": [],
  "bulletFixes": [
    {
      "original": "",
      "improved": "",
      "reason": ""
    }
  ],
  "summaryFix": {
    "original": "",
    "improved": "",
    "reason": ""
  },
  "reasoning": []
}

QUALITY RULES
-------------
- NEVER return plain text outside JSON
- NEVER return markdown
- NEVER give generic advice like "improve clarity" or "tailor more"
- EVERY improvement must map to a hiring decision signal
- EVERY bulletFix.improved must be immediately usable on the resume
- EVERY reason must explain why the change matters to this hiring team
- Do NOT rewrite the entire resume
- Focus on the highest-impact changes the user can make in 15–30 minutes

FINAL TEST
----------
Would this change how a hiring manager sees the candidate for this JD?
If not, rewrite it.

Return ONLY valid JSON.
`.trim();

    const requestBody = {
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are ForgeTomorrow resume intelligence. Return ONLY valid JSON. No markdown. No extra text.',
        },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.25,
      max_tokens: 850,
      response_format: { type: 'json_object' },
    };

    async function callGroq() {
      return await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    }

    // Groq can briefly rate-limit on TPM. Retry once instead of throwing an immediate 500.
    let response = await callGroq();

    if (response.status === 429) {
      await sleep(2200);
      response = await callGroq();
    }

    if (!response.ok) {
      const err = await response.text();

      if (response.status === 429) {
        return res.status(200).json({
          ok: true,
          text:
            'The coach is temporarily busy because the AI provider rate limit was reached. Please run this again in a few seconds.',
          tips: ['Temporary AI rate limit reached. Try again in a few seconds.'],
          raw: err,
        });
      }

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
      throw new Error('Coach returned invalid JSON');
    }

    const tips: string[] = [
      ...(Array.isArray(parsed.signalGaps) ? parsed.signalGaps : []),
      ...(Array.isArray(parsed.improvementActions)
        ? parsed.improvementActions.map((x: any) => tipFromAction(x))
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
            .map((x: any) => formatActionForText(x))
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
