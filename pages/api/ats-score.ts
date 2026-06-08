// pages/api/ats-score.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import buildPromptContext from '@/lib/intelligence/buildPromptContext';
import { buildExplain } from '@/lib/intelligence/whyEngine';
const { buildRecruiterScanPrompt } = require('@/lib/forge/strategyBrain');

// === TYPES ===
type ApiResponse = {
  ok: boolean;
  score?: number;
  tips?: string[];
  role?: string;
  upgrade?: boolean;
  aiSummary?: string;
  aiRecommendations?: string[];
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

function safeString(value: any): string {
  return String(value || '').trim();
}

function valueFromObject(item: any, keys: string[]) {
  if (!item || typeof item !== 'object') return '';
  return keys.map((key) => safeString(item[key])).filter(Boolean).join(' ');
}

function extractResumeEvidence(resume: any) {
  if (!resume || typeof resume !== 'object') return '';

  const parts: string[] = [];

  const personal = resume.personalInfo && typeof resume.personalInfo === 'object'
    ? [
        resume.personalInfo.name,
        resume.personalInfo.targetedRole,
        resume.personalInfo.location,
      ].map(safeString).filter(Boolean).join(' | ')
    : '';
  if (personal) parts.push(`PROFILE:\n${personal}`);

  const summary = [resume.summary, resume.professionalSummary].map(safeString).filter(Boolean).join('\n');
  if (summary) parts.push(`SUMMARY:\n${summary}`);

  const skills = Array.isArray(resume.skills) ? resume.skills.map(safeString).filter(Boolean) : [];
  if (skills.length) parts.push(`SKILLS:\n${skills.join(', ')}`);

  const experiences = Array.isArray(resume.workExperiences)
    ? resume.workExperiences
    : Array.isArray(resume.experiences)
      ? resume.experiences
      : Array.isArray(resume.experience)
        ? resume.experience
        : [];

  const experienceText = experiences
    .map((exp: any) => {
      if (typeof exp === 'string') return safeString(exp);
      const header = [exp?.title, exp?.company, exp?.location, exp?.startDate || exp?.start, exp?.endDate || exp?.end]
        .map(safeString)
        .filter(Boolean)
        .join(' | ');
      const body = [
        exp?.description,
        Array.isArray(exp?.highlights) ? exp.highlights.join(' ') : '',
        Array.isArray(exp?.bullets) ? exp.bullets.join(' ') : '',
      ].map(safeString).filter(Boolean).join(' ');
      return [header, body].filter(Boolean).join('\n');
    })
    .filter(Boolean)
    .join('\n\n');
  if (experienceText) parts.push(`EXPERIENCE:\n${experienceText}`);

  const projects = Array.isArray(resume.projects) ? resume.projects : [];
  const projectText = projects
    .map((project: any) => typeof project === 'string'
      ? safeString(project)
      : valueFromObject(project, ['title', 'name', 'description', 'outcome', 'tools']))
    .filter(Boolean)
    .join('\n');
  if (projectText) parts.push(`PROJECTS:\n${projectText}`);

  const volunteerExperiences = Array.isArray(resume.volunteerExperiences) ? resume.volunteerExperiences : [];
  const volunteerText = volunteerExperiences
    .map((item: any) => typeof item === 'string'
      ? safeString(item)
      : valueFromObject(item, ['title', 'organization', 'company', 'description', 'bullets']))
    .filter(Boolean)
    .join('\n');
  if (volunteerText) parts.push(`VOLUNTEER EXPERIENCE:\n${volunteerText}`);

  const education = Array.isArray(resume.educationList)
    ? resume.educationList
    : Array.isArray(resume.education)
      ? resume.education
      : [];
  const educationText = education
    .map((edu: any) => typeof edu === 'string'
      ? safeString(edu)
      : valueFromObject(edu, ['degree', 'school', 'institution', 'field', 'major', 'notes', 'date', 'year']))
    .filter(Boolean)
    .join('\n');
  if (educationText) parts.push(`EDUCATION:\n${educationText}`);

  const certifications = Array.isArray(resume.certifications) ? resume.certifications : [];
  const certificationsText = certifications
    .map((cert: any) => typeof cert === 'string'
      ? safeString(cert)
      : valueFromObject(cert, ['name', 'title', 'certification', 'credential', 'issuer', 'organization', 'date', 'year']))
    .filter(Boolean)
    .join('\n');
  if (certificationsText) parts.push(`CERTIFICATIONS / TRAINING / CREDENTIALS:\n${certificationsText}`);

  const languages = Array.isArray(resume.languages) ? resume.languages : [];
  const languagesText = languages
    .map((lang: any) => typeof lang === 'string'
      ? safeString(lang)
      : valueFromObject(lang, ['language', 'name', 'proficiency', 'level']))
    .filter(Boolean)
    .join('\n');
  if (languagesText) parts.push(`LANGUAGES:\n${languagesText}`);

  const achievements = Array.isArray(resume.achievements) ? resume.achievements : [];
  const achievementText = achievements
    .map((item: any) => typeof item === 'string'
      ? safeString(item)
      : valueFromObject(item, ['title', 'name', 'description', 'outcome']))
    .filter(Boolean)
    .join('\n');
  if (achievementText) parts.push(`ACHIEVEMENTS / AWARDS:\n${achievementText}`);

  const customSections = Array.isArray(resume.customSections) ? resume.customSections : [];
  const customText = customSections
    .map((item: any) => typeof item === 'string'
      ? safeString(item)
      : valueFromObject(item, ['title', 'name', 'description', 'content', 'items']))
    .filter(Boolean)
    .join('\n');
  if (customText) parts.push(`CUSTOM SECTIONS:\n${customText}`);

  return parts.filter(Boolean).join('\n\n');
}

function buildIntelligenceBlock(intelligence: any) {
  if (!intelligence) return '';

  const lines: string[] = [
    'CAREER INTELLIGENCE CONTEXT (ForgeTomorrow Unified Intelligence — alignment mode):',
  ];

  if (Array.isArray(intelligence.proofSignals) && intelligence.proofSignals.length) {
    lines.push('');
    lines.push('PROVEN SIGNALS ACROSS FULL PROFILE:');
    intelligence.proofSignals.slice(0, 10).forEach((s: string) => lines.push(`- ${s}`));
  }

  const creds = intelligence.credentials;
  if (creds?.combined?.length) {
    lines.push('');
    lines.push('CREDENTIALS ON FILE:');
    creds.combined.slice(0, 10).forEach((c: string) => lines.push(`- ${c}`));
  }

  if (Array.isArray(intelligence.relevantWins) && intelligence.relevantWins.length) {
    lines.push('');
    lines.push('RELEVANT WINS:');
    intelligence.relevantWins.slice(0, 8).forEach((w: string) => lines.push(`- ${w}`));
  }

  if (Array.isArray(intelligence.knownGaps) && intelligence.knownGaps.length) {
    lines.push('');
    lines.push('KNOWN GAPS:');
    intelligence.knownGaps.slice(0, 6).forEach((g: string) => lines.push(`- ${g}`));
  }

  if (Array.isArray(intelligence.cautionFlags) && intelligence.cautionFlags.length) {
    lines.push('');
    lines.push('CAUTION FLAGS:');
    intelligence.cautionFlags.slice(0, 4).forEach((f: string) => lines.push(`- ${f}`));
  }

  return lines.length > 1 ? lines.join('\n') : '';
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
    const certifications = Array.isArray(resume.certifications) ? resume.certifications : [];
    const languages = Array.isArray(resume.languages) ? resume.languages : [];
    const projects = Array.isArray(resume.projects) ? resume.projects : [];
    const volunteerExperiences = Array.isArray(resume.volunteerExperiences) ? resume.volunteerExperiences : [];
    const achievements = Array.isArray(resume.achievements) ? resume.achievements : [];
    const customSections = Array.isArray(resume.customSections) ? resume.customSections : [];
    const summary = (resume.summary || '').toString();
    const skills = Array.isArray(resume.skills) ? resume.skills : [];

    const targetedRole = resume.personalInfo?.targetedRole || resume.targetedRole || resume.jobTitle || '';
    const resumeEvidenceText = extractResumeEvidence(resume);
    const whyContext = buildExplain(resumeEvidenceText, jd);

    let intelligenceBlock = '';
    try {
      const intelligence = await buildPromptContext({ userId, mode: 'alignment' });
      intelligenceBlock = buildIntelligenceBlock(intelligence);
    } catch (e) {
      console.warn('[/api/ats-score] buildPromptContext failed — continuing with current resume evidence only', e);
    }

    // === 4) CALL OPENAI (Teacher/Grader) ===
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return fallbackResponse(jd, resume, role, userId, res);
    }

    const openai = new OpenAI({ apiKey });

    const basePrompt = buildRecruiterScanPrompt({
      jdText: jd,
      resumeData: {
        ...resume,
        personalInfo: {
          ...(resume.personalInfo || {}),
          targetedRole,
        },
        summary,
        skills,
        workExperiences: experiences,
        experiences,
        educationList: education,
        education,
        certifications,
        languages,
        projects,
        volunteerExperiences,
        achievements,
        customSections,
      },
      role,
    });

    const prompt = `${intelligenceBlock ? `${intelligenceBlock}\n\n` : ''}${basePrompt}

AUTHORITATIVE CURRENT RESUME EVIDENCE — USE THIS BEFORE SCORING OR CLAIMING ANYTHING IS MISSING:
${resumeEvidenceText.slice(0, 6500)}

WHY ENGINE CONTEXT:
${JSON.stringify({
  score: whyContext?.score ?? null,
  verdict: whyContext?.verdict ?? null,
  matchedSignals: whyContext?.matchedSignals || [],
  missingSignals: whyContext?.missingSignals || [],
}).slice(0, 2500)}

SCORING RULES:
- Score recruiter confidence from evidence, not keyword density alone.
- Do not penalize a credential, education item, language, project, or tool as missing when it appears in AUTHORITATIVE CURRENT RESUME EVIDENCE or CAREER INTELLIGENCE CONTEXT.
- If the wording is close but not exact, treat it as present with a clarity gap, not absent.
- Preferred requirements should reduce confidence moderately only; they should not collapse an otherwise strong match.
- Return JSON only using the schema requested above.`;

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
      extractResumeEvidence(resume),
      resume?.personalInfo?.targetedRole,
      resume?.targetedRole,
      resume?.summary,
      ...(resume?.skills || []),
      ...bullets,
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
