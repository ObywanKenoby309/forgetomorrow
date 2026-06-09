// pages/api/ats-coach.ts
// AI Writing Coach for ATS alignment — used by The Forge Hammer
// Groq = Coach. OpenAI = Score (Teacher).
// Uses strategyBrain.buildSectionCoachPrompt for world-class prompt intelligence.

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { buildSectionCoachPrompt } from '@/lib/forge/strategyBrain';
import { buildExplain } from "@/lib/intelligence/whyEngine";
import buildPromptContext from '@/lib/intelligence/buildPromptContext';

type CoachRequestBody = {
  jdText?: string;
  resumeData?: {
    summary?: string;
    skills?: string[];
    workExperiences?: any[];
    experiences?: any[];
    educationList?: any[];
    education?: any[];
    certifications?: any[];
    certificationList?: any[];
    certificationsList?: any[];
    languages?: any[];
    projects?: any[];
    achievements?: any[];
    awards?: any[];
    volunteerExperiences?: any[];
    volunteerExperience?: any[];
  };
  context?: any;
  missing?: any;
  attemptCount?: number;
  jobMeta?: {
    title?: string;
    company?: string;
    location?: string;
  } | null;
};

export type ImprovementAction = {
  section: 'summary' | 'skills' | 'experience' | 'education' | 'certifications' | 'languages';
  requiredSignal: string;
  resumeEvidence: string;
  decisionQuestion: string;
  hiringImpact: string;
  ifTrue: string;
  ifNotTrue: string;
  futurePositioning: string;
};

export type CoachStructured = {
  opening: string;
  environment: string;
  matchAssessment: string;
  signalGaps: string[];
  improvementActions: ImprovementAction[];
  bulletFixes: { original: string; improved: string; reason: string }[];
  summaryFix: { original: string; improved: string; reason: string } | null;
};

type TrajectoryData = {
  triggered: true;
  targetRole: string;
  gapSummary: string;
  suggestedRoles: { role: string; reason: string }[];
  coachMessage: string;
} | { triggered: false };

type CoachResponse =
  | {
    ok: true;
    score?: number | null;
    why?: any;
    text: string;
    tips: string[];
    structured: CoachStructured | null;
    trajectory: TrajectoryData;
    raw?: string;
    upgrade?: boolean;
  }
  | {
      ok: false;
      error: string;
      upgrade?: boolean;
    };

// ─── helpers ─────────────────────────────────────────────────────────────────

function monthKeyUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
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

function safe(v: any): string {
  return String(v || '').trim();
}

function normalizeSection(value: any) {
  const s = safe(value).toLowerCase();
  if (s === 'summary' || s === 'skills' || s === 'experience' || s === 'education') return s;
  if (s === 'certifications' || s === 'certification') return 'certifications';
  if (s === 'languages' || s === 'language') return 'languages';
  return '';
}

function inferSectionFromSignal(signal: any) {
  const s = safe(signal).toLowerCase();
  if (s.includes('certification') || s.includes('license') || s.includes('credential') || s.includes('itil')) return 'certifications';
  if (s.includes('education') || s.includes('degree')) return 'education';
  if (s.includes('tool') || s.includes('api') || s.includes('llm') || s.includes('skill')) return 'skills';
  if (s.includes('project') || s.includes('stakeholder') || s.includes('management') || s.includes('experience') || s.includes('ownership') || s.includes('leadership') || s.includes('delivery')) return 'experience';
  return 'summary';
}

function cleanCoachValue(value: any) {
  return safe(value)
    .replace(/\bfor example\b/gi, 'such as')
    .replace(/\be\.g\.,?\s*/gi, '')
    .replace(/\bcould add\b/gi, 'should only add if true')
    .replace(/\bcould include\b/gi, 'should only include if true')
    .replace(/\btransferable skills\b/gi, 'visible adjacent evidence');
}

function tipFromAction(action: any) {
  if (typeof action === 'string') return action;
  if (!action || typeof action !== 'object') return '';
  return safe(action.requiredSignal || action.signal || action.requirement);
}

// ─── gate ─────────────────────────────────────────────────────────────────────

async function enforceHammerGate(userId: string) {
  const monthKey = monthKeyUTC();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { plan: true, resumeAlignFreeUses: true, resumeAlignLastResetMonth: true },
    });

    const isFree = String(user?.plan || 'FREE').toUpperCase() === 'FREE';
    if (!isFree) return { allowed: true, remaining: null as number | null, tier: String(user?.plan) };

    const last = safe(user?.resumeAlignLastResetMonth);
    const uses = Number(user?.resumeAlignFreeUses || 0);

    if (last !== monthKey) {
      await tx.user.update({
        where: { id: userId },
        data: { resumeAlignFreeUses: 1, resumeAlignLastResetMonth: monthKey },
      });
      return { allowed: true, remaining: 2, tier: 'FREE' };
    }

    if (uses >= 3) return { allowed: false, remaining: 0, tier: 'FREE' };

    await tx.user.update({
      where: { id: userId },
      data: { resumeAlignFreeUses: { increment: 1 } },
    });

    return { allowed: true, remaining: Math.max(0, 3 - (uses + 1)), tier: 'FREE' };
  });
}

async function resolveUserId(session: any): Promise<string | null> {
  const directId = session?.user?.id;
  if (directId) return String(directId);

  const email = safe(session?.user?.email).toLowerCase();
  if (!email) return null;

  const u = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  return u?.id ? String(u.id) : null;
}

// ─── groq call ────────────────────────────────────────────────────────────────

async function callOpenAI(apiKey: string, model: string, prompt: string) {
  let lastStatus = 0;
  let lastText = '';

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
              'You are ForgeTomorrow resume intelligence. You are a senior HR recruiter and hiring strategist. Return ONLY valid JSON. No markdown. No extra text. No explanation outside the JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.15,
        max_tokens: 1600,
      }),
    });

    if (response.ok) return response;

    lastStatus = response.status;
    lastText = await response.text();

    if (response.status === 429 && attempt === 0) {
      await sleep(2000);
      continue;
    }

    break;
  }

  throw new Error(`OpenAI API error: ${lastStatus} - ${lastText}`);
}
// ─── structured → text (tips + legacy consumers) ─────────────────────────────

function structuredToText(s: CoachStructured): string {
  const parts: string[] = [];

  if (s.opening) parts.push(cleanCoachValue(s.opening));
  if (s.matchAssessment) parts.push(`Match Assessment: ${cleanCoachValue(s.matchAssessment)}`);

  const actionLines = s.improvementActions
    .map((a) => {
      const required = cleanCoachValue(a.requiredSignal);
      if (!required) return '';
      const section = normalizeSection(a.section) || inferSectionFromSignal(required);
      return [
        `• Required signal: ${required}`,
        section                         ? `  Section: ${section}` : '',
        a.resumeEvidence                ? `  Resume evidence: ${cleanCoachValue(a.resumeEvidence)}` : '',
        a.decisionQuestion              ? `  What the employer is trying to decide: ${cleanCoachValue(a.decisionQuestion)}` : '',
        a.hiringImpact                  ? `  Hiring impact: ${cleanCoachValue(a.hiringImpact)}` : '',
        a.ifTrue                        ? `  If true: ${cleanCoachValue(a.ifTrue)}` : '',
        a.ifNotTrue                     ? `  If not true: ${cleanCoachValue(a.ifNotTrue)}` : '',
        a.futurePositioning             ? `  Future positioning: ${cleanCoachValue(a.futurePositioning)}` : '',
      ].filter(Boolean).join('\n');
    })
    .filter(Boolean);

  if (actionLines.length) parts.push(`Improvement Actions:\n${actionLines.join('\n')}`);

  if (s.summaryFix?.improved) {
    const reason = s.summaryFix.reason ? `\nWhy: ${cleanCoachValue(s.summaryFix.reason)}` : '';
    parts.push(`Summary Fix:\n${cleanCoachValue(s.summaryFix.improved)}${reason}`);
  }

  return parts.join('\n\n');
}

// ─── normalise parsed response ────────────────────────────────────────────────

function normalizeStructured(parsed: any): CoachStructured {
  const actions = Array.isArray(parsed.improvementActions) ? parsed.improvementActions : [];

  return {
    opening: cleanCoachValue(parsed.opening),
    environment: safe(parsed.environment),
    matchAssessment: cleanCoachValue(parsed.matchAssessment),
    signalGaps: Array.isArray(parsed.signalGaps)
      ? parsed.signalGaps.map(cleanCoachValue).filter(Boolean)
      : [],
    improvementActions: actions
      .map((a: any) => ({
        section: (normalizeSection(a.section) || inferSectionFromSignal(a.requiredSignal)) as ImprovementAction['section'],
        requiredSignal:   cleanCoachValue(a.requiredSignal || a.signal || a.requirement),
        resumeEvidence:   cleanCoachValue(a.resumeEvidence || a.evidence),
        decisionQuestion: cleanCoachValue(a.decisionQuestion || a.employerDecision || a.whatEmployerIsDeciding),
        hiringImpact:     cleanCoachValue(a.hiringImpact),
        ifTrue:           cleanCoachValue(a.ifTrue || a.if_true),
        ifNotTrue:        cleanCoachValue(a.ifNotTrue || a.if_not_true),
        futurePositioning:cleanCoachValue(a.futurePositioning),
      }))
      .filter((a: ImprovementAction) => a.requiredSignal),
    bulletFixes: Array.isArray(parsed.bulletFixes)
      ? parsed.bulletFixes.map((b: any) => ({
          original: safe(b.original),
          improved: cleanCoachValue(b.improved),
          reason:   cleanCoachValue(b.reason),
        }))
      : [],
    summaryFix:
      parsed.summaryFix && typeof parsed.summaryFix === 'object'
        ? {
            original: safe(parsed.summaryFix.original),
            improved: cleanCoachValue(parsed.summaryFix.improved),
            reason:   cleanCoachValue(parsed.summaryFix.reason),
          }
        : null,
  };
}

// ─── trajectory evaluation ───────────────────────────────────────────────────

function shouldTriggerTrajectory(structured: CoachStructured, attemptCount: number): boolean {
  if (attemptCount < 2) return false;
  
  // Count survivable or worse signals across all actions
  const weakSignals = structured.improvementActions.filter(a => {
    const impact = (a.hiringImpact || '').toLowerCase();
    return (
      impact.includes('likely screen-out') ||
      impact.includes('major screening risk') ||
      impact.includes('moderate screening risk')
    );
  });

  // Trigger trajectory if 2+ core sections still have moderate or worse gaps after second attempt
  return weakSignals.length >= 2;
}

async function buildTrajectory(
  apiKey: string,
  model: string,
  structured: CoachStructured,
  jdText: string,
  resumeData: any,
  jobMeta: any
): Promise<TrajectoryData> {
  const targetRole = jobMeta?.title || 'the target role';
  const gaps = structured.improvementActions
    .filter(a => {
      const impact = (a.hiringImpact || '').toLowerCase();
      return impact.includes('screen-out') || impact.includes('screening risk');
    })
    .map(a => a.requiredSignal)
    .filter(Boolean)
    .join(', ');

  const resumeText = [
    resumeData?.summary || '',
    (resumeData?.skills || []).join(', '),
    (resumeData?.workExperiences || resumeData?.experiences || [])
      .map((e: any) => `${e.title || ''} at ${e.company || ''}`)
      .join(', '),
  ].filter(Boolean).join('. ');

  const trajectoryPrompt = `
You are a senior career strategist at ForgeTomorrow.

A seeker has attempted twice to align their resume to a target role and still has significant gaps.
Your job is NOT to discourage them. Your job is to be honest and redirect them toward roles where they are genuinely competitive RIGHT NOW — and show them the path to eventually reach their target role.

TARGET ROLE: ${targetRole}

PERSISTENT GAPS AFTER TWO ATTEMPTS:
${gaps || 'Multiple core signal gaps remain'}

RESUME SNAPSHOT:
${resumeText.slice(0, 1500)}

JOB DESCRIPTION CONTEXT:
${(jdText || '').slice(0, 800)}

Return ONLY valid JSON in this exact shape:
{
  "gapSummary": "One honest sentence explaining why the gap to the target role is currently too wide to close with resume edits alone.",
  "suggestedRoles": [
    { "role": "Role title", "reason": "Why this resume is competitive for this role right now." },
    { "role": "Role title", "reason": "Why this resume is competitive for this role right now." },
    { "role": "Role title", "reason": "Why this resume is competitive for this role right now." }
  ],
  "coachMessage": "One warm, honest, forward-looking sentence. Acknowledge the ambition, validate the adjacent strength, encourage connecting with a coach or mentor to build toward the target role. Do not be dismissive. Do not be falsely positive."
}

RULES:
- suggestedRoles must be real roles this resume could get interviews for TODAY based on what the resume actually proves.
- Do not suggest the target role or a variation of it.
- Do not invent experience the resume doesn't show.
- The coachMessage must feel human, not robotic. It should sound like a mentor, not a rejection letter.
- Return ONLY valid JSON.
`.trim();

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are ForgeTomorrow career intelligence. Return ONLY valid JSON.' },
          { role: 'user', content: trajectoryPrompt },
        ],
        temperature: 0.2,
        max_tokens: 600,
      }),
    });

    if (!response.ok) return { triggered: false };

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.toString().trim() || '';
    
    let parsed: any = null;
    try { parsed = JSON.parse(raw); } catch {
      const jsonStart = raw.indexOf('{');
const jsonEnd = raw.lastIndexOf('}');

if (jsonStart >= 0 && jsonEnd > jsonStart) {
  try {
    parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
  } catch {
    parsed = null;
  }
}
    }

    if (!parsed || !Array.isArray(parsed.suggestedRoles)) return { triggered: false };

    return {
      triggered: true,
      targetRole,
      gapSummary: safe(parsed.gapSummary),
      suggestedRoles: parsed.suggestedRoles
        .slice(0, 3)
        .map((r: any) => ({ role: safe(r.role), reason: safe(r.reason) }))
        .filter((r: any) => r.role),
      coachMessage: safe(parsed.coachMessage),
    };
  } catch {
    return { triggered: false };
  }
}

// ─── handler ──────────────────────────────────────────────────────────────────

export default async function handler(req: NextApiRequest, res: NextApiResponse<CoachResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Auth
  const session = await getServerSession(req, res, authOptions);
  const userId = await resolveUserId(session);
  if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  const role = normalizeRole((session?.user as any)?.role);

  // Gate — recruiters, coaches, admins are never gated
 const internalBypassGate = Boolean((req.body as any)?.internalBypassGate);

if (!internalBypassGate && !roleIsUnlimited(role)) {
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
          structured: null,
          trajectory: { triggered: false },
        });
      }
    } catch (e) {
      console.error('[ats-coach] gate error', e);
      return res.status(500).json({ ok: false, error: 'Unable to validate plan usage. Please try again.' });
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: 'OPENAI_API_KEY is not configured' });

  const model = process.env.OPENAI_COACH_MODEL || 'gpt-4.1-mini';

  try {
    const body = (req.body || {}) as CoachRequestBody;
	const internalBypassGate = Boolean((body as any)?.internalBypassGate);
    const jdText = safe(body.jdText);
    const resumeData = body.resumeData || {};
    const context = body.context || { section: 'overview', keyword: null };
    const missing = body.missing || {};
    const jobMeta = body.jobMeta || null;
    const requestedSection = String(context?.section || 'overview').toLowerCase().trim();
    // Map certifications/languages to their parent section for prompt building
    // but preserve the specific intent so the AI knows what was requested
    const promptSection = requestedSection === 'certifications' ? 'education'
      : requestedSection === 'languages' ? 'skills'
      : requestedSection === 'projects' ? 'experience'
      : requestedSection === 'volunteer' ? 'experience'
      : requestedSection === 'achievements' ? 'experience'
      : requestedSection;
    const sectionIntent = requestedSection === 'certifications'
      ? 'The seeker specifically clicked "Certifications" — focus coaching on certifications, licenses, and credentials that this JD requires or would strengthen the application. Do not give generic education coaching.'
      : requestedSection === 'languages'
      ? 'The seeker specifically clicked "Languages" — focus coaching on language skills, multilingual capabilities, and how to present them on the resume for this role.'
      : requestedSection === 'projects'
      ? 'The seeker specifically clicked "Projects" — evaluate whether any listed projects provide direct or supporting evidence for the JD requirements. If projects demonstrate relevant capabilities, name them and explain their credibility value. Do not return empty feedback if projects exist that are relevant to the JD.'
      : requestedSection === 'volunteer'
      ? 'The seeker specifically clicked "Volunteer Experience" — evaluate whether volunteer experience provides supporting credibility evidence for the JD. Name specific volunteer roles if they demonstrate relevant leadership, delivery, or stakeholder engagement. Do not return empty feedback if relevant volunteer experience exists.'
      : requestedSection === 'achievements'
      ? 'The seeker specifically clicked "Achievements" — evaluate whether listed achievements, awards, or recognitions strengthen recruiter confidence for this specific role. Name specific achievements if relevant. Do not return empty feedback if relevant achievements exist.'
      : '';
    const attemptCount = Number(body.attemptCount || 1);

    // ── Unified Career Intelligence — alignment mode ─────────────────────
    // Non-fatal: if unavailable, intelligenceBlock is empty string
    let intelligenceBlock = '';
    try {
      const intelligence = await buildPromptContext({ userId, mode: 'alignment' });
      if (intelligence) {
        const lines: string[] = [
          'CAREER INTELLIGENCE CONTEXT (ForgeTomorrow Unified Intelligence — alignment mode):',
        ];

        // Profile signals not in the current resume — this is the "you have it elsewhere" bridge
        if (Array.isArray(intelligence.proofSignals) && intelligence.proofSignals.length) {
          lines.push('');
          lines.push('PROVEN SIGNALS ACROSS FULL PROFILE (may not be in current resume):');
          intelligence.proofSignals.slice(0, 8).forEach((s: string) => lines.push(`- ${s}`));
        }

        // Credentials from profile + resume history — degrees, certs, licenses
        const creds = (intelligence as any).credentials;
        if (creds?.combined?.length) {
          lines.push('');
          lines.push('CREDENTIALS ON FILE (profile + resume history):');
          creds.combined.slice(0, 8).forEach((c: string) => lines.push(`- ${c}`));
        }

        // Known gaps — what the brain already knows is missing
        if (Array.isArray(intelligence.knownGaps) && intelligence.knownGaps.length) {
          lines.push('');
          lines.push('KNOWN GAPS (from career intelligence):');
          intelligence.knownGaps.slice(0, 5).forEach((g: string) => lines.push(`- ${g}`));
        }

        // Caution flags
        if (Array.isArray(intelligence.cautionFlags) && intelligence.cautionFlags.length) {
          lines.push('');
          lines.push('CAUTION FLAGS:');
          intelligence.cautionFlags.slice(0, 3).forEach((f: string) => lines.push(`- ${f}`));
        }

        if (lines.length > 1) {
          intelligenceBlock = lines.join('\n') + '\n\n'
            + 'IMPORTANT: If any gap identified in the JD alignment below can be closed by a signal '
            + 'already present in the PROVEN SIGNALS or CREDENTIALS sections above, '
            + 'tell the seeker explicitly: "You already have this on your profile — add it to your resume." '
            + 'Do NOT tell them to acquire something they already have.\n\n';
        }
      }
    } catch (err) {
      console.warn('[ats-coach] buildPromptContext failed — continuing without intelligence:', (err as any)?.message);
    }

function extractResumeText(resumeData: any) {
  if (!resumeData || typeof resumeData !== 'object') return '';

  const parts: string[] = [];
  const push = (value: any) => {
    const text = String(value || '').trim();
    if (text) parts.push(text);
  };

  push(resumeData.summary);
  push(resumeData.professionalSummary);
  push(resumeData?.personalInfo?.targetedRole);
  push(resumeData.targetedRole);
  push(resumeData.jobTitle);

  const skills = resumeData.skills || [];
  if (Array.isArray(skills)) push(skills.join(', '));

  const experiences =
    resumeData.workExperiences ||
    resumeData.experiences ||
    resumeData.experience ||
    [];

  for (const exp of Array.isArray(experiences) ? experiences : []) {
    push(exp?.title || exp?.jobTitle || exp?.role);
    push(exp?.company);
    push(exp?.description);
    if (Array.isArray(exp?.highlights)) push(exp.highlights.join(' '));
    if (Array.isArray(exp?.bullets)) push(exp.bullets.join(' '));
  }

  const projects = resumeData.projects || [];
  for (const project of Array.isArray(projects) ? projects : []) {
    push(project?.title || project?.name);
    push(project?.role);
    push(project?.description);
    if (Array.isArray(project?.bullets)) push(project.bullets.join(' '));
  }

  const volunteer = resumeData.volunteerExperiences || resumeData.volunteerExperience || resumeData.volunteer || [];
  for (const item of Array.isArray(volunteer) ? volunteer : []) {
    push(item?.title || item?.role);
    push(item?.organization || item?.company);
    push(item?.description);
    if (Array.isArray(item?.bullets)) push(item.bullets.join(' '));
  }

  const certs = resumeData.certifications || resumeData.certificationList || resumeData.certificationsList || [];
  for (const cert of Array.isArray(certs) ? certs : []) {
    if (typeof cert === 'string') {
      push(cert);
    } else {
      push(cert?.name || cert?.title || cert?.certification || cert?.label);
      push(cert?.issuer || cert?.organization || cert?.provider);
      push(cert?.description);
      push(cert?.credentialId);
      push(cert?.dateEarned || cert?.date || cert?.year);
    }
  }

  const education = resumeData.educationList || resumeData.education || [];
  for (const item of Array.isArray(education) ? education : []) {
    push(item?.degree);
    push(item?.field || item?.program);
    push(item?.school || item?.institution);
    push(item?.description);
  }

  const languages = resumeData.languages || [];
  for (const language of Array.isArray(languages) ? languages : []) {
    if (typeof language === 'string') push(language);
    else push([language?.name, language?.proficiency].filter(Boolean).join(' — '));
  }

  const achievements = resumeData.achievements || resumeData.awards || [];
  for (const item of Array.isArray(achievements) ? achievements : []) {
    if (typeof item === 'string') push(item);
    else {
      push(item?.title || item?.name);
      push(item?.description);
    }
  }

  return parts.filter(Boolean).join('\n');
}

const resumeText = extractResumeText(resumeData);
const why = buildExplain(resumeText, jdText);
const authoritativeResumeEvidence = `
AUTHORITATIVE CURRENT RESUME EVIDENCE:
This block is the current resume payload from the builder. Treat it as the source of truth for whether credentials, education, languages, projects, and achievements are present.
If a credential appears here, do NOT say it is missing. If the JD asks for a preferred credential that appears here, acknowledge it by name.
${resumeText || '[No resume evidence supplied]'}
`.trim();

    // ── Build prompt via strategyBrain ────────────────────────────────────
    // This restores the live-safe single Groq call flow.
    const brainPrompt = buildSectionCoachPrompt({
  jdText,
  resume: resumeData,
  context: { ...context, section: promptSection },
  missing,
  jobMeta: jobMeta as any,
  whyContext: why,
});

    // Inject specific intent for certifications/languages so AI doesn't give generic coaching
    const intentPrefix = sectionIntent
      ? `SECTION COACHING INTENT: ${sectionIntent}

`
      : '';

    // For overview calls, append a hard section-forcing instruction.
    // The brain's JSON template has section:"" which causes the 8B model
    // to collapse all actions to one section. This override prevents that.
    const prompt = requestedSection === 'overview'
      ? `${intelligenceBlock}${intentPrefix}${authoritativeResumeEvidence}${brainPrompt}

CRITICAL OUTPUT REQUIREMENT — MANDATORY:
You MUST return at least 3 improvementActions.
You MUST return exactly one action with "section": "summary".
You MUST return exactly one action with "section": "skills".
You MUST return exactly one action with "section": "experience".
Do NOT assign the same section value to more than one action.
Do NOT return all actions tagged as "summary".
The "section" field must be one of: "summary", "skills", "experience", "education", "certifications", "languages".
Include "education" if the JD explicitly requires or prefers a degree, clearance, or if the resume contains relevant education that strengthens recruiter confidence.
Include "certifications" ALWAYS when any of these are true:
  - The JD names or prefers a specific certification (ITIL, PMP, Salesforce, AWS, etc.) AND the resume contains that certification or an equivalent. When a match exists, generate an action that names the cert, confirms it is present, and states its credibility value. Do NOT skip this or return empty feedback — a direct cert match is a section completeness requirement.
  - The JD names a cert the resume does NOT have. Generate an action explaining the gap and its severity.
Include "languages" if the JD mentions language requirements or multilingual preferences.`
      : `${intelligenceBlock}${intentPrefix}${authoritativeResumeEvidence}${brainPrompt}`.trim();

    // ── Call Groq ─────────────────────────────────────────────────────────
    const openAIRes = await callOpenAI(apiKey, model, prompt);
    const groqData = await openAIRes.json();
    const raw = groqData.choices?.[0]?.message?.content?.toString().trim() || '';

    // ── Parse JSON ────────────────────────────────────────────────────────
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try { parsed = JSON.parse(raw.slice(start, end + 1)); } catch { parsed = null; }
      }
    }

    // Graceful fallback if JSON failed entirely
    if (!parsed || typeof parsed !== 'object') {
console.log('[ATS-COACH WHY SCORE]', why?.score);
console.log('[ATS-COACH RETURN SCORE]', typeof why?.score === 'number' ? why.score : null);		
      return res.status(200).json({
        ok: true,
        text: raw || 'Coach returned a response but it could not be formatted. Try again.',
        tips: [],
        structured: null,
        trajectory: { triggered: false },
        raw,
      });
    }

    // ── Normalise and return ──────────────────────────────────────────────
    const structured = normalizeStructured(parsed);

    const tips: string[] = [
      ...structured.signalGaps,
      ...structured.improvementActions.map((a) => a.requiredSignal),
    ].filter(Boolean);

    // ── Trajectory evaluation ─────────────────────────────────────────────
    // On second+ attempt, if core gaps persist, fire trajectory analysis.
    let trajectory: TrajectoryData = { triggered: false };
    // Safety fix: do not show Career Trajectory from Hammer alignment.
    // This panel is only appropriate for true career-path redirection, not an 80%+ resume/JD match.
    // Keep the helper functions in place for future intentional use, but never auto-trigger here.

    return res.status(200).json({
  ok: true,
  score:
  typeof why?.match?.score === 'number'
    ? why.match.score
    : typeof why?.score === 'number'
      ? why.score
      : null,
  why,
  text: structuredToText(structured),
  tips,
  structured,
  trajectory,
  raw,
});

  } catch (err: any) {
    console.error('[ats-coach] error', err);

    const msg = safe(err?.message);
    if (msg.includes('429') || msg.toLowerCase().includes('rate_limit')) {
      return res.status(200).json({
        ok: true,
        text: 'Coach is receiving too many requests right now. Wait a few seconds and run the coach again.',
        tips: ['Rate limit reached. Wait a few seconds and retry.'],
        structured: null,
        trajectory: { triggered: false },
        raw: msg,
      });
    }

    return res.status(500).json({ ok: false, error: 'AI coach request failed. Please try again.' });
  }
}