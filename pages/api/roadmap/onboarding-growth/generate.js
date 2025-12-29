// pages/api/roadmap/onboarding-growth/generate.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractTextFromResponsesApi(resp) {
  if (resp?.output_text && typeof resp.output_text === 'string') return resp.output_text;

  const t =
    resp?.output?.[0]?.content?.find((c) => c?.type === 'output_text')?.text ||
    resp?.output?.[0]?.content?.[0]?.text ||
    resp?.output?.[0]?.content?.[0]?.value ||
    '';

  return typeof t === 'string' ? t : '';
}

function extractTextFromChatCompletions(resp) {
  const t = resp?.choices?.[0]?.message?.content || '';
  return typeof t === 'string' ? t : '';
}

function normalizeDirection(raw) {
  const v = String(raw || '').toLowerCase().trim();
  if (v === 'grow' || v === 'stay' || v === 'stay_the_course') return 'grow';
  if (v === 'pivot') return 'pivot';
  if (v === 'compare' || v === 'both') return 'compare';
  return 'compare';
}

function directionLabel(direction) {
  if (direction === 'grow') return 'Stay the course and grow in the current field';
  if (direction === 'pivot') return 'Pivot into a different field or role type';
  return 'Compare both paths: stay the course vs pivot opportunities';
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeSpaces(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function startsWithStayRequirement(s) {
  if (!isNonEmptyString(s)) return false;
  return /^Stay-the-course requirement(s)?:/i.test(s.trim());
}

/**
 * Find first match index using a case-insensitive regex.
 * Returns -1 when not found.
 */
function indexOfRegexCI(haystack, re) {
  try {
    const m = haystack.match(re);
    if (!m || !m.index) {
      // if match exists at index 0, m.index will be 0 (falsy)
      return m && typeof m.index === 'number' ? m.index : -1;
    }
    return m.index;
  } catch {
    return -1;
  }
}

/**
 * Hard-lock pivot formatting to multi-line blocks.
 * Input (bad):
 * "Possible pivot 1: X Why it fits: ... Missing signals: ... Fast proof artifact: ... Cost/tradeoff: ..."
 *
 * Output (good):
 * "Possible pivot 1: X
 *  Why it fits: ...
 *  Missing signals: ...
 *  Fast proof artifact: ...
 *  Cost/tradeoff: ..."
 */
function coercePivotToMultiline(pivotLine) {
  const raw = String(pivotLine || '').trim();
  if (!raw.startsWith('Possible pivot ')) return raw;

  // If it's already correct, keep it.
  const alreadyMultiline =
    raw.includes('\nWhy it fits:') &&
    raw.includes('\nMissing signals:') &&
    raw.includes('\nFast proof artifact:') &&
    raw.includes('\nCost/tradeoff:');
  if (alreadyMultiline) return raw;

  // Normalize spacing so we can find tokens even in messy text.
  const s = normalizeSpaces(raw);

  // Locate "Why it fits:" (allow optional space before colon)
  const idxWhy = indexOfRegexCI(s, /\bwhy it fits\s*:/i);
  if (idxWhy === -1) return raw;

  const title = s.slice(0, idxWhy).trim(); // "Possible pivot X: <title>"
  const rest = s.slice(idxWhy).trim(); // starts with "Why it fits: ..."

  // Token positions (allow optional spaces before colon)
  const tokenDefs = [
    { label: 'Why it fits:', re: /\bwhy it fits\s*:/i },
    { label: 'Missing signals:', re: /\bmissing signals\s*:/i },
    { label: 'Fast proof artifact:', re: /\bfast proof artifact\s*:/i },
    { label: 'Cost/tradeoff:', re: /\bcost\/tradeoff\s*:/i },
  ];

  const positions = tokenDefs
    .map((t) => {
      const idx = indexOfRegexCI(rest, t.re);
      return { ...t, idx };
    })
    .filter((t) => t.idx !== -1)
    .sort((a, b) => a.idx - b.idx);

  if (positions.length === 0) return raw;

  const outLines = [];
  for (let i = 0; i < positions.length; i++) {
    const cur = positions[i];
    const next = positions[i + 1];
    const start = cur.idx;
    const end = next ? next.idx : rest.length;
    const segment = rest.slice(start, end).trim();

    // Normalize label casing and spacing
    let x = segment;
    x = x.replace(/^\s*why it fits\s*:\s*/i, 'Why it fits: ');
    x = x.replace(/^\s*missing signals\s*:\s*/i, 'Missing signals: ');
    x = x.replace(/^\s*fast proof artifact\s*:\s*/i, 'Fast proof artifact: ');
    x = x.replace(/^\s*cost\/tradeoff\s*:\s*/i, 'Cost/tradeoff: ');

    outLines.push(x.trim());
  }

  // Ensure all 4 labeled lines exist; if model omitted one, keep what we have.
  return `${title}\n${outLines.join('\n')}`.trim();
}

function removeStayTheCourseLeaks(block) {
  if (!block || typeof block !== 'object') return block;

  const fields = ['objectives', 'actions', 'metrics', 'quickWins', 'risks'];
  for (const f of fields) {
    const arr = ensureArray(block[f]).filter(Boolean);
    block[f] = arr.filter((x) => !(isNonEmptyString(x) && startsWithStayRequirement(x)));
  }
  return block;
}

function enforceComparePlacement(plan) {
  try {
    if (!plan || typeof plan !== 'object') return plan;

    if (!plan.day30 || typeof plan.day30 !== 'object') plan.day30 = {};
    if (!plan.day60 || typeof plan.day60 !== 'object') plan.day60 = {};
    if (!plan.day90 || typeof plan.day90 !== 'object') plan.day90 = {};

    // Remove "Stay-the-course requirement(s):" from day60/day90 (must only live in day30)
    plan.day60 = removeStayTheCourseLeaks(plan.day60);
    plan.day90 = removeStayTheCourseLeaks(plan.day90);

    const obj = ensureArray(plan.day30.objectives).filter(Boolean);
    const act = ensureArray(plan.day30.actions).filter(Boolean);

    // Current alignment: EXACTLY ONE, FIRST
    const alignmentLines = obj.filter(
      (x) => isNonEmptyString(x) && x.trim().startsWith('Current alignment:')
    );
    const alignmentLine = alignmentLines.length
      ? String(alignmentLines[0]).trim()
      : 'Current alignment: (not provided)';

    const withoutAlignment = obj.filter(
      (x) => !(isNonEmptyString(x) && x.trim().startsWith('Current alignment:'))
    );

    // Stay-the-course requirements: LAST 3–5 items
    const stayLines = withoutAlignment.filter((x) => isNonEmptyString(x) && startsWithStayRequirement(x));
    const otherObjectives = withoutAlignment.filter((x) => !(isNonEmptyString(x) && startsWithStayRequirement(x)));

    let finalStay = stayLines.slice(0, 5).map((x) => {
      // Normalize singular -> plural for consistency
      return String(x).replace(/^Stay-the-course requirement:\s*/i, 'Stay-the-course requirements: ').trim();
    });

    if (finalStay.length === 0) {
      finalStay = [
        'Stay-the-course requirements: Show one measurable outcome you can repeat (time saved, satisfaction improvement, fewer repeat issues).',
        'Stay-the-course requirements: Demonstrate tool use beyond basics (ticketing, documentation, reporting, or workflow ownership).',
        'Stay-the-course requirements: Take ownership end-to-end on at least one recurring problem and document the before/after.',
      ];
    } else if (finalStay.length < 3) {
      const pads = [
        'Stay-the-course requirements: Show measurable outcomes (before/after) from support or process improvements.',
        'Stay-the-course requirements: Demonstrate ownership (end-to-end) on at least one recurring issue or workflow.',
        'Stay-the-course requirements: Show scope growth (mentoring, leading a small initiative, or standardizing a process).',
      ];
      while (finalStay.length < 3 && pads.length) finalStay.push(pads.shift());
    }

    plan.day30.objectives = [alignmentLine, ...otherObjectives, ...finalStay];

    // Possible pivots: FIRST items in day30.actions, cap to 4, and force multiline blocks
    const pivotLinesRawAll = act.filter((x) => isNonEmptyString(x) && x.trim().startsWith('Possible pivot '));
    const pivotLinesRaw = pivotLinesRawAll.slice(0, 4);
    const pivotLines = pivotLinesRaw.map((x) => coercePivotToMultiline(x));

    const nonPivotLines = act.filter(
      (x) => !(isNonEmptyString(x) && x.trim().startsWith('Possible pivot '))
    );

    plan.day30.actions = [...pivotLines, ...nonPivotLines];

    // Decision Seal: ensure day90.presentation includes the three labels
    const pres = String(plan.day90.presentation || '').trim();
    const hasSeal = pres.includes('If you stay:') && pres.includes('If you pivot:') && pres.includes('Next step:');

    if (!hasSeal) {
      const seal = [
        'If you stay: Pick one “Current alignment” role and define success as a measurable outcome + stronger tool usage + one documented end-to-end win in the next 30–60 days.',
        'If you pivot: Do not pivot until you complete ONE “Fast proof artifact” from your chosen pivot and can show it as a deliverable (case study, report, or portfolio item).',
        'Next step: Take this plan to a coach or mentor to validate the best path, tighten your proof artifact, and confirm which job titles to pursue first.',
      ].join('\n\n');

      plan.day90.presentation = pres ? `${pres}\n\n${seal}` : seal;
    }

    return plan;
  } catch {
    return plan;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });
    }

    const session = await getServerSession(req, res, authOptions);

    const sessionUserId = String(session?.user?.id || '').trim();
    const sessionEmail = String(session?.user?.email || '').trim();

    if (!sessionUserId && !sessionEmail) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { resumeId, direction: directionRaw, pivotTarget: pivotTargetRaw } = req.body || {};
    const resumeIdNum = Number(String(resumeId || '').trim());
    const direction = normalizeDirection(directionRaw);
    const pivotTarget = String(pivotTargetRaw || '').trim();

    if (!resumeId || Number.isNaN(resumeIdNum)) {
      return res.status(400).json({ error: 'Missing or invalid resumeId' });
    }

    if (direction === 'pivot' && !pivotTarget) {
      return res
        .status(400)
        .json({ error: 'Missing pivotTarget. Please specify what you want to pivot into.' });
    }

    const user = await prisma.user.findFirst({
      where: sessionUserId ? { id: sessionUserId } : { email: sessionEmail.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        headline: true,
        location: true,
        plan: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const resume = await prisma.resume.findFirst({
      where: { id: resumeIdNum, userId: user.id },
      select: { id: true, name: true, content: true, createdAt: true, isPrimary: true },
    });

    if (!resume) return res.status(404).json({ error: 'Resume not found' });

    const candidateName =
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      user.email ||
      sessionEmail ||
      'Candidate';

    const systemPrompt = `
You are a practical career operator and hiring manager advisor.

Goal:
Generate a 30/60/90 day onboarding and growth plan based on the resume content.
This tool supports three modes:
- grow: staying the course (increase market value)
- pivot: pivoting into a specific target role (user provides the target)
- compare: user is unsure; provide a structured contrast (alignment → staying vs pivoting → gaps/costs → implications)

Hard rules:
- Do NOT fabricate salary numbers, compensation statistics, or fake benchmarks.
- Keep recommendations concrete and testable.
- If the resume suggests gaps, call them out calmly and propose a plan to close them.
- Do NOT assume the user wants UX or any specific pivot unless explicitly provided or clearly supported by resume signals.
- Output MUST be valid JSON. No extra keys. No commentary outside JSON.

Style requirements:
- Write for a real person, not a demo. Clean, digestible, and human.
- Prefer short bullets. Avoid repetition.
- Every action should produce an observable outcome (a proof artifact, measurable change, or decision).

Tone:
Direct, supportive, professional. No fluff.
`.trim();

    const modeRequirements = `
Mode behavior requirements:

1) grow (stay the course):
- Treat staying as an active decision.
- Focus on increasing market value: scope, impact, credibility.
- Recommend next-level roles or responsibility expansions based on the resume.
- Actions should compound results (ship work, document impact, lead small initiatives).

2) pivot (user is sure):
- The user will provide a pivotTarget role/direction.
- Compare current resume vs pivotTarget:
  - Direct matches (transferable strengths)
  - Partial matches
  - Missing signals (what is not present on the resume yet)
- Provide a realistic bridge plan with near-term proof-building steps.
- Do not hype; be mechanical and honest.

3) compare (user is not sure):
- Do NOT choose a single pivot target. Do NOT default to UX, Product, or any specific field.
- Compare mode must help the user decide, not drift.

Placement rules (compare mode):
- "Current alignment" MUST appear as exactly ONE item in day30.objectives and be the FIRST item.
  - Format exactly:
    "Current alignment: Role 1, Role 2, Role 3, Role 4"
  - Do NOT repeat or restate current alignment anywhere else.

- "Possible pivots" MUST appear as the FIRST items in day30.actions.
  - Provide 2–4 pivot directions inferred from the resume (not random, keep adjacent if resume is narrow).
  - Each pivot MUST be ONE string with line breaks, formatted exactly like this:

Possible pivot X: <Pivot title>
Why it fits: ...
Missing signals: ...
Fast proof artifact: ...
Cost/tradeoff: ...

  - Each labeled line MUST be on its own line.

- "Stay-the-course requirements" MUST be the LAST items inside day30.objectives (3–5 total).
  - Keep each requirement short and concrete.

Decision Seal (compare mode):
- day90.presentation MUST include:
  "If you stay:" ...,
  "If you pivot:" ...,
  "Next step:" ...

UX guardrail (compare mode):
- Do NOT recommend UX skill-building or UX tools unless UX is explicitly listed as one of the Possible pivots.

Training guardrail (compare mode):
- Do NOT recommend enrolling in training unless it is tied to a listed pivot option and names the proof artifact it enables.
`.trim();

    const userPrompt = `
Candidate: ${candidateName}
Candidate headline: ${user.headline || 'N/A'}
Candidate location: ${user.location || 'N/A'}
Resume name: ${resume.name}

Direction selected: ${directionLabel(direction)}
${direction === 'pivot' ? `Pivot target (user-selected): ${pivotTarget}` : ''}

Resume content:
${resume.content}

Return JSON in this exact structure:

{
  "meta": {
    "generatedAt": "",
    "candidate": "",
    "headline": ""
  },
  "day30": {
    "objectives": [],
    "actions": [],
    "metrics": [],
    "quickWins": [],
    "risks": [],
    "presentation": ""
  },
  "day60": {
    "objectives": [],
    "actions": [],
    "metrics": [],
    "quickWins": [],
    "risks": [],
    "presentation": ""
  },
  "day90": {
    "objectives": [],
    "actions": [],
    "metrics": [],
    "quickWins": [],
    "risks": [],
    "presentation": ""
  },
  "growthRecommendations": [],
  "skillsFocus": []
}

Global notes:
- "presentation" should be a short script describing how the candidate should present themselves for that phase.
- Include a few actions that explicitly say to use ForgeTomorrow tools when appropriate:
  - Resume Builder
  - Profile Builder
  - Offer Negotiation
- Keep lists concise, specific, and non-repetitive.
- If you recommend learning, tie it to a proof artifact (case study, documented improvement, measurable outcome, portfolio item).

${modeRequirements}
`.trim();

    let rawText = '';
    let parsed = null;

    try {
      if (client?.responses?.create) {
        const resp = await client.responses.create({
          model: 'gpt-4.1-mini',
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        });

        rawText = extractTextFromResponsesApi(resp);
        parsed = safeJsonParse(rawText);
      }
    } catch (e) {
      console.error('[roadmap/onboarding-growth/generate] Responses API failed:', e?.message || e);
    }

    if (!parsed) {
      try {
        const resp = await client.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        });

        rawText = extractTextFromChatCompletions(resp);
        parsed = safeJsonParse(rawText);
      } catch (e) {
        console.error('[roadmap/onboarding-growth/generate] Chat Completions failed:', e?.message || e);
        return res.status(500).json({ error: 'Failed to generate roadmap' });
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('[roadmap/onboarding-growth/generate] Could not parse JSON. Raw:', rawText);
      return res.status(500).json({ error: 'Failed to generate roadmap' });
    }

    // Enforce compare-mode structure and formatting (last-5% polish)
    if (direction === 'compare') {
      parsed = enforceComparePlacement(parsed);
    }

    // Optional debug (set DEBUG_ROADMAP=1 to verify newline behavior)
    if (process.env.DEBUG_ROADMAP === '1') {
      try {
        const firstAction = String(parsed?.day30?.actions?.[0] || '');
        console.log('ROADMAP_DEBUG', {
          direction,
          firstActionPreview: firstAction.slice(0, 220),
          hasNewline: firstAction.includes('\n'),
        });
      } catch {
        // ignore
      }
    }

    // Stamp meta fields
    try {
      const nowIso = new Date().toISOString();
      if (!parsed.meta || typeof parsed.meta !== 'object') parsed.meta = {};
      parsed.meta.generatedAt = parsed.meta.generatedAt || nowIso;
      parsed.meta.candidate = parsed.meta.candidate || candidateName;

      const baseHeadline = user.headline || 'N/A';
      if (direction === 'pivot') {
        parsed.meta.headline = parsed.meta.headline || `${baseHeadline} • Pivot target: ${pivotTarget}`;
      } else {
        parsed.meta.headline = parsed.meta.headline || `${baseHeadline} • ${directionLabel(direction)}`;
      }
    } catch {
      // ignore
    }

    // Save + return roadmapId
    let created = null;
    try {
      created = await prisma.careerRoadmap.create({
        data: {
          userId: user.id,
          data: parsed,
          isPro: String(user.plan || 'FREE') !== 'FREE',
        },
        select: { id: true },
      });
    } catch (e) {
      console.error('[roadmap/onboarding-growth/generate] Failed to save CareerRoadmap:', e?.message || e);
    }

    if (!created?.id) {
      return res.status(200).json({ plan: parsed, roadmapId: null });
    }

    return res.status(200).json({ roadmapId: created.id, plan: parsed });
  } catch (err) {
    console.error('[roadmap/onboarding-growth/generate] Unhandled error', err);
    return res.status(500).json({ error: 'Failed to generate roadmap' });
  }
}
