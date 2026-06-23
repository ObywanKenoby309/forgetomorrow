// pages/api/ats-score.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { buildRecruiterScanPrompt, buildDeterministicHammerAnalysis, deriveHammerSignalWeights } from '@/lib/forge/strategyBrain';

// === TYPES ===
type ApiResponse = {
  ok: boolean;
  score?: number;
  tips?: string[];
  role?: string;
  upgrade?: boolean;
  aiSummary?: string;
  aiRecommendations?: string[];
  strongestSignal?: string | null;
  rejectionRisk?: string | null;
  missingProof?: string[];
  wouldAdvance?: boolean | null;
  topFixes?: string[];
  signalBreakdown?: Array<{ signal: string; status: string; required: boolean; weight: number; termCount: number }>;
  error?: string;
};

function monthKeyUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function monthWindowUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
  return { start, end, key: `${y}-${String(m + 1).padStart(2, '0')}` };
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

function safeParseJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
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


// Emergency MVP: post-process Hammer signal labels when the resume clearly
// demonstrates prior direct role/domain evidence. This avoids demo false-negatives
// without hardcoding individual job titles.
function normalizeWords(value: any): string[] {
  const stop = new Set([
    'the','and','or','of','for','to','in','on','with','a','an','role','job','position',
    'location','remote','employment','type','full','time','full-time','about','required',
    'experience','ideal','candidate','success','this','we','are','looking','seeking'
  ]);

  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .split(/[\s/-]+/g)
    .map((x) => x.trim())
    .filter((x) => x.length >= 3 && !stop.has(x));
}

function titleFromJD(jdText: string): string {
  const raw = String(jdText || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';

  const boundary = raw.search(/\b(Location|Employment Type|About the Role|What You'll Do|Required Experience|Responsibilities|Success in This Role)\b/i);
  const firstChunk = boundary > 0 ? raw.slice(0, boundary).trim() : raw.slice(0, 90).trim();

  return firstChunk
    .replace(/\b(Location|Remote|Employment Type|Full-Time|Full Time)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resumeTextFromStructuredResume(resume: any): string {
  const experiences = (resume?.workExperiences || resume?.experiences || []) as any[];
  const education = (resume?.educationList || resume?.education || []) as any[];
  const certs = (resume?.certifications || resume?.certificationList || resume?.certificationsList || []) as any[];

  return [
    resume?.personalInfo?.targetedRole,
    resume?.targetedRole,
    resume?.jobTitle,
    resume?.summary,
    ...(Array.isArray(resume?.skills) ? resume.skills : []),
    ...experiences.map((e: any) => [e?.title, e?.jobTitle, e?.role, e?.company, e?.description, ...(e?.bullets || [])].filter(Boolean).join(' ')),
    ...education.map((e: any) => [e?.degree, e?.field, e?.school || e?.institution].filter(Boolean).join(' ')),
    ...certs.map((c: any) => typeof c === 'string' ? c : [c?.name, c?.issuer, c?.description].filter(Boolean).join(' ')),
  ].filter(Boolean).join(' ').toLowerCase();
}

function hasDirectTitleOverlap(jdText: string, resume: any): boolean {
  const jdTitle = titleFromJD(jdText);
  const jdWords = normalizeWords(jdTitle);
  if (jdWords.length < 2) return false;

  const experiences = (resume?.workExperiences || resume?.experiences || []) as any[];
  const titleCandidates = [
    resume?.personalInfo?.targetedRole,
    resume?.targetedRole,
    resume?.jobTitle,
    ...experiences.map((e: any) => e?.title || e?.jobTitle || e?.role),
  ].filter(Boolean);

  return titleCandidates.some((candidate: any) => {
    const candidateWords = new Set(normalizeWords(candidate));
    const hits = jdWords.filter((w) => candidateWords.has(w)).length;
    return hits >= Math.max(2, Math.ceil(jdWords.length * 0.6));
  });
}

function countOperationalDomainHits(jdText: string, resume: any): number {
  const jdLower = String(jdText || '').toLowerCase();
  const resumeLower = resumeTextFromStructuredResume(resume);

  const terms = [
    'enterprise operations', 'client delivery', 'technical operations', 'escalation management',
    'onboarding', 'service delivery', 'sla', 'workflow optimization', 'staffing alignment',
    'workload forecasting', 'operational reporting', 'operational analytics', 'account performance',
    'documentation', 'training standardization', 'team readiness', 'remediation',
    'process optimization', 'reporting modernization', 'workflow redesign', 'operational visibility'
  ];

  return terms.filter((term) => jdLower.includes(term) && resumeLower.includes(term)).length;
}

function strengthenHammerSignalBreakdown({ jdText, resume, signalBreakdown }: { jdText: string; resume: any; signalBreakdown: Array<{ signal: string; status: string; required: boolean; weight: number; termCount: number }> }) {
  if (!Array.isArray(signalBreakdown) || signalBreakdown.length === 0) return signalBreakdown;

  const directTitle = hasDirectTitleOverlap(jdText, resume);
  const domainHits = countOperationalDomainHits(jdText, resume);
  const jdNoFormalEducation = /no formal education is required/i.test(String(jdText || ''));

  if (!directTitle && domainHits < 6 && !jdNoFormalEducation) return signalBreakdown;

  return signalBreakdown.map((item) => {
    const label = String(item?.signal || '').toLowerCase();

    const isDomainKnowledge = label.includes('domain');
    const isQualification = label.includes('qualification') || label.includes('credential') || label.includes('education');

    if (isDomainKnowledge && (directTitle || domainHits >= 6)) {
      return { ...item, status: 'strong' };
    }

    if (isQualification && (directTitle || jdNoFormalEducation)) {
      return { ...item, status: 'strong' };
    }

    return item;
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { jd, resume } = req.body || {};
  if (!jd || !resume) {
    return res.status(400).json({ ok: false, error: 'Missing JD or resume data' });
  }

  let userId: string | undefined;
  let role = 'SEEKER';

  try {
    // === 1) AUTH ===
    const session = await getServerSession(req, res, authOptions);
    const resolvedUserId = await resolveUserId(session);
    if (!resolvedUserId) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    userId = resolvedUserId;
    role = normalizeRole((session?.user as any)?.role) || 'SEEKER';

    // === 2) GATE (FREE = 3/month across Hammer)
    // Recruiter/Coach/Admin are NEVER gatekept.
    if (!roleIsUnlimited(role)) {
      const gate = await enforceHammerGate(userId);
      if (!gate.allowed) {
        return res.status(200).json({
          ok: true,
          score: 0,
          tips: [
            'Free tier: 3 Forge Hammer uses/month used.',
            'Upgrade to Seeker Pro for unlimited AI scoring + coaching and deeper rewrites.',
          ],
          upgrade: true,
          role,
          aiSummary: 'Free tier limit reached for this month. Upgrade to unlock unlimited Hammer usage.',
          aiRecommendations: [
            'Apply the last guidance (keywords + quantified bullets).',
            'Come back next month for more free uses, or upgrade to Pro.',
          ],
        });
      }
    }

    // === 3) Normalize resume shape (accept BOTH formats) ===
    const experiences = (resume.workExperiences || resume.experiences || []) as any[];
    const education = (resume.educationList || resume.education || []) as any[];
    const summary = (resume.summary || '').toString();
    const skills = Array.isArray(resume.skills) ? resume.skills : [];

    const targetedRole = resume.personalInfo?.targetedRole || resume.targetedRole || resume.jobTitle || '';

    // === 4) CALL OPENAI (Teacher/Grader) ===
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return fallbackResponse(jd, resume, role, userId, res);
    }

    const openai = new OpenAI({ apiKey });

        const prompt = buildRecruiterScanPrompt({
      jdText: jd,
      resumeData: {
        ...resume,
        personalInfo: {
          ...(resume?.personalInfo || {}),
          targetedRole,
        },
        summary,
        skills,
        workExperiences: experiences,
        educationList: education,
      },
      role,
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: 'You are a strict JSON generator. Output JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 450,
    } as any);

    const raw = completion.choices?.[0]?.message?.content?.toString().trim() || '';
    const parsed = raw ? safeParseJson(raw) : null;

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON from AI');
    }

    const score = typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 0;

    const aiSummary = (parsed.summary && String(parsed.summary).trim()) || 'AI summary unavailable for this scan.';

    const aiRecommendations =
      Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0
        ? parsed.recommendations.map((x: any) => String(x || '').trim()).filter(Boolean)
        : [
            'Mirror 2–3 of the job’s exact keywords in your summary and skills.',
            'Add at least one bullet with clear metrics (%, $, time saved) to your most recent role.',
          ];

    // Pass through signal-level fields for the explainability modal.
    // These come from the AI's JSON response -- no extra tokens, no extra call.
    const strongestSignal = typeof parsed.strongestSignal === 'string' ? parsed.strongestSignal.trim() : null;
    const rejectionRisk = typeof parsed.rejectionRisk === 'string' ? parsed.rejectionRisk.trim() : null;
    const missingProof = Array.isArray(parsed.missingProof)
      ? parsed.missingProof.map((x: any) => String(x || '').trim()).filter(Boolean)
      : [];
    const wouldAdvance = typeof parsed.wouldAdvance === 'boolean' ? parsed.wouldAdvance : null;
    const topFixes = Array.isArray(parsed.topFixes)
      ? parsed.topFixes.map((x: any) => String(x || '').trim()).filter(Boolean)
      : [];

    // Run deterministic analysis to get per-signal evidence classifications.
    // This is JD-driven -- required signals are derived from THIS job description,
    // not hardcoded. Works for any role: nurse, engineer, warehouse lead, CEO.
    // Build JD-weighted signal breakdown for the explainability modal.
    // Step 1: deriveHammerSignalWeights counts term hits per signal in THIS JD.
    //   Result: weights proportional to how much the JD emphasizes each signal.
    //   A CS Director JD with 7 delivery terms weights delivery at ~25%.
    //   A nursing JD with 8 patient-care terms weights advisory at ~30%.
    //   This is fully explainable: weight = termCount / totalTerms * 92%.
    // Step 2: buildDeterministicHammerAnalysis evaluates resume evidence per signal.
    // Step 3: merge weights + evidence into signalBreakdown for the modal.
    let signalBreakdown: Array<{ signal: string; status: string; required: boolean; weight: number; termCount: number }> = [];
    try {
      const signalWeights = deriveHammerSignalWeights({ jdText: jd });
      const deterministicResult = buildDeterministicHammerAnalysis({
        jdText: jd,
        resume: {
          ...resume,
          summary,
          skills,
          workExperiences: experiences,
          educationList: education,
        },
      });
      const evidenceMap = new Map(
        (deterministicResult?.evidenceSignals || []).map((sig: any) => [sig.signal.toLowerCase(), sig.status])
      );
      signalBreakdown = signalWeights.map((sw: any) => ({
        signal: sw.signal,
        status: evidenceMap.get(sw.signal.toLowerCase()) || 'missing',
        required: sw.required,
        weight: sw.weight,
        termCount: sw.termCount,
      }));

      signalBreakdown = strengthenHammerSignalBreakdown({
        jdText: jd,
        resume: {
          ...resume,
          summary,
          skills,
          workExperiences: experiences,
          educationList: education,
        },
        signalBreakdown,
      });
    } catch (e) {
      console.error('[ats-score] signalBreakdown failed (non-fatal):', e);
    }

    // === 5) OPTIONAL HISTORY LOG (NOT gate) ===
    const { key: monthKey } = monthWindowUTC(new Date());
    try {
      await prisma.scanLog.create({
        data: {
          userId,
          date: monthKey,
          score: Math.round(score),
        },
      });
    } catch (e) {
      console.error('[/api/ats-score] scanLog create failed (non-fatal)', e);
    }

    return res.status(200).json({
      ok: true,
      score: Math.round(score),
      tips: aiRecommendations.slice(0, 4),
      role,
      aiSummary,
      aiRecommendations,
      strongestSignal,
      rejectionRisk,
      missingProof,
      wouldAdvance,
      topFixes,
      signalBreakdown,
    });
  } catch (error: any) {
    console.error(`[/api/ats-score] AI failed for user ${userId || 'unknown'}:`, error);
    return fallbackResponse(jd, resume, role, userId, res);
  }
}

// === FALLBACK SCORER (No AI? Still works) ===
function fallbackResponse(
  jd: string,
  resume: any,
  role: string,
  userId: string | undefined,
  res: NextApiResponse<ApiResponse>
): void {
  try {
    const jdLower = jd.toLowerCase();

    const experiences = (resume?.workExperiences || resume?.experiences || []) as any[];
    const bullets = experiences?.flatMap((e: any) => e?.bullets || []) || [];

    const resumeText = [
      resume?.personalInfo?.targetedRole,
      resume?.targetedRole,
      resume?.summary,
      ...(resume?.skills || []),
      ...bullets,
      ...((resume?.certifications || resume?.certificationList || resume?.certificationsList || []).map((c: any) => typeof c === 'string' ? c : [c?.name, c?.issuer, c?.description].filter(Boolean).join(' '))),
      ...((resume?.educationList || resume?.education || []).map((e: any) => [e?.degree, e?.field, e?.school || e?.institution].filter(Boolean).join(' '))),
      ...((resume?.languages || []).map((l: any) => typeof l === 'string' ? l : [l?.name, l?.proficiency].filter(Boolean).join(' '))),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    let score = 50;

    const targetedRole = resume?.personalInfo?.targetedRole || resume?.targetedRole || '';

    if (targetedRole && jdLower.includes(String(targetedRole).toLowerCase())) {
      score += 25;
    }

    const jdSkills =
      jdLower.match(/\b(sql|python|react|aws|tableau|excel|jira|figma|notion|a\/b testing|leadership)\b/gi) || [];

    const matches = jdSkills.filter((s) => resumeText.includes(s.toLowerCase()));
    score += Math.min(matches.length * 8, 30);

    if (/\d+%|increased|reduced|grew|launched|built/i.test(resumeText)) {
      score += 15;
    }

    score = Math.min(100, Math.max(0, score));

    const aiSummary =
      'Heuristic fallback: this score is based on simple keyword and impact checks. Use it as a rough guide and run a full AI scan when available.';

    const aiRecommendations = [
      'Mirror the exact job title somewhere near the top of your resume.',
      'Pull 3–5 key skills from the job description and make sure they appear in your skills or bullets.',
      'Add at least one bullet with measurable results (%, $, time saved) in your most recent role.',
    ];

    res.status(200).json({
      ok: true,
      score,
      tips: aiRecommendations.slice(0, 3),
      role,
      aiSummary,
      aiRecommendations,
    });
  } catch (error) {
    console.error(`[/api/ats-score] Fallback failed for user ${userId || 'unknown'}:`, error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}