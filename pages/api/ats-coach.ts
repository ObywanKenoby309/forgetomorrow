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

function normalizeSection(value: any) {
  const section = String(value || '').toLowerCase().trim();
  if (section === 'summary' || section === 'skills' || section === 'experience' || section === 'education') {
    return section;
  }
  return '';
}

function inferSectionFromSignal(signal: any) {
  const s = String(signal || '').toLowerCase();

  if (s.includes('education') || s.includes('degree') || s.includes('certification') || s.includes('license')) {
    return 'education';
  }

  if (s.includes('tool') || s.includes('api') || s.includes('llm') || s.includes('skill')) {
    return 'skills';
  }

  if (s.includes('project') || s.includes('stakeholder') || s.includes('management') || s.includes('experience') || s.includes('ownership')) {
    return 'experience';
  }

  return 'summary';
}

function formatActionForText(action: any) {
  if (typeof action === 'string') return `• Required signal: ${action.trim()}`;
  if (!action || typeof action !== 'object') return '';

  const required = String(action.requiredSignal || action.signal || action.requirement || '').trim();
  if (!required) return '';

  const section = normalizeSection(action.section) || inferSectionFromSignal(required);
  const evidence = String(action.resumeEvidence || action.evidence || '').trim();
  const impact = String(action.hiringImpact || '').trim();
  const ifTrue = String(action.ifTrue || action.if_true || '').trim();
  const ifNotTrue = String(action.ifNotTrue || action.if_not_true || '').trim();
  const future = String(action.futurePositioning || '').trim();

  return [
    `• Required signal: ${required}`,
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

async function callGroq(apiKey: string, model: string, userPrompt: string) {
  let lastStatus = 0;
  let lastText = '';

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
        max_tokens: 1200,
      }),
    });

    if (response.ok) return response;

    lastStatus = response.status;
    lastText = await response.text();

    if (response.status === 429 && attempt === 0) {
      await sleep(1800);
      continue;
    }

    break;
  }

  throw new Error(`Groq API error: ${lastStatus} - ${lastText}`);
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

  const model = process.env.GROQ_COACH_MODEL || 'llama-3.1-8b-instant';

  try {
    const body = (req.body || {}) as CoachRequestBody;

    const jdText = (body.jdText || '').toString();
    const rd = body.resumeData || {};
    const context = body.context || { section: 'overview', keyword: null };
    const selectedSection = String(context?.section || 'overview').toLowerCase().trim();
    const keyword = context?.keyword ? String(context.keyword) : '';

    const summary = (rd.summary || '').toString();
    const skills = (rd.skills || []) as string[];

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
        return `${idx + 1}. ${title} at ${company}${firstBullet ? ` - ${firstBullet}` : ''}`;
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

    const jdPreview = jdText.length > 2200 ? jdText.slice(0, 2200) + '\n\n[truncated]' : jdText;

    const userPrompt = `
You are a senior HR recruiter and hiring strategist embedded inside ForgeTomorrow.

You are NOT a generic resume writing assistant.
You review the selected resume section against this specific job description.
Your job is to help the seeker make an honest hiring-alignment decision.

SELECTED SECTION
----------------
${selectedSection}
${keyword ? `FOCUS KEYWORD: ${keyword}` : ''}

JOB DESCRIPTION
---------------
${jdPreview || '[No JD supplied]'}

CURRENT RESUME SNAPSHOT
-----------------------
Summary:
${summary || '[No summary provided]'}

Key Skills:
${safeSkills.length ? safeSkills.join(', ') : '[No skills provided]'}

Recent Experience:
${expSnippets || '[No experience provided]'}

Education:
${eduSnippets || '[No education data provided]'}

PRIMARY QUESTION
----------------
Would a senior HR recruiter see enough alignment in the selected section to support moving this candidate forward for this JD?

SECTION ROUTING RULES
---------------------
- If selected section is overview, return the highest-impact actions across summary, skills, experience, and education.
- If selected section is summary, evaluate ONLY the current Summary against the JD. Every improvementAction must use "section": "summary".
- If selected section is skills, evaluate ONLY skills/tools/technologies/hard skills. Every improvementAction must use "section": "skills".
- If selected section is experience, evaluate ONLY projects, ownership, leadership, stakeholder work, delivery, and outcomes. Every improvementAction must use "section": "experience".
- If selected section is education, return education feedback only if the JD explicitly requires a degree, certification, license, or formal credential. Every improvementAction must use "section": "education".

SUMMARY SECTION STANDARD
------------------------
If selected section is summary:
- Say whether the current Summary creates a strong first impression for this JD or not.
- If aligned, say what is working and why it helps the hiring decision.
- If weak, say what is missing or unclear and why it creates hiring risk.
- Give honest improvement guidance using only visible resume evidence.
- Do not invent tools, years, certifications, platforms, education, or experience.

HONESTY RULES
-------------
- Do not tell the seeker to claim something not proven by the resume.
- If a required signal is missing, use conditional guidance.
- The ifTrue field explains what real evidence would strengthen the section if the candidate truly has it.
- The ifNotTrue field tells the candidate not to claim it and names the closest honest adjacent evidence already visible.
- Do not write fictional example bullets with made-up tools, metrics, or outcomes.
- Do not write "For example".
- Do not mention LinkedIn.

OUTPUT RULES
------------
Return ONLY valid JSON in this exact shape:

{
  "opening": "",
  "environment": "",
  "matchAssessment": "",
  "signalGaps": [],
  "improvementActions": [
    {
      "section": "summary | skills | experience | education",
      "requiredSignal": "",
      "resumeEvidence": "",
      "hiringImpact": "",
      "ifTrue": "",
      "ifNotTrue": "",
      "futurePositioning": ""
    }
  ],
  "bulletFixes": [],
  "summaryFix": {
    "original": "",
    "improved": "",
    "reason": ""
  },
  "reasoning": []
}

Return ONLY valid JSON.
`.trim();

    const response = await callGroq(apiKey, model, userPrompt);
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

    const actions = Array.isArray(parsed.improvementActions) ? parsed.improvementActions : [];

    const tips: string[] = [
      ...(Array.isArray(parsed.signalGaps) ? parsed.signalGaps : []),
      ...actions.map(tipFromAction),
    ]
      .map((x: any) => String(x || '').trim())
      .filter(Boolean);

    const bulletFixText = Array.isArray(parsed.bulletFixes)
      ? parsed.bulletFixes
          .map((b: any, i: number) => {
            const improved = String(b?.improved || '').trim();
            const reason = String(b?.reason || '').trim();
            if (!improved) return '';
            return `${i + 1}. ${improved}${reason ? ` - Why: ${reason}` : ''}`;
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

    const actionText = actions
      .map(formatActionForText)
      .filter(Boolean)
      .join('\n');

    const textParts = [
      String(parsed.opening || '').trim(),
      String(parsed.matchAssessment || '').trim() ? `Match Assessment: ${String(parsed.matchAssessment).trim()}` : '',
      bulletFixText ? `Bullet Fixes:\n${bulletFixText}` : '',
      summaryFixText ? `Summary Fix:\n${summaryFixText}` : '',
      actionText ? `Improvement Actions:\n${actionText}` : '',
    ].filter(Boolean);

    return res.status(200).json({
      ok: true,
      text: textParts.join('\n\n'),
      tips,
      raw,
    });
  } catch (err: any) {
    console.error('[ats-coach] error', err);

    const message = String(err?.message || '');
    if (message.includes('429') || message.toLowerCase().includes('rate_limit')) {
      return res.status(200).json({
        ok: true,
        text: 'Coach is receiving too many requests right now. Wait a few seconds and run the coach again.',
        tips: ['Groq rate limit reached. Wait a few seconds and retry.'],
        raw: message,
      });
    }

    return res.status(500).json({ ok: false, error: 'AI coach request failed. Please try again.' });
  }
}
