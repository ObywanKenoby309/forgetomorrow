// pages/api/ats-score.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // ← CORRECT: default import
import type { NextApiRequest, NextApiResponse } from 'next';

// === TYPES ===
type ATSResponse = {
  score: number;
  tips: string[];
  role?: string;
  upgrade?: boolean;
};

type ApiResponse = {
  ok: boolean;
  data?: ATSResponse | null;
  error?: string;
};

// === MAIN HANDLER ===
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { jd, resume } = req.body;
  if (!jd || !resume) {
    return res.status(400).json({ ok: false, error: 'Missing JD or resume data' });
  }

  let userId: string | undefined;
  let role: string = 'SEEKER';
  let tier: string = 'FREE';

  try {
    // === 1. AUTH + TIER CHECK ===
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    userId = session.user.id;
    role = (session.user.role as string) || 'SEEKER';
    tier = (session.user.plan as string) || 'FREE';

    // === 2. FREE TIER LIMIT: 3 scans/day ===
    if (tier === 'FREE') {
      const today = new Date().toISOString().split('T')[0];
      const scansToday = await prisma.scanLog.count({
        where: { userId, date: today },
      });

      if (scansToday >= 3) {
        return res.status(200).json({
          ok: true,
          data: {
            score: 0,
            tips: [
              'Free tier: 3 AI scans/day used.',
              'Upgrade to Pro for unlimited AI + bullet rewrites.',
            ],
            upgrade: true,
          },
        });
      }
    }

    // === 3. CALL GROK API ===
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
        : 'You are a job seeker. Focus on ATS pass rate and interview readiness.';

    const prompt = `
${roleContext}

Score this resume vs. the job description on **content alignment** (0–100 scale).

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
            `${e.jobTitle} at ${e.company}: ${(e.bullets || []).join('; ')}`
        )
        .join(' | ') || 'None'
    }
- Education: ${
      resume.educationList
        ?.map((e: any) => `${e.degree} in ${e.field}`)
        .join(', ') || 'None'
    }

Return **valid JSON only** (no markdown, no explanation):
{
  "score": 92,
  "strengths": ["Perfect role fit", "Quantified 42% revenue growth"],
  "gaps": ["No SQL usage shown", "Missing A/B testing example"],
  "action": "Add 1 bullet with SQL + 1 with metrics"
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
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim();

    if (!raw) throw new Error('Empty response from Grok');

    let result: { score: number; strengths: string[]; gaps: string[]; action: string };
    try {
      result = JSON.parse(raw);
    } catch (parseError) {
      console.error('[/api/ats-score] Failed to parse Grok JSON:', raw);
      throw new Error('Invalid JSON from AI');
    }

    // === 4. LOG SCAN ===
    await prisma.scanLog.create({
      data: {
        userId,
        date: new Date().toISOString().split('T')[0],
        score: result.score,
      },
    });

    // === 5. FORMAT TIPS ===
    const tips = [
      ...result.strengths.map((s: string) => `Success: ${s}`),
      ...result.gaps.map((g: string) => `Improvement: ${g}`),
      `**Next Step:** ${result.action}`,
    ];

    return res.status(200).json({
      ok: true,
      data: {
        score: result.score,
        tips: tips.slice(0, 4), // Limit to 4 tips
        role,
      },
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

    // Role match
    if (
      resume.personalInfo?.targetedRole &&
      jdLower.includes(resume.personalInfo.targetedRole.toLowerCase())
    ) {
      score += 25;
    }

    // Skill keywords
    const jdSkills =
      jdLower.match(
        /\b(sql|python|react|aws|tableau|excel|jira|figma|notion|a\/b testing|leadership)\b/gi
      ) || [];
    const matches = jdSkills.filter((s) => resumeText.includes(s));
    score += Math.min(matches.length * 8, 30);

    // Quantified impact
    if (/\d+%|increased|reduced|grew|launched|built/i.test(resumeText)) {
      score += 15;
    }

    score = Math.min(100, Math.max(0, score));

    res.status(200).json({
      ok: true,
      data: {
        score,
        tips: [
          'Add keywords from the job description.',
          'Use numbers: "Grew X by 30%"',
          'Prove skills with examples in bullets.',
        ],
        role,
      },
    });
  } catch (error) {
    console.error(`[/api/ats-score] Fallback failed for user ${userId || 'unknown'}:`, error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
