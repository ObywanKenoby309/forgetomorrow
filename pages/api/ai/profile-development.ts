// pages/api/ai/profile-development.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

// Provider keys (already in your env)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Models (safe defaults; adjust later if you want)
const OPENAI_MODEL = process.env.OPENAI_PROFILE_MODEL || 'gpt-4o-mini';
const GROQ_MODEL = process.env.GROQ_PROFILE_MODEL || 'llama-3.1-70b-versatile';

type ReqBody = {
  field: 'headline' | 'aboutMe' | 'skills';
  profile?: {
    name?: string | null;
    headline?: string | null;
    aboutMe?: string | null;
    skills?: string[];
    languages?: string[];
    location?: string | null;
  };
  resume?: { name?: string; content?: string } | null;
  notes?: string | null;
};

function clamp(s: string, max: number) {
  const str = String(s || '');
  return str.length > max ? str.slice(0, max) : str;
}

function buildSystem(field: ReqBody['field']) {
  if (field === 'headline') {
    return [
      'You help job seekers write recruiter-friendly profile headlines.',
      'Output exactly 3 headline options.',
      'Each option must be concise (max 110 characters), human, specific, and NOT cheesy.',
      'Avoid buzzword soup. Prefer role + domain + credibility signal.',
      'Return JSON only: {"suggestions":["...","...","..."]}',
    ].join(' ');
  }

  if (field === 'aboutMe') {
    return [
      'You help job seekers write a strong professional summary for a profile.',
      'Output exactly 3 summary options.',
      'Each summary must be 2–4 short paragraphs, human, confident, and specific.',
      'Do not invent employers, degrees, or certifications. If missing, keep it general.',
      'Avoid fluff. Focus on outcomes, strengths, and what roles they fit.',
      'Return JSON only: {"suggestions":["...","...","..."]}',
    ].join(' ');
  }

  // skills
  return [
    'You help job seekers build a recruiter-relevant skills list.',
    'Output exactly 3 skills lists.',
    'Each list should be comma-separated skills (12–20 skills).',
    'Skills must be realistic and align to the provided resume/profile context. No fake tools.',
    'Return JSON only: {"suggestions":["...","...","..."]}',
  ].join(' ');
}

function buildUserPrompt(body: ReqBody) {
  const profile = body.profile || {};
  const resume = body.resume || null;

  const payload = {
    field: body.field,
    notes: body.notes || '',
    profile: {
      name: profile.name || '',
      headline: profile.headline || '',
      aboutMe: profile.aboutMe || '',
      skills: (profile.skills || []).slice(0, 40),
      languages: (profile.languages || []).slice(0, 15),
      location: profile.location || '',
    },
    resume: resume
      ? {
          name: resume.name || '',
          // keep it bounded so we don't send a novel
          content: clamp(resume.content || '', 8000),
        }
      : null,
  };

  return JSON.stringify(payload, null, 2);
}

async function callOpenAI(system: string, user: string) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.6,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  const json: any = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = json?.error?.message || `OpenAI error (${resp.status})`;
    throw new Error(msg);
  }

  const text = json?.choices?.[0]?.message?.content || '';
  return String(text);
}

async function callGroq(system: string, user: string) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is missing');

  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.6,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  const json: any = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = json?.error?.message || `Groq error (${resp.status})`;
    throw new Error(msg);
  }

  const text = json?.choices?.[0]?.message?.content || '';
  return String(text);
}

function parseJsonSuggestions(raw: string) {
  // Try strict JSON parse first
  try {
    const parsed = JSON.parse(raw);
    const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    return suggestions.map((s: any) => String(s || '').trim()).filter(Boolean).slice(0, 3);
  } catch {
    // Fallback: try to extract a JSON blob
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const maybe = raw.slice(start, end + 1);
      try {
        const parsed = JSON.parse(maybe);
        const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
        return suggestions.map((s: any) => String(s || '').trim()).filter(Boolean).slice(0, 3);
      } catch {
        return [];
      }
    }
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = (await getServerSession(req, res, authOptions as any)) as
    | { user?: { id?: string; email?: string | null } }
    | null;

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const body = (req.body || {}) as ReqBody;
  const field = body.field;

  if (!field || !['headline', 'aboutMe', 'skills'].includes(field)) {
    return res.status(400).json({ error: 'Invalid field' });
  }

  const system = buildSystem(field);
  const user = buildUserPrompt(body);

  try {
    // 1) OpenAI first
    let out = '';
    try {
      out = await callOpenAI(system, user);
    } catch (e) {
      // 2) fallback to Groq if OpenAI fails
      out = await callGroq(system, user);
    }

    const suggestions = parseJsonSuggestions(out);

    if (!suggestions.length) {
      return res.status(502).json({ error: 'AI did not return valid suggestions' });
    }

    return res.status(200).json({ suggestions });
  } catch (e: any) {
    console.error('[ai/profile-development] error', e);
    return res.status(500).json({ error: e?.message || 'AI error' });
  }
}
