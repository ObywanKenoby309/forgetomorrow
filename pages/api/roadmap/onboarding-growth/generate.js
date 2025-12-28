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

    // ✅ Auth by user.id (email may not exist depending on JWT/session shape)
    const sessionUserId = String(session?.user?.id || '').trim();
    const sessionEmail = String(session?.user?.email || '').trim();

    if (!sessionUserId && !sessionEmail) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { resumeId } = req.body || {};
    const resumeIdNum = Number(String(resumeId || '').trim());

    if (!resumeId || Number.isNaN(resumeIdNum)) {
      return res.status(400).json({ error: 'Missing or invalid resumeId' });
    }

    // ✅ Prefer lookup by id; fall back to email if needed
    const user = await prisma.user.findFirst({
      where: sessionUserId
        ? { id: sessionUserId }
        : { email: sessionEmail.toLowerCase() },
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
This tool is meant to push the candidate to the next level OR support a pivot plan.
ForgeTomorrow already has separate tools for: Resume Builder, Profile Builder, and Offer Negotiation.
So do not duplicate those tools. Instead, reference them as action steps when useful.

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

Notes:
- "presentation" should be a short script on how the candidate should present themselves for that phase.
- Include a few actions that explicitly say to use ForgeTomorrow tools when appropriate:
  - Resume Builder
  - Profile Builder
  - Offer Negotiation
`.trim();

    let rawText = '';
    let parsed = null;

    // Prefer Responses API
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

    // Fallback: Chat Completions
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

    // Save to DB (CareerRoadmap model)
    try {
      await prisma.careerRoadmap.create({
        data: {
          userId: user.id,
          data: parsed,
          isPro: String(user.plan || 'FREE') !== 'FREE',
        },
      });
    } catch (e) {
      console.error('[roadmap/onboarding-growth/generate] Failed to save CareerRoadmap:', e?.message || e);
      // Still return plan even if saving fails
    }

    return res.status(200).json({ plan: parsed });
  } catch (err) {
    console.error('[roadmap/onboarding-growth/generate] Unhandled error', err);
    return res.status(500).json({ error: 'Failed to generate roadmap' });
  }
}
