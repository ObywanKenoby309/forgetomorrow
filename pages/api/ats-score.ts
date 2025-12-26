// pages/api/ats-score.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// === TYPES ===
type ATSResponse = {
  score: number;
  tips: string[];
  role?: string;
  upgrade?: boolean;
  aiSummary?: string;
  aiRecommendations?: string[];
};

type ApiResponse = {
  ok: boolean;
  // IMPORTANT: return a FLAT payload so the client doesn't break
  score?: number;
  tips?: string[];
  role?: string;
  upgrade?: boolean;
  aiSummary?: string;
  aiRecommendations?: string[];
  error?: string;
};

function monthWindowUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
  return { start, end, key: `${y}-${String(m + 1).padStart(2, '0')}` };
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
  let tier = 'FREE';

  try {
    // === 1) AUTH ===
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    userId = session.user.id;
    role = (session.user.role as string) || 'SEEKER';

    // === 2) TIER (do NOT trust session alone) ===
    // Adjust select fields to match your User model
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true }, // if your field is "tier" or "subscription", change here
    });

    tier = (dbUser?.plan as string) || (session.user.plan as string) || 'FREE';

    // === 3) FREE LIMIT: 3 per MONTH (server-side only, cannot be bypassed) ===
    if (String(tier).toUpperCase() === 'FREE') {
      const { start, end } = monthWindowUTC(new Date());

      const scansThisMonth = await prisma.scanLog.count({
        where: {
          userId,
          createdAt: { gte: start, lt: end },
        },
      });

      if (scansThisMonth >= 3) {
        return res.status(200).json({
          ok: true,
          score: 0,
          tips: [
            'Free tier: 3 AI scans/month used.',
            'Upgrade to Pro for unlimited AI scans and deeper rewrites.',
          ],
          upgrade: true,
          role,
          aiSummary:
            'Free tier limit reached for this month. Upgrade to unlock unlimited scans and deeper guidance.',
          aiRecommendations: [
            'Apply the last scan’s recommendations (keywords + quantified bullets).',
            'Come back next month for more free scans, or upgrade to Pro.',
          ],
        });
      }
    }

    // === 4) CALL GROK ===
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      console.error(`[/api/ats-score] XAI_API_KEY missing for user ${userId}`);
      return fallbackResponse(jd, resume, role, userId, res);
    }

    const roleContext =
      role === 'COACH'
        ? 'You are a career coach. Give session-ready advice.'
        : role === 'RECRUITER'
        ? 'You are a recruiter. Score for hiring fit and red flags.'
        : 'You are an ATS expert helping a job seeker. Focus on ATS pass rate and interview readiness.';

    const prompt = `
${roleContext}

Given the job description and candidate resume, do three things:

1) Score the resume vs. the job description on **content alignment** (0–100).
2) Write a short, encouraging "AI read of this role" summary (3–5 sentences) explaining fit.
3) List 2–4 **specific, actionable** recommendations to improve the resume for THIS role.

Return **valid JSON only** (no markdown, no extra commentary):

{
  "score": 92,
  "summary": "Short explanation of how well the resume fits the role and why.",
  "recommendations": [
    "Specific improvement 1",
    "Specific improvement 2",
    "Specific improvement 3"
  ]
}

JOB DESCRIPTION:
${jd}

RESUME:
- Targeted Role: ${resume.personalInfo?.targetedRole || 'Not specified'}
- Summary: ${resume.summary || 'None'}
- Skills: ${(resume.skills || []).join(', ')}
- Experience: ${
      resume.workExperiences
        ?.map(
          (e: any) =>
            `${e.jobTitle || e.title || 'Role'} at ${e.company || 'Unknown'}: ${(e.bullets || []).join(
              '; '
            )}`
        )
        .join(' | ') || 'None'
    }
- Education: ${
      resume.educationList
        ?.map((e: any) => `${e.degree || 'Degree'} in ${e.field || e.program || 'Field'}`)
        .join(', ') || 'None'
    }
`.trim();

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          { role: 'system', content: 'You are an expert ATS analyst. Respond with JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response from Grok');

    let result: { score: number; summary?: string; recommendations?: string[] };
    try {
      result = JSON.parse(raw);
    } catch (parseError) {
      console.error('[/api/ats-score] Failed to parse Grok JSON:', raw);
      throw new Error('Invalid JSON from AI');
    }

    const score = typeof result.score === 'number' ? Math.max(0, Math.min(100, result.score)) : 0;
    const aiSummary =
      result.summary ||
      'AI read unavailable for this scan, but you can still use the ATS score and missing keywords.';
    const aiRecommendations =
      Array.isArray(result.recommendations) && result.recommendations.length > 0
        ? result.recommendations
        : [
            'Mirror 2–3 of the job’s exact keywords in your summary and skills.',
            'Add at least one bullet with clear metrics (%, $, time saved) to your most recent role.',
          ];

    // === 5) LOG SCAN (use month key in date string if you want visibility) ===
    const { key: monthKey } = monthWindowUTC(new Date());
    await prisma.scanLog.create({
      data: {
        userId,
        date: monthKey, // informational; gating uses createdAt
        score: Math.round(score),
      },
    });

    const tips = aiRecommendations.slice(0, 4);

    return res.status(200).json({
      ok: true,
      score: Math.round(score),
      tips,
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
    const resumeText = [
      resume.personalInfo?.targetedRole,
      resume.summary,
      ...(resume.skills || []),
      ...(resume.workExperiences?.flatMap((e: any) => e.bullets || []) || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    let score = 50;

    if (
      resume.personalInfo?.targetedRole &&
      jdLower.includes(resume.personalInfo.targetedRole.toLowerCase())
    ) {
      score += 25;
    }

    const jdSkills =
      jdLower.match(/\b(sql|python|react|aws|tableau|excel|jira|figma|notion|a\/b testing|leadership)\b/gi) || [];
    const matches = jdSkills.filter((s) => resumeText.includes(s));
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
