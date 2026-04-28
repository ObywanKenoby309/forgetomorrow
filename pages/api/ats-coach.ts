// pages/api/ats-coach.ts
// AI Writing Coach for ATS alignment — used by The Forge Hammer
// Groq = Coach. OpenAI = Score (Teacher).
// Uses strategyBrain.buildSectionCoachPrompt for world-class prompt intelligence.

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { buildSectionCoachPrompt } from '@/lib/forge/strategyBrain';

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
  jobMeta?: {
    title?: string;
    company?: string;
    location?: string;
  } | null;
};

export type ImprovementAction = {
  section: 'summary' | 'skills' | 'experience' | 'education';
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

type CoachResponse =
  | {
      ok: true;
      text: string;
      tips: string[];
      structured: CoachStructured | null;
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
  return '';
}

function inferSectionFromSignal(signal: any) {
  const s = safe(signal).toLowerCase();
  if (s.includes('education') || s.includes('degree') || s.includes('certification') || s.includes('license')) return 'education';
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

async function callGroq(apiKey: string, model: string, prompt: string) {
  let lastStatus = 0;
  let lastText = '';

  for (let attempt = 0; attempt < 2; attempt++) {
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
              'You are ForgeTomorrow resume intelligence. You are a senior HR recruiter and hiring strategist. Return ONLY valid JSON. No markdown. No extra text. No explanation outside the JSON.',
          },
          { role: 'user', content: prompt },
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
          structured: null,
        });
      }
    } catch (e) {
      console.error('[ats-coach] gate error', e);
      return res.status(500).json({ ok: false, error: 'Unable to validate plan usage. Please try again.' });
    }
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ ok: false, error: 'GROQ_API_KEY is not configured' });

  const model = process.env.GROQ_COACH_MODEL || 'llama-3.1-8b-instant';

  try {
    const body = (req.body || {}) as CoachRequestBody;

    const jdText = safe(body.jdText);
    const resumeData = body.resumeData || {};
    const context = body.context || { section: 'overview', keyword: null };
    const missing = body.missing || {};
    const jobMeta = body.jobMeta || null;

    // ── Build prompt via strategyBrain ────────────────────────────────────
    // This is the intelligence layer — environment detection, hiring lens,
    // full snapshot with bullets, section routing, all decision language.
    const prompt = buildSectionCoachPrompt({
      jdText,
      resume: resumeData,
      context,
      missing,
      jobMeta: jobMeta as any,
    });

    // ── Call Groq ─────────────────────────────────────────────────────────
    const groqRes = await callGroq(apiKey, model, prompt);
    const groqData = await groqRes.json();
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
      return res.status(200).json({
        ok: true,
        text: raw || 'Coach returned a response but it could not be formatted. Try again.',
        tips: [],
        structured: null,
        raw,
      });
    }

    // ── Normalise and return ──────────────────────────────────────────────
    const structured = normalizeStructured(parsed);

    const tips: string[] = [
      ...structured.signalGaps,
      ...structured.improvementActions.map((a) => a.requiredSignal),
    ].filter(Boolean);

    return res.status(200).json({
      ok: true,
      text: structuredToText(structured),
      tips,
      structured,
      raw,
    });

  } catch (err: any) {
    console.error('[ats-coach] error', err);

    const msg = safe(err?.message);
    if (msg.includes('429') || msg.toLowerCase().includes('rate_limit')) {
      return res.status(200).json({
        ok: true,
        text: 'Coach is receiving too many requests right now. Wait a few seconds and run the coach again.',
        tips: ['Groq rate limit reached. Wait a few seconds and retry.'],
        structured: null,
        raw: msg,
      });
    }

    return res.status(500).json({ ok: false, error: 'AI coach request failed. Please try again.' });
  }
}