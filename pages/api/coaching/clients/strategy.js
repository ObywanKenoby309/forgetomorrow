// pages/api/coaching/clients/strategy.js
//
// ForgeTomorrow Coaching Intelligence Engine
//
// Philosophy: Narrative before application. Alignment before volume. Strategy before job search.
//
// POST { clientId, targetCompanies, strategyBackground }
// → generates structured coaching brief
// → saves full JSON to CoachingClient.strategyJson
// → saves inputs to targetCompanies, strategyBackground
// → returns saved result
//
// Data sourcing:
//   FT User   → profile summary, skills, education, work prefs, primary resume content
//   External  → manual fields coach entered on profile tab

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY   = process.env.GROQ_API_KEY;
const OPENAI_MODEL   = process.env.OPENAI_STRATEGY_MODEL || 'gpt-4o-mini';
const GROQ_MODEL     = process.env.GROQ_STRATEGY_MODEL   || 'llama-3.1-70b-versatile';

function clamp(s, max) {
  const str = String(s || '');
  return str.length > max ? str.slice(0, max) : str;
}

function buildSystemPrompt() {
  return `You are a senior career strategist embedded inside ForgeTomorrow, a coaching platform built on a covenant to help people who feel overlooked.

Your role is to help coaches build a specific, actionable strategy for one client.

PHILOSOPHY — NON-NEGOTIABLE:
- Narrative before application. Alignment before volume. Strategy before job search.
- You are a strategic thinking partner for the coach — not a job board, not a resume matcher.
- Every output must be specific to THIS person. If it could apply to any random person, it is wrong.
- The output must feel like it came from a coach who deeply understood this specific person — not a model completing a pattern.

HARD RULES — NEVER VIOLATE THESE:
- NEVER output generic category labels like "Technology", "Business", "Healthcare", "Communications", "Mission-driven organizations" as themes. Themes must name real patterns AND reference actual organizations as anchors.
- NEVER use filler traits like "good communicator", "team player", "adaptable", "hardworking", "client success leadership experience". These are resume language, not coach intelligence.
- NEVER suggest "apply to jobs", "update your resume", "network more", or "search job boards" as next steps.
- NEVER recommend roles without explicit reasoning tied to actual signals from the provided data.
- NEVER produce advice that could apply to 1,000 different people.
- NEVER skip the reasoning field. Every output must map back to the actual input data.
- NEVER be polite when naming narrative gaps. Direct, honest, specific — that is the standard.
- NEVER write transferability signals as resume bullets. Write them as coach intelligence — explain the arc and what it signals.

THE ONE-LINE TEST — APPLY BEFORE FINALIZING:
Ask yourself: "Could I swap in a completely different person and this output still makes sense?"
If yes — it is wrong. Start over.

SPECIFICITY STANDARDS — APPLY TO EVERY FIELD:

THEMES must name real patterns AND anchor them to real organizations:
WRONG: "Mission-driven media organizations"
RIGHT: "Conservative / values-driven media platforms with strong audience identity (Daily Wire, Blaze Media, Salem Network)"
RIGHT: "Faith-integrated digital platforms blending content and community (YouVersion, Life.Church, Proverbs 31 Ministries)"

TRANSFERABILITY must explain the arc of the background, not list skills:
WRONG: "Client success leadership experience translates to this sector"
RIGHT: "Has repeatedly built structure in chaotic environments (military to corrections to IT operations) — this pattern translates directly to stabilizing underdeveloped teams and systems in high-pressure orgs"

NARRATIVE GAPS must be direct and honest — not polite:
WRONG: "Lack of specific examples in the nonprofit sector"
RIGHT: "His story reads as operationally strong but directionally unclear — without a defined lane, he risks being seen as experienced but unfocused by mission-driven hiring managers"

POSITIONING INSIGHT must reframe how this person should be seen in the market:
WRONG: "Experienced operations professional seeking new opportunities"
RIGHT: "He is not a Customer Success Manager — he is a stabilizer and builder of teams and systems in high-pressure environments, and that is the frame every application and conversation must start from"

STRETCH / SAFE HARBOR must explain WHY and tie to a specific gap or signal:
WRONG: "Large nonprofit organizations (stretch)"
RIGHT: "Life.Church digital team — strong mission alignment and content background, but stretch because no portfolio of digital content work exists yet; closing the content production gap is the unlock"

OUTPUT FORMAT — RETURN ONLY VALID JSON, NO MARKDOWN, NO COMMENTARY:
{
  "themes": [],
  "roleLanes": [],
  "transferabilitySignals": [],
  "narrativeGaps": [],
  "positioningInsight": "",
  "stretchTargets": [],
  "safeHarborTargets": [],
  "nextStep": "",
  "sessionFocus": "",
  "reasoning": []
}

FIELD DEFINITIONS:
- themes: 2–4 specific sector/mission patterns derived from target companies + client background. Must name real patterns AND reference real organizations as anchors.
- roleLanes: 3–5 prioritized strategic role directions with brief explanation of why this lane fits this person's arc. Not job titles.
- transferabilitySignals: 3–5 signals that explain the arc of the client's background and what it means in the target environment. Not resume bullets — coach intelligence.
- narrativeGaps: 2–4 specific, honest gaps in this client's story relative to the target direction. Direct language. No softening.
- positioningInsight: ONE sentence that reframes how this client should be seen in the market. The bridge between their past and their future. The strategy's North Star.
- stretchTargets: 1–3 aspirational targets with explanation of WHY they're a stretch and what specific gap must close first.
- safeHarborTargets: 1–3 immediate-win targets with explanation of WHY they're achievable now given current readiness.
- nextStep: ONE concrete action the coach should take with this client before the next session. Specific enough to execute today.
- sessionFocus: The specific coaching agenda item for the next session, tied directly to this strategy.
- reasoning: 3–5 statements that map outputs back to actual input signals. Show the work explicitly.`;
}

function buildUserPrompt({ targetCompanies, strategyBackground, clientContext }) {
  const lines = [
    '=== COACHING STRATEGY REQUEST ===',
    '',
    'TARGET COMPANIES / SECTORS:',
    targetCompanies || '(none provided)',
    '',
    'COACH CONTEXT NOTES:',
    strategyBackground || '(none provided)',
    '',
    '=== CLIENT PROFILE DATA ===',
  ];

  if (clientContext.name) lines.push(`Client name: ${clientContext.name}`);

  if (clientContext.summary) {
    lines.push('', 'PROFESSIONAL SUMMARY:');
    lines.push(clamp(clientContext.summary, 1500));
  }

  if (clientContext.skills?.length) {
    lines.push('', 'SKILLS:');
    lines.push(clientContext.skills.slice(0, 30).join(', '));
  }

  if (clientContext.experience?.length) {
    lines.push('', 'WORK HISTORY:');
    clientContext.experience.slice(0, 5).forEach((e) => {
      const parts = [e.title, e.company, e.range].filter(Boolean);
      lines.push(`  - ${parts.join(' | ')}`);
      if (e.highlights?.length) {
        e.highlights.slice(0, 2).forEach((h) => lines.push(`    • ${h}`));
      }
    });
  }

  if (clientContext.education?.length) {
    lines.push('', 'EDUCATION:');
    clientContext.education.slice(0, 3).forEach((e) => {
      const parts = [e.degree, e.field ? `in ${e.field}` : null, e.school].filter(Boolean);
      if (parts.length) lines.push(`  - ${parts.join(' ')}`);
    });
  }

  if (clientContext.workStatus || clientContext.preferredWorkType || clientContext.preferredLocations?.length) {
    lines.push('', 'WORK PREFERENCES:');
    if (clientContext.workStatus)         lines.push(`  Status: ${clientContext.workStatus}`);
    if (clientContext.preferredWorkType)  lines.push(`  Type: ${clientContext.preferredWorkType}`);
    if (clientContext.preferredLocations?.length) lines.push(`  Locations: ${clientContext.preferredLocations.join(', ')}`);
  }

  if (clientContext.resumeContent) {
    lines.push('', 'PRIMARY RESUME (use for detailed experience signal):');
    lines.push(clamp(clientContext.resumeContent, 4000));
  }

  if (clientContext.manualExperience) {
    lines.push('', 'COACH-ENTERED EXPERIENCE NOTES:');
    lines.push(clamp(clientContext.manualExperience, 1000));
  }

  lines.push(
    '',
    '=== END CLIENT DATA ===',
    '',
    'Generate the coaching brief now.',
    'Apply the one-line test before finalizing.',
    'Return ONLY valid JSON. No markdown. No commentary.',
  );

  return lines.join('\n');
}

async function callOpenAI(system, user) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing');
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.4,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.error?.message || `OpenAI error (${resp.status})`);
  return String(json?.choices?.[0]?.message?.content || '');
}

async function callGroq(system, user) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is missing');
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.error?.message || `Groq error (${resp.status})`);
  return String(json?.choices?.[0]?.message?.content || '');
}

function parseAndValidate(raw) {
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch {}
  if (!parsed) {
    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { parsed = JSON.parse(raw.slice(start, end + 1)); } catch {}
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const arr = (v) => Array.isArray(v) ? v.map((s) => String(s || '').trim()).filter(Boolean) : [];
  const str = (v) => String(v || '').trim();

  const result = {
    themes:                 arr(parsed.themes).slice(0, 5),
    roleLanes:              arr(parsed.roleLanes).slice(0, 6),
    transferabilitySignals: arr(parsed.transferabilitySignals).slice(0, 6),
    narrativeGaps:          arr(parsed.narrativeGaps).slice(0, 5),
    positioningInsight:     str(parsed.positioningInsight),
    stretchTargets:         arr(parsed.stretchTargets).slice(0, 4),
    safeHarborTargets:      arr(parsed.safeHarborTargets).slice(0, 4),
    nextStep:               str(parsed.nextStep),
    sessionFocus:           str(parsed.sessionFocus),
    reasoning:              arr(parsed.reasoning).slice(0, 6),
  };

  if (!result.themes.length && !result.roleLanes.length && !result.nextStep) return null;
  return result;
}

async function buildClientContext(client) {
  const context = {
    name: client.name || '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    workStatus: '',
    preferredWorkType: '',
    preferredLocations: [],
    resumeContent: '',
    manualExperience: '',
  };

  if (client.clientId) {
    const [user, resume] = await Promise.all([
      prisma.user.findUnique({
        where: { id: client.clientId },
        select: {
          aboutMe: true,
          headline: true,
          skillsJson: true,
          educationJson: true,
          workPreferences: true,
        },
      }),
      prisma.resume.findFirst({
        where: { userId: client.clientId, isPrimary: true },
        select: { content: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    if (user) {
      context.summary = user.aboutMe || user.headline || '';

      if (user.skillsJson) {
        try {
          const parsed = typeof user.skillsJson === 'string' ? JSON.parse(user.skillsJson) : user.skillsJson;
          context.skills = Array.isArray(parsed)
            ? parsed.map((s) => typeof s === 'string' ? s : s?.name || s?.label || '').filter(Boolean)
            : [];
        } catch {}
      }

      if (user.educationJson) {
        try {
          const parsed = typeof user.educationJson === 'string' ? JSON.parse(user.educationJson) : user.educationJson;
          context.education = Array.isArray(parsed)
            ? parsed.map((e) => ({
                school: e.school || e.institution || '',
                degree: e.degree || '',
                field:  e.field  || e.major || '',
              })).filter((e) => e.school || e.degree)
            : [];
        } catch {}
      }

      const wp = user.workPreferences && typeof user.workPreferences === 'object' ? user.workPreferences : {};
      context.workStatus         = wp.workStatus || '';
      context.preferredWorkType  = wp.workType || wp.preferredWorkType || '';
      context.preferredLocations = Array.isArray(wp.locations) ? wp.locations : [];
    }

    if (resume?.content) context.resumeContent = resume.content;

  } else {
    context.summary           = client.manualSummary || '';
    context.workStatus        = client.manualWorkStatus || '';
    context.preferredWorkType = client.manualPreferredWorkType || '';
    context.manualExperience  = client.manualExperience || '';

    if (client.manualSkills) {
      context.skills = String(client.manualSkills).split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (client.manualPreferredLocations) {
      context.preferredLocations = String(client.manualPreferredLocations).split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (client.manualEducation) {
      context.education = String(client.manualEducation)
        .split('\n').map((l) => l.trim()).filter(Boolean)
        .map((line) => ({ school: line, degree: '', field: '' }));
    }
  }

  return context;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const coachId = String(session.user.id);
  const { clientId, targetCompanies, strategyBackground } = req.body || {};

  if (!clientId || typeof clientId !== 'string') {
    return res.status(400).json({ error: 'clientId is required' });
  }
  if (!String(targetCompanies || '').trim()) {
    return res.status(400).json({ error: 'Add at least one target company or sector before generating strategy.' });
  }

  try {
    const client = await prisma.coachingClient.findFirst({ where: { id: clientId, coachId } });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const clientContext = await buildClientContext(client);
    const system = buildSystemPrompt();
    const user   = buildUserPrompt({ targetCompanies, strategyBackground, clientContext });

    let raw = '';
    try {
      raw = await callOpenAI(system, user);
    } catch (openAIErr) {
      console.warn('[strategy] OpenAI failed, trying Groq:', openAIErr.message);
      raw = await callGroq(system, user);
    }

    const result = parseAndValidate(raw);
    if (!result) {
      return res.status(502).json({ error: 'Strategy generation failed to produce a valid brief. Please try again.' });
    }

    // Save inputs + full strategy JSON + legacy fields
    await prisma.coachingClient.update({
      where: { id: clientId },
      data: {
        targetCompanies:   String(targetCompanies  || '').trim(),
        strategyBackground: String(strategyBackground || '').trim(),
        strategyJson:      result,
        strategyThemes:    result.themes.join(', '),
        strategyRoleLanes: result.roleLanes.join(', '),
        strategyNextStep:  result.nextStep,
      },
    });

    return res.status(200).json({ strategy: result });
  } catch (err) {
    console.error('[api/coaching/clients/strategy] error:', err);
    return res.status(500).json({ error: 'Strategy generation failed. Please try again.' });
  }
}