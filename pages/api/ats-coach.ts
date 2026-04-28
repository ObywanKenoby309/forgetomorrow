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

  if (
    s.includes('project') ||
    s.includes('stakeholder') ||
    s.includes('management') ||
    s.includes('experience') ||
    s.includes('ownership') ||
    s.includes('leadership') ||
    s.includes('delivery')
  ) {
    return 'experience';
  }

  return 'summary';
}

function cleanCoachValue(value: any) {
  return String(value || '')
    .replace(/\bfor example\b/gi, 'such as')
    .replace(/\be\.g\.,?\s*/gi, '')
    .replace(/\bcould add\b/gi, 'should only add if true')
    .replace(/\bcould include\b/gi, 'should only include if true')
    .replace(/\btransferable skills\b/gi, 'visible adjacent evidence')
    .trim();
}

function formatActionForText(action: any) {
  if (typeof action === 'string') return `• Required signal: ${action.trim()}`;
  if (!action || typeof action !== 'object') return '';

  const required = cleanCoachValue(action.requiredSignal || action.signal || action.requirement);
  if (!required) return '';

  const section = normalizeSection(action.section) || inferSectionFromSignal(required);
  const evidence = cleanCoachValue(action.resumeEvidence || action.evidence);
  const impact = cleanCoachValue(action.hiringImpact);
  const ifTrue = cleanCoachValue(action.ifTrue || action.if_true);
  const ifNotTrue = cleanCoachValue(action.ifNotTrue || action.if_not_true);
  const future = cleanCoachValue(action.futurePositioning);

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
        temperature: 0.15,
        max_tokens: 1900,
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
      .slice(0, 5)
      .map((exp: any, idx: number) => {
        const title = exp.title || exp.jobTitle || exp.role || '';
        const company = exp.company || '';
        const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
        const bulletText = bullets
          .filter((b: string) => typeof b === 'string' && b.trim().length > 0)
          .slice(0, 2)
          .join(' | ');
        return `${idx + 1}. ${title} at ${company}${bulletText ? ` - ${bulletText}` : ''}`;
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

    const jdPreview = jdText.length > 2600 ? jdText.slice(0, 2600) + '\n\n[truncated]' : jdText;

    const userPrompt = `
You are a senior HR recruiter and hiring strategist embedded inside ForgeTomorrow.

You are NOT a generic resume writer.
You are NOT giving canned ATS advice.
You are judging whether the candidate's visible resume evidence would help a senior HR recruiter move this candidate forward for THIS job description.

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

PRIMARY DECISION QUESTION
-------------------------
Would a senior HR recruiter see enough evidence in the selected section to support moving this candidate forward for this JD?

ONE-CALL SECTION BUCKET RULE
----------------------------
If selected section is overview, produce ONE complete review that the UI will split into section cards.

For selected section overview, you MUST return section-tagged improvementActions for:
1. summary
2. skills
3. experience
4. education ONLY if the JD explicitly requires a degree, certification, license, or formal credential

The summary, skills, and experience sections are mandatory for overview.
Always return at least one improvementAction with "section": "summary".
Always return at least one improvementAction with "section": "skills".
Always return at least one improvementAction with "section": "experience".

Education is optional. Only return education if the JD explicitly requires degree, certification, license, or formal credential.

If a section is already strong, still return an action for that section explaining:
- what is working
- what JD signal it supports
- why that helps the hiring decision
- any small improvement if useful

Do not invent gaps just to criticize.

SECTION ROUTING RULES
---------------------
- Summary = first-impression positioning and whether the current Summary creates favorable alignment.
- Skills = tools, technologies, APIs, platforms, hard skills, skill-list placement.
- Experience = work-history proof, projects, ownership, leadership, stakeholder coordination, delivery, outcomes.
- Education = degrees, certifications, licenses, formal credentials only.

Do not combine multiple sections into one action.
Do not put tools/API feedback into summary unless it is specifically about how the Summary positions the candidate.
Do not put project/leadership/delivery feedback into skills.
Do not put skills/tools/API feedback into experience unless the action is about proving how those skills were used in work history.

SUMMARY SECTION STANDARD
------------------------
The Summary is a review of the user's current resume Summary only.

For the summary action, answer this exact question:
"Would a senior HR recruiter read this Summary and see enough first-impression alignment with this JD to favor moving the candidate forward?"

If the Summary is strong:
- Say it is strong.
- Explain what is working.
- Explain which JD signals the Summary already supports.
- Explain why that helps the hiring decision.
- Suggest only small improvements if needed.
- Do not invent gaps just to criticize.

If the Summary is weak or incomplete:
- Say what is missing or unclear.
- Explain why that missing or weak signal creates hiring risk.
- Give honest improvement guidance using only visible resume evidence.
- Do not claim tools, years, certifications, education, platforms, or experience not proven by the resume.

For summary actions:
- "section" must be "summary".
- "requiredSignal" should describe the Summary alignment signal, not the whole resume.
- "resumeEvidence" must compare the current Summary to the JD.
- "hiringImpact" must explain how the Summary affects first impression.
- "ifTrue" must explain what evidence can be added to the Summary if the candidate truly has it.
- "ifNotTrue" must explain what not to claim and what honest adjacent positioning to use instead.

SKILLS SECTION STANDARD
-----------------------
The Skills section is a review of the user's skills list only.

For the skills action, answer this exact question:
"Would a senior HR recruiter see the required tools, technologies, platforms, APIs, or hard skills quickly enough in the Skills section?"

If the Skills section is strong:
- Say what is working.
- Explain which JD skill signals it supports.
- Explain why that helps the recruiter quickly confirm fit.
- Suggest only small placement or naming improvements if useful.

If the Skills section is weak:
- Say what required skill/tool signal is missing or unclear.
- Explain why that creates screening risk.
- If the resume does not prove the skill/tool/platform/API, do not tell the user to add it as fact.
- Use conditional guidance: only add it if the candidate has truly used it.
- If not true, name the closest visible adjacent technical evidence from the resume snapshot.

For skills actions:
- "section" must be "skills".
- "requiredSignal" should describe the skill/tool signal.
- "resumeEvidence" must compare current Skills to the JD.
- "hiringImpact" must explain how this affects fast screening.
- "ifTrue" must explain exactly how to place proven skills/tools honestly.
- "ifNotTrue" must explain what not to claim and which visible adjacent skill area to strengthen instead.

EXPERIENCE SECTION STANDARD
---------------------------
The Experience section is a review of the user's work-history evidence only.

For the experience action, answer this exact question:
"Would a senior HR recruiter see enough work-history proof that this candidate has delivered relevant projects, ownership, leadership, stakeholder coordination, or outcomes for this JD?"

If the Experience section is strong:
- Say what work-history proof is working.
- Explain which JD signal it supports.
- Explain why that helps the hiring decision.
- Suggest only small improvements if useful.

If the Experience section is weak:
- Say what work-history proof is missing or unclear.
- Explain why that creates hiring risk.
- Give honest improvement guidance using only visible resume evidence.
- Do not claim tools, years, platforms, or project outcomes not proven by the resume.

For experience actions:
- "section" must be "experience".
- "requiredSignal" should describe the experience/work-history signal.
- "resumeEvidence" must compare current experience evidence to the JD.
- "hiringImpact" must explain how that affects recruiter confidence.
- "ifTrue" must explain what project/ownership/stakeholder/outcome evidence can be added if true.
- "ifNotTrue" must explain what not to claim and what honest adjacent delivery evidence to strengthen instead.

LANGUAGE LOCK
-------------
Use strong, guided, evidence-structure language.

Do NOT use:
- "could add"
- "could include"
- "for example"
- "e.g."
- "highlight transferable skills"
- "add X" unless the resume snapshot already proves X
- generic fallback language
- vague advice like "improve the summary" or "tailor the resume"

Use this style instead:
- "If true, the strongest proof would show..."
- "If true, place this as..."
- "If not true, do not claim it. Strengthen..."
- "The recruiter risk is..."
- "This section already helps because..."
- "This section is weak because..."

HONESTY RULES
-------------
- Do not tell the seeker to claim something not proven by the resume.
- If a required signal is missing, use conditional guidance.
- The ifTrue field explains what real evidence would strengthen the section if the candidate truly has it.
- The ifNotTrue field tells the candidate not to claim it and names the closest honest adjacent evidence already visible.
- Do not write fictional example bullets with made-up tools, metrics, or outcomes.
- Do not mention LinkedIn.
- Do not return vague fallback like "leadership and problem-solving" unless you tie it to specific visible evidence from the resume snapshot.

VISIBLE ADJACENT EVIDENCE OPTIONS
---------------------------------
When true experience is missing, use the closest specific visible adjacent evidence from the resume snapshot, such as:
- ForgeTomorrow platform ownership
- explainable AI or responsible automation
- platform architecture and systems design
- Next.js, APIs, or data-driven systems
- live production delivery
- product, architecture, and business strategy alignment
- cross-functional leadership and mentorship
- operational execution and delivery

Only use adjacent evidence that appears supported by the resume snapshot.

QUALITY BAR
-----------
Be direct.
Be specific.
Do not flatter.
Do not invent experience.
Do not provide generic resume advice.
Every action must be useful inside its own section card.
Every action must help the seeker decide what they can honestly add, what they must not claim, and what nearby evidence they can strengthen.

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
            const improved = cleanCoachValue(b?.improved);
            const reason = cleanCoachValue(b?.reason);
            if (!improved) return '';
            return `${i + 1}. ${improved}${reason ? ` - Why: ${reason}` : ''}`;
          })
          .filter(Boolean)
          .join('\n')
      : '';

    const summaryFixText =
      parsed.summaryFix && typeof parsed.summaryFix === 'object'
        ? [
            cleanCoachValue(parsed.summaryFix.improved),
            cleanCoachValue(parsed.summaryFix.reason)
              ? `Why: ${cleanCoachValue(parsed.summaryFix.reason)}`
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
      cleanCoachValue(parsed.opening),
      cleanCoachValue(parsed.matchAssessment) ? `Match Assessment: ${cleanCoachValue(parsed.matchAssessment)}` : '',
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
