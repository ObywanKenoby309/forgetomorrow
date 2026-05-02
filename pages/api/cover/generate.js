// pages/api/cover/generate.js
// Cover letter AI generation — uses GPT-4.1-mini with the same philosophy as Forge Hammer.
// NEVER invents metrics, experience, or achievements not present in the resume.
// Generates: opening sentence, 3 bullets, closing sentence.

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

function safe(value, max = 4000) {
  const str = String(value || '').trim();
  return str.length > max ? str.slice(0, max) + '\n\n[truncated]' : str;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { jd, resume, company, role, name } = req.body || {};

  if (!jd?.trim()) {
    return res.status(400).json({ error: 'JD is required' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI not configured' });
  }

  try {
    // Build honest resume snapshot
    const experiences = resume?.experiences || resume?.workExperiences || [];
    const expText = experiences
      .map((exp) => {
        const title = exp.jobTitle || exp.title || 'Role';
        const co = exp.company || '';
        const bullets = (exp.bullets || []).filter(Boolean).slice(0, 4).join('. ');
        return `${title}${co ? ' at ' + co : ''}${bullets ? ': ' + bullets : ''}`;
      })
      .filter(Boolean)
      .join('\n');

    const skills = Array.isArray(resume?.skills) ? resume.skills.slice(0, 20).join(', ') : '';
    const summary = String(resume?.summary || '');
    const candidateName = String(name || '');
    const targetCompany = String(company || 'the company');
    const targetRole = String(role || 'this position');

    const prompt = `
You are a cover letter writer for ForgeTomorrow. Your job is to write a short, honest, high-impact cover letter using ONLY evidence visible in the resume below.

RULES — NON-NEGOTIABLE:
- NEVER invent metrics, numbers, percentages, or dollar amounts not in the resume.
- NEVER invent job titles, companies, projects, or achievements not in the resume.
- If the resume has no metrics, do NOT add metrics. Use qualitative proof instead.
- Write like a human, not a template.
- Keep it short and punchy — recruiters spend 6 seconds on cover letters.
- Match the JD signals to the resume evidence honestly.

TARGET ROLE: ${targetRole} at ${targetCompany}
CANDIDATE: ${candidateName}

JOB DESCRIPTION:
${safe(jd, 1500)}

RESUME EVIDENCE (USE ONLY THIS):
Summary: ${safe(summary, 400)}
Skills: ${safe(skills, 300)}
Experience:
${safe(expText, 1500)}

Write exactly:
1. OPENING: One natural, human sentence (max 30 words) that introduces the candidate and bridges into the bullets. End with "including:" so the bullets flow from it. Use the candidate's actual background — years of experience, field, and strongest credential. Do NOT say "I am excited to apply." Sound like a real person introducing themselves.
2. BULLET1: One bullet (max 15 words) — strongest delivery or ownership proof from resume.
3. BULLET2: One bullet (max 15 words) — strongest technical or domain proof from resume.
4. BULLET3: One bullet (max 15 words) — strongest stakeholder, leadership, or impact proof from resume.
5. CLOSING: One warm, forward-looking sentence (max 20 words) — show genuine interest in THIS specific role at THIS specific company. "I'm excited to discuss..." or "I look forward to exploring..." — human, not robotic.
6. SIGNOFF: MUST be one of these exactly: "Looking forward to speaking with you," OR "I look forward to our conversation," OR "Warm regards," — NEVER use "Sincerely,"

If the resume lacks proof for a bullet, write what the resume actually shows — do not invent.

Return ONLY valid JSON:
{
  "opening": "...",
  "body": "bullet1\\nbullet2\\nbullet3",
  "closing": "...",
  "signoff": "..."
}
`.trim();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_COACH_MODEL || 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: 'You are a cover letter writer. Return ONLY valid JSON. No markdown. No extra text.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('[cover/generate] OpenAI error:', err);
      return res.status(500).json({ error: 'AI generation failed' });
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.toString().trim() || '';

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const s = raw.indexOf('{');
      const e = raw.lastIndexOf('}');
      if (s >= 0 && e > s) {
        try { parsed = JSON.parse(raw.slice(s, e + 1)); } catch { parsed = null; }
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('[cover/generate] Bad JSON:', raw);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    return res.status(200).json({
      opening: String(parsed.opening || '').trim(),
      body: String(parsed.body || '').trim(),
      closing: String(parsed.closing || '').trim(),
    });

  } catch (err) {
    console.error('[cover/generate] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}