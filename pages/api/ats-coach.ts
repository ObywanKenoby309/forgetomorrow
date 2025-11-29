// pages/api/ats-coach.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

const client = apiKey
  ? new OpenAI({ apiKey })
  : null;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!client) {
    return res.status(500).json({
      error: 'Missing OPENAI_API_KEY on server',
    });
  }

  try {
    const {
      jdText = '',
      resumeData = {},
      context = { section: 'overview' },
    } = req.body || {};

    const section =
      context?.section ||
      'overview'; // 'summary' | 'skills' | 'experience' | 'education' | 'overview'
    const keyword = context?.keyword || null;

    const messages = [
      {
        role: 'system',
        content:
          'You are a friendly resume-writing coach helping job seekers tailor their resume to a specific job description. ' +
          'Give clear, concise suggestions they can paste into their resume. Do not rewrite the entire resume. ' +
          'Focus on the section they are editing (summary, skills, or a single experience bullet). ' +
          'Return your answer in short bullet points and 2–4 sentence micro-suggestions.',
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            job_description: jdText,
            resume: resumeData,
            section,
            keyword,
          },
          null,
          2
        ),
      },
    ];

    const completion = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages,
      temperature: 0.4,
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      'No suggestions generated. Try again.';

    return res.status(200).json({ text });
  } catch (err: any) {
    console.error('ats-coach error', err);
    return res.status(500).json({
      error: 'Coach suggestion failed',
      detail: err?.message || String(err),
    });
  }
}
