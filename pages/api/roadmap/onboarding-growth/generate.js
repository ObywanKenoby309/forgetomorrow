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

    const { resumeId, direction: directionRaw } = req.body || {};
    const resumeIdNum = Number(String(resumeId || '').trim());
    const direction = normalizeDirection(directionRaw);

    if (!resumeId || Number.isNaN(resumeIdNum)) {
      return res.status(400).json({ error: 'Missing or invalid resumeId' });
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
This tool can help the candidate level up in their current path, pivot into a new path, or compare both.
ForgeTomorrow already has separate tools for: Resume Builder, Profile Builder, and Offer Negotiation.
Do not duplicate those tools. Reference them as action steps when useful.

Hard rules:
- Do NOT fabricate specific salary numbers, compensation statistics, or fake metrics.
- Keep recommendations concrete and testable.
- If the resume suggests gaps, call them out calmly and propose a plan to close them.
- Output MUST be valid JSON. No extra keys. No commentary outside JSON.

Tone:
Direct, supportive, professional. No fluff.
`.trim();

    const userPrompt = `
Candidate: ${candidateName}
Candidate headline: ${user.headline || 'N/A'}
Candidate location: ${user.location || 'N/A'}
Resume name: ${resume.name}

Direction selected:
${directionLabel(direction)}

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

Requirements based on direction:
- If direction is "grow": focus on leveling up in the candidate's current track, promotions, deeper scope, stronger outcomes.
- If direction is "pivot": include a realistic bridge plan, transferable skills, and a 60-90 day skill-building sequence.
- If direction is "compare": structure the plan so actions and recommendations explicitly address both paths. Do not invent a new JSON schema. Instead:
  - In each phase (day30/day60/day90), include some actions labeled "Stay the course:" and some labeled "Pivot:".
  - In growthRecommendations, include a mix for both paths.

Notes:
- "presentation" should be a short script on how the candidate should present themselves for that phase.
- Include a few actions that explicitly say to use ForgeTomorrow tools when appropriate:
  - Resume Builder
  - Profile Builder
  - Offer Negotiation
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
        console.error('[roadmap/onboarding-growth/generate] Chat Completions failed:', e?.message || e);
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
      parsed.meta.headline = parsed.meta.headline || (user.headline || 'N/A');

      if (typeof parsed.meta.headline === 'string' && !parsed.meta.headline.includes('•')) {
        parsed.meta.headline = `${parsed.meta.headline} • ${directionLabel(direction)}`;
      }
    } catch {
      // ignore
    }

    // ✅ Save + return roadmapId (THIS is what your results.js expects)
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
      // If save failed, you can still return plan (but results page won't work without roadmapId)
      return res.status(200).json({ plan: parsed, roadmapId: null });
    }

    return res.status(200).json({ roadmapId: created.id, plan: parsed });
  } catch (err) {
    console.error('[roadmap/onboarding-growth/generate] Unhandled error', err);
    return res.status(500).json({ error: 'Failed to generate roadmap' });
  }
}
