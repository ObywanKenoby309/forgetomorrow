// pages/api/ai/profile-development.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

// Provider keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Models
const OPENAI_MODEL = process.env.OPENAI_PROFILE_MODEL || 'gpt-4o-mini';
const GROQ_MODEL = process.env.GROQ_PROFILE_MODEL || 'llama-3.1-70b-versatile';

type ReqBody = {
  field:
    | 'headline'
    | 'aboutMe'
    | 'skills'
    | 'projects'
    | 'education'
    | 'certifications'
    | 'workPreferences'
    | 'languages';
  profile?: {
    name?: string | null;
    headline?: string | null;
    aboutMe?: string | null;
    skills?: string[];
    languages?: string[];
    location?: string | null;
  };
  resume?: { name?: string; content?: string } | null;
  careerContext?: any | null;
  signalContext?: {
    signal?: string;
    gapReason?: string;
    currentStatus?: string;
  } | null;
  notes?: string | null;
};

function clamp(s: string, max: number) {
  const str = String(s || '');
  return str.length > max ? str.slice(0, max) : str;
}

function buildSystem(field: ReqBody['field']) {
  const shared = [
    'You are ForgeTomorrow profile intelligence.',
    'You write profile content that improves recruiter signal, searchability, and trust.',
    'Use the provided careerContext and signalContext when available.',
    'Do not invent employers, degrees, certifications, tools, metrics, or authority.',
    'If evidence is missing, write adjacent but honest language.',
    'Return JSON only: {"suggestions":["...","...","..."]}',
  ];

  if (field === 'headline') {
    return [
      ...shared,
      'Output exactly 3 headline options.',
      'Each option must be concise, human, specific, and not cheesy.',
      'Maximum 110 characters per headline.',
      'Prefer role + domain + credibility signal.',
      'Avoid buzzword soup.',
    ].join(' ');
  }

  if (field === 'aboutMe') {
    return [
      ...shared,
      'Output exactly 3 summary options.',
      'Each summary must be 2 to 4 short paragraphs.',
      'Write with confidence, clarity, and human voice.',
      'Focus on outcomes, strengths, direction, and what roles or opportunities they fit.',
      'Avoid fluff and generic career-coach language.',
    ].join(' ');
  }

  return [
    ...shared,
    'Output exactly 3 skills lists.',
    'Each list should be comma-separated skills.',
    'Each list should contain 12 to 20 skills.',
    'Skills must be realistic and grounded in the profile, resume, and career context.',
    'No fake tools. No fake credentials.',
  ].join(' ');
}

function buildUserPrompt(body: ReqBody) {
  const profile = body.profile || {};
  const resume = body.resume || null;
  const careerContext = body.careerContext || null;
  const signalContext = body.signalContext || null;

  const payload = {
    field: body.field,
    notes: body.notes || '',
    signalContext: signalContext
      ? {
          signal: signalContext.signal || '',
          gapReason: signalContext.gapReason || '',
          currentStatus: signalContext.currentStatus || '',
        }
      : null,
    profile: {
      name: profile.name || '',
      headline: profile.headline || '',
      aboutMe: profile.aboutMe || '',
      skills: (profile.skills || []).slice(0, 40),
      languages: (profile.languages || []).slice(0, 15),
      location: profile.location || '',
    },
    careerContext: careerContext
      ? {
          user: careerContext.user || null,
          positioning: careerContext.positioning || null,
          proofSignals: Array.isArray(careerContext.proofSignals)
            ? careerContext.proofSignals.slice(0, 12)
            : [],
          relevantWins: Array.isArray(careerContext.relevantWins)
            ? careerContext.relevantWins.slice(0, 8)
            : [],
          knownGaps: Array.isArray(careerContext.knownGaps)
            ? careerContext.knownGaps.slice(0, 8)
            : [],
          recentToolInsights: Array.isArray(careerContext.recentToolInsights)
            ? careerContext.recentToolInsights.slice(0, 6)
            : [],
          cautionFlags: Array.isArray(careerContext.cautionFlags)
            ? careerContext.cautionFlags.slice(0, 6)
            : [],
          sourceStatus: careerContext.sourceStatus || null,
        }
      : null,
    resume: resume
      ? {
          name: resume.name || '',
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
      temperature: 0.45,
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
      temperature: 0.45,
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
  try {
    const parsed = JSON.parse(raw);
    const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    return suggestions.map((s: any) => String(s || '').trim()).filter(Boolean).slice(0, 3);
  } catch {
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

  if (
  !field ||
  ![
    'headline',
    'aboutMe',
    'skills',
    'projects',
    'education',
    'certifications',
    'workPreferences',
    'languages',
  ].includes(field)
) {
    return res.status(400).json({ error: 'Invalid field' });
  }

  const system = buildSystem(field);
  const user = buildUserPrompt(body);

  try {
    let out = '';

    try {
      out = await callOpenAI(system, user);
    } catch {
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