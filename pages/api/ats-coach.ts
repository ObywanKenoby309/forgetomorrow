// pages/api/ats-coach.ts
// AI Writing Coach for ATS alignment — used by The Forge Hammer

import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

type CoachRequestBody = {
  jdText?: string;
  resumeData?: {
    summary?: string;
    skills?: string[];
    workExperiences?: any[];
    experiences?: any[]; // in case we pass it under this key
    educationList?: any[];
    education?: any[];
  };
};

type CoachResponse =
  | {
      ok: true;
      tips: string[];
      raw?: string;
    }
  | {
      ok: false;
      error: string;
    };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CoachResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!client || !apiKey) {
    return res
      .status(500)
      .json({ ok: false, error: 'OPENAI_API_KEY is not configured' });
  }

  try {
    const body = req.body as CoachRequestBody;

    const jdText = (body.jdText || '').toString();
    const rd = body.resumeData || {};

    const summary = (rd.summary || '').toString();
    const skills = (rd.skills || []) as string[];

    // Support both workExperiences and experiences shapes
    const experiences = (rd.workExperiences || rd.experiences || []) as any[];
    const education = (rd.educationList || rd.education || []) as any[];

    const safeSkills = skills.filter(
      (s) => typeof s === 'string' && s.trim().length > 0
    );

    const expSnippets = experiences
      .slice(0, 4)
      .map((exp: any, idx: number) => {
        const title = exp.title || '';
        const company = exp.company || '';
        const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
        const firstBullet =
          bullets.find(
            (b: string) => typeof b === 'string' && b.trim().length > 0
          ) || '';
        return `${idx + 1}. ${title} at ${company}${
          firstBullet ? ` — ${firstBullet}` : ''
        }`;
      })
      .join('\n');

    const eduSnippets = education
      .slice(0, 3)
      .map((ed: any, idx: number) => {
        const school = ed.school || ed.institution || '';
        const degree = ed.degree || '';
        const field = ed.field || '';
        return `${idx + 1}. ${degree} ${field} at ${school}`;
      })
      .join('\n');

    const jdPreview =
      jdText.length > 1800 ? jdText.slice(0, 1800) + '\n\n[truncated]' : jdText;

    const userPrompt = `
You are an expert resume-writing coach and ATS specialist.
You are helping a job seeker align their resume to a specific job description.
Be concrete, kind, and focused on real-world improvements — no generic fluff.

JOB DESCRIPTION (JD)
--------------------
${jdPreview || '[No JD supplied]'}

CURRENT RESUME SNAPSHOT
-----------------------
Summary:
${summary || '[No summary provided]'}

Key Skills:
${safeSkills.length ? safeSkills.join(', ') : '[No skills provided]'}

Recent Experience (top 4 roles max):
${expSnippets || '[No experience provided]'}

Education:
${eduSnippets || '[No education data provided]'}

INSTRUCTIONS
------------
1. Start with one short, encouraging sentence.
2. Then provide a concise list (3–7 items) of very specific, ATS-friendly improvements.
   - Call out missing keywords or tools from the JD.
   - Suggest 1–2 measurable bullet ideas (with %, $ or time).
   - Flag any obvious red flags (large gaps, weak summary, etc.).
3. Write in second person ("you") and assume a professional mid-career job seeker.
4. Do NOT rewrite the entire resume. Focus on changes they can make in 15–30 minutes.

Return your answer as plain text, but structure it in a way that can be easily split into bullet points.
    `.trim();

    // Cast messages to any[] so TypeScript stops complaining about the union type
    const messages = [
      {
        role: 'system',
        content:
          'You are a supportive, practical resume-writing coach and ATS expert. You speak clearly and stay concrete.',
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ] as any[];

    const completion = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages,
      temperature: 0.4,
      max_tokens: 900,
    } as any);

    const raw =
      completion.choices?.[0]?.message?.content?.toString().trim() || '';

    // Turn the model’s response into a simple tips array for the UI
    const lines = raw.split('\n').map((l) => l.trim());
    const tips: string[] = [];

    for (const line of lines) {
      if (!line) continue;
      // Strip bullets / numbering
      const cleaned = line.replace(/^[-•\d.)\s]+/, '').trim();
      if (cleaned) {
        tips.push(cleaned);
      }
    }

    return res.status(200).json({
      ok: true,
      tips,
      raw,
    });
  } catch (err: any) {
    console.error('[ats-coach] error', err);
    return res
      .status(500)
      .json({ ok: false, error: 'AI coach request failed. Please try again.' });
  }
}
