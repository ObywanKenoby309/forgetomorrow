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

    // ✅ pivotTarget accepted (required for direction=pivot)
    const { resumeId, direction: directionRaw, pivotTarget: pivotTargetRaw } = req.body || {};
    const resumeIdNum = Number(String(resumeId || '').trim());
    const direction = normalizeDirection(directionRaw);
    const pivotTarget = String(pivotTargetRaw || '').trim();

    if (!resumeId || Number.isNaN(resumeIdNum)) {
      return res.status(400).json({ error: 'Missing or invalid resumeId' });
    }

    // ✅ Pivot must stop and ask where the user is pivoting to
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

Tone:
Direct, supportive, professional. No fluff.
`.trim();

    const modeRequirements = `
Mode behavior requirements:

1) grow (stay the course):
- Treat staying as an active decision.
- Focus on increasing market value: scope, impact, credibility.
- Recommend next-level roles or responsibility expansions based on the resume.
- Actions should be about compounding results, not "start over".

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
- You MUST place "Current alignment" and "Possible pivots" into the existing schema like this:
  - Put "Current alignment" as the FIRST items inside day30.objectives.
  - Put "Possible pivots" as the FIRST items inside day30.actions.
  - Each pivot option MUST include: Why it fits, Missing signals, Fast proof artifact, Cost/tradeoff.
- Current alignment: list 3–6 job titles the candidate already fits TODAY based only on the resume.
- Possible pivots: list 2–4 pivot directions inferred from the resume (NOT random).
- If the resume does NOT strongly support a pivot category, explicitly say so and keep pivots adjacent.
- Only mention “UX / Figma / wireframing” if (a) the resume contains UX signals, OR (b) the user explicitly says UX, OR (c) it’s listed as one of multiple pivot options with clear justification.
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

${modeRequirements}

Additional constraints:
- Keep lists concise and specific (avoid generic “take a course” unless you name what outcome it creates).
- If you recommend learning, tie it to a proof artifact (portfolio item, documented improvement, measurable outcome, etc.).
- For compare mode, do NOT recommend enrolling in any specific pivot training unless it is tied to one of the listed pivot options and includes a proof artifact.
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
          temperature: 0.5,
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
          temperature: 0.5,
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

    // ✅ Save + return roadmapId
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
