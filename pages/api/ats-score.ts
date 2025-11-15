// pages/api/ats-score.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';

type ATSResponse = {
  score: number;
  tips: string[];
  role?: string;
  upgrade?: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ATSResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jd, resume } = req.body;
  if (!jd || !resume) {
    return res.status(400).json({ error: 'Missing JD or resume data' });
  }

  // === 1. AUTH + TIER CHECK ===
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  const role = session?.user?.role || 'SEEKER';
  const tier = session?.user?.plan || 'FREE'; // assuming `plan` = 'FREE' | 'PRO'

  // === 2. FREE TIER LIMIT: 3 scans/day ===
  if (tier === 'FREE' && userId) {
    const today = new Date().toISOString().split('T')[0];
    const scansToday = await prisma.scanLog.count({
      where: { userId, date: today },
    });

    if (scansToday >= 3) {
      return res.status(200).json({
        score: 0,
        tips: [
          'Free tier: 3 AI scans/day used.',
          'Upgrade to Pro for unlimited AI + bullet rewrites.',
        ],
        upgrade: true,
      });
    }
  }

  // === 3. CALL GROK API ===
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.error('XAI_API_KEY missing');
    return fallbackResponse();
  }

  try {
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
`;

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
    const raw = data.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error('Empty response from Grok');

    const result = JSON.parse(raw);

    // === 4. LOG SCAN ===
    if (userId) {
      await prisma.scanLog.create({
        data: {
          userId,
          date: new Date().toISOString().split('T')[0],
          score: result.score,
        },
      });
    }

    // === 5. FORMAT RESPONSE ===
    const tips = [
      ...result.strengths.map((s: string) => `Success: ${s}`),
      ...result.gaps.map((g: string) => `Improvement: ${g}`),
      `**Next Step:** ${result.action}`,
    ];

    return res.status(200).json({
      score: result.score,
      tips: tips.slice(0, 4),
      role,
    });
  } catch (error) {
    console.error('[/api/ats-score] AI failed:', error);
    return fallbackResponse();
  }

  // === FALLBACK SCORER ===
  function fallbackResponse(): any {
    const fallback = computeFallback(jd, resume);
    return res.status(200).json(fallback);
  }
}

// === FALLBACK SCORER (No AI? Still works) ===
function computeFallback(jd: string, resume: any): ATSResponse {
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
  )
    score += 25;

  // Skills
  const jdSkills =
    jdLower.match(
      /\b(sql|python|react|aws|tableau|excel|jira|figma|notion|a\/b testing|leadership)\b/gi
    ) || [];
  const matches = jdSkills.filter((s) => resumeText.includes(s));
  score += Math.min(matches.length * 8, 30);

  // Quantified impact
  if (/\d+%|increased|reduced|grew|launched|built/i.test(resumeText))
    score += 15;

  score = Math.min(100, Math.max(0, score));

  return {
    score,
    tips: [
      'Add keywords from the job description.',
      'Use numbers: "Grew X by 30%"',
      'Prove skills with examples in bullets.',
    ],
  };
}