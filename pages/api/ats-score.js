// pages/api/ats-score.js — PRODUCTION READY (xAI Grok Live)
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // ← Your NextAuth config
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jd, resume } = req.body;
  if (!jd || !resume) {
    return res.status(400).json({ error: 'Missing JD or resume data' });
  }

  // === 1. GET USER + TIER (Free vs Paid) ===
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;
  const tier = session?.user?.tier || 'FREE';

  // === 2. FREE TIER LIMIT: 3 scans/day ===
  if (tier === 'FREE' && userId) {
    const today = new Date().toISOString().split('T')[0];
    const scansToday = await prisma.scanLog.count({
      where: { userId, date: today }
    });
    if (scansToday >= 3) {
      return res.status(403).json({
        score: null,
        tips: [
          'Free tier: 3 AI scans/day used.',
          'Upgrade to Pro for unlimited AI + bullet rewrites.'
        ],
        upgrade: true
      });
    }
  }

  // === 3. CALL GROK API ===
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service unavailable' });
  }

  try {
    const roleContext = session?.user?.role === 'COACH'
      ? 'You are a career coach. Give session-ready advice.'
      : session?.user?.role === 'RECRUITER'
      ? 'You are a recruiter. Score for hiring fit and red flags.'
      : 'You are a job seeker. Focus on ATS pass rate and interview readiness.';

    const prompt = `
${roleContext}

Score this resume vs. the job description on **content alignment** (0–100 scale).

JOB DESCRIPTION:
${jd}

RESUME:
- Targeted Role: ${resume.personalInfo.targetedRole || 'Not specified'}
- Summary: ${resume.summary || 'None'}
- Skills: ${(resume.skills || []).join(', ')}
- Experience: ${resume.workExperiences?.map(e => 
  `${e.jobTitle} at ${e.company}: ${(e.bullets || []).join('; ')}`
).join(' | ') || 'None'}
- Education: ${resume.educationList?.map(e => `${e.degree} in ${e.field}`).join(', ') || 'None'}

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
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'grok-3-mini', // $0.30/M input — your $5 = ~15,000 scans
        messages: [
          { role: 'system', content: 'You are an expert ATS analyst. Respond with JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Grok API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content.trim());

    // === 4. LOG SCAN (for free tier tracking) ===
    if (userId) {
      await prisma.scanLog.create({
        data: {
          userId,
          date: new Date().toISOString().split('T')[0],
          score: result.score
        }
      });
    }

    // === 5. FORMAT RESPONSE FOR FRONTEND ===
    const tips = [
      ...result.strengths.map(s => `Success: ${s}`),
      ...result.gaps.map(g => `Improvement: ${g}`),
      `**Next Step:** ${result.action}`
    ];

    return res.status(200).json({
      score: result.score,
      tips: tips.slice(0, 4),
      role: session?.user?.role || 'seeker'
    });

  } catch (error) {
    console.error('AI Scoring Failed:', error.message);

    // === 6. FALLBACK: Simple keyword match (never fail) ===
    const fallback = computeFallback(jd, resume);
    return res.status(200).json(fallback);
  }
}

// === FALLBACK SCORER (No AI? Still works) ===
function computeFallback(jd, resume) {
  const jdLower = jd.toLowerCase();
  const resumeText = [
    resume.personalInfo.targetedRole,
    resume.summary,
    ...(resume.skills || []),
    ...(resume.workExperiences?.flatMap(e => e.bullets || []) || [])
  ].join(' ').toLowerCase();

  let score = 50;

  // Role match
  if (resume.personalInfo.targetedRole && jdLower.includes(resume.personalInfo.targetedRole.toLowerCase())) score += 25;

  // Skills
  const jdSkills = jdLower.match(/\b(sql|python|react|aws|tableau|excel|jira|figma|notion|a\/b testing|leadership)\b/gi) || [];
  const matches = jdSkills.filter(s => resumeText.includes(s));
  score += Math.min(matches.length * 8, 30);

  // Quantified impact
  if (/\d+%|increased|reduced|grew|launched|built/i.test(resumeText)) score += 15;

  score = Math.min(100, Math.max(0, score));

  return {
    score,
    tips: [
      'Add keywords from the job description.',
      'Use numbers: "Grew X by 30%"',
      'Prove skills with examples in bullets.'
    ]
  };
}