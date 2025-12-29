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

// Soft validators (do not hard fail user, but reduce drift)
function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

// Enforce compare-mode placement rules to stop drift.
// If the model outputs loosely, we "nudge" structure without changing schema.
function enforceComparePlacement(plan) {
  try {
    if (!plan || typeof plan !== 'object') return plan;
    if (!plan.day30 || typeof plan.day30 !== 'object') return plan;

    const obj = ensureArray(plan.day30.objectives).filter(Boolean);
    const act = ensureArray(plan.day30.actions).filter(Boolean);

    // Ensure Current alignment exists exactly once and first
    const currentIdx = obj.findIndex((x) => isNonEmptyString(x) && x.startsWith('Current alignment:'));
    if (currentIdx > -1) {
      const currentLine = obj[currentIdx];
      const filtered = obj.filter((x, i) => i === currentIdx || !(isNonEmptyString(x) && x.startsWith('Current alignment:')));
      // move to front
      plan.day30.objectives = [currentLine, ...filtered.filter((x) => x !== currentLine)];
    } else {
      // If missing entirely, do not fabricate roles — add a safe placeholder to satisfy UI/format.
      plan.day30.objectives = ['Current alignment: (not provided)', ...obj];
    }

    // Ensure Possible pivots are first items in actions (keep any existing ordering after)
    const pivotLines = act.filter((x) => isNonEmptyString(x) && x.startsWith('Possible pivot '));
    const nonPivotLines = act.filter((x) => !(isNonEmptyString(x) && x.startsWith('Possible pivot ')));
    plan.day30.actions = [...pivotLines, ...nonPivotLines];

    // Ensure Decision Seal in day90.presentation (compare only)
    if (plan.day90 && typeof plan.day90 === 'object') {
      const pres = String(plan.day90.presentation || '').trim();
      const hasSeal =
        pres.includes('If you stay:') &&
        pres.includes('If you pivot:') &&
        pres.includes('Next step:');

      if (!hasSeal) {
        const seal =
          [
            'If you stay: Choose one aligned role from the Current alignment list and define success as measurable impact + stronger tools + a documented outcome in 30–60 days. You are choosing stability and compounding credibility over starting a new track.',
            'If you pivot: Do not pivot yet until you complete ONE fast proof artifact from your chosen pivot option and can show it as a concrete deliverable (case study, report, documented improvement, or portfolio item).',
            'Next step: Take this plan to a coach or mentor and validate (1) which path has the strongest evidence on your resume today, (2) whether the proof artifact is realistic in your schedule, and (3) what job titles you should pursue first.',
          ].join('\n\n');

        plan.day90.presentation = pres ? `${pres}\n\n${seal}` : seal;
      }
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

    // pivotTarget accepted (required for direction=pivot)
    const { resumeId, direction: directionRaw, pivotTarget: pivotTargetRaw } = req.body || {};
    const resumeIdNum = Number(String(resumeId || '').trim());
    const direction = normalizeDirection(directionRaw);
    const pivotTarget = String(pivotTargetRaw || '').trim();

    if (!resumeId || Number.isNaN(resumeIdNum)) {
      return res.status(400).json({ error: 'Missing or invalid resumeId' });
    }

    // Pivot must stop and ask where the user is pivoting to
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
- compare: user is unsure; provide a structured contrast that leads to a decision

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
- The user provides pivotTarget.
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

  - Each of the four labeled lines MUST be on its own line.
- "Stay-the-course requirements" MUST be the LAST items inside day30.objectives (3–5 total).
  - These are the specific signals the resume must show to level up in the current track:
    scope, tools, outcomes, leadership, measurable impact.
  - Keep each requirement short and concrete.

Decision Seal (compare mode):
- day90.presentation MUST include three short paragraphs with these labels:
  "If you stay:" ...,
  "If you pivot:" ...,
  "Next step:" ...
- This is a decision gate, not motivation.

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

    // Prefer Responses API, fallback to Chat Completions (keeps reliability)
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
        console.error(
          '[roadmap/onboarding-growth/generate] Chat Completions failed:',
          e?.message || e
        );
        return res.status(500).json({ error: 'Failed to generate roadmap' });
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('[roadmap/onboarding-growth/generate] Could not parse JSON. Raw:', rawText);
      return res.status(500).json({ error: 'Failed to generate roadmap' });
    }

    // Post-processing: enforce compare placement + decision seal if direction === 'compare'
    if (direction === 'compare') {
      parsed = enforceComparePlacement(parsed);
    }

    // Stamp meta fields (kept from your working version)
    try {
      const nowIso = new Date().toISOString();
      if (!parsed.meta || typeof parsed.meta !== 'object') parsed.meta = {};
      parsed.meta.generatedAt = parsed.meta.generatedAt || nowIso;
      parsed.meta.candidate = parsed.meta.candidate || candidateName;

      const baseHeadline = user.headline || 'N/A';
      if (direction === 'pivot') {
        parsed.meta.headline =
          parsed.meta.headline || `${baseHeadline} • Pivot target: ${pivotTarget}`;
      } else {
        parsed.meta.headline =
          parsed.meta.headline || `${baseHeadline} • ${directionLabel(direction)}`;
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
      console.error(
        '[roadmap/onboarding-growth/generate] Failed to save CareerRoadmap:',
        e?.message || e
      );
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
