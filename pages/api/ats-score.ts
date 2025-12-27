// pages/api/ats-score.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

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
    if (!session?.user?.id) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    userId = session.user.id;
    role = (session.user.role as string) || 'SEEKER';

    // === 2) GATE (FREE = 3/month across Hammer) ===
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

    // === 3) Normalize resume shape (accept BOTH formats) ===
    const experiences = (resume.workExperiences || resume.experiences || []) as any[];
    const education = (resume.educationList || resume.education || []) as any[];
    const summary = (resume.summary || '').toString();
    const skills = Array.isArray(resume.skills) ? resume.skills : [];

    const targetedRole =
      resume.personalInfo?.targetedRole ||
      resume.targetedRole ||
      resume.jobTitle ||
      '';

    // === 4) CALL OPENAI (Teacher/Grader) ===
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error(`[/api/ats-score] OPENAI_API_KEY missing for user ${userId}`);
      return fallbackResponse(jd, resume, role, userId, res);
    }

    const openai = new OpenAI({ apiKey });

    const roleContext =
      role === 'COACH'
        ? 'You are a career coach. Grade alignment and provide session-ready feedback.'
        : role === 'RECRUITER'
        ? 'You are a recruiter. Grade alignment and flag hiring fit risks and red flags.'
        : 'You are an ATS teacher grading the resume. Focus on ATS pass rate and interview readiness.';

    const prompt = `
${roleContext}

Return VALID JSON ONLY (no markdown, no commentary).

{
  "score": 92,
  "summary": "3–5 sentences explaining fit for THIS job.",
  "recommendations": [
    "2–4 specific, actionable recommendations for THIS resume against THIS JD."
  ]
}

JOB DESCRIPTION:
${jd}

RESUME:
- Targeted Role: ${targetedRole || 'Not specified'}
- Summary: ${summary || 'None'}
- Skills: ${(skills || []).join(', ')}
- Experience: ${
      experiences
        ?.map(
          (e: any) =>
            `${e.jobTitle || e.title || e.role || 'Role'} at ${e.company || 'Unknown'}: ${(e.bullets || []).join('; ')}`
        )
        .join(' | ') || 'None'
    }
- Education: ${
      education
        ?.map((e: any) => `${e.degree || 'Degree'} in ${e.field || e.program || 'Field'}`)
        .join(', ') || 'None'
    }
`.trim();

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
      console.error('[/api/ats-score] Invalid JSON from OpenAI:', raw);
      throw new Error('Invalid JSON from AI');
    }

    const score =
      typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 0;

    const aiSummary =
      (parsed.summary && String(parsed.summary).trim()) ||
      'AI summary unavailable for this scan.';

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

    const targetedRole =
      resume?.personalInfo?.targetedRole || resume?.targetedRole || '';

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
