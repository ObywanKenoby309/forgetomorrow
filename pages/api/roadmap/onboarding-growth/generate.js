import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function safeString(v) {
  return typeof v === 'string' ? v.trim() : '';
}

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
    const userId = session?.user?.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const resumeId = safeString(req.body?.resumeId);
    if (!resumeId) return res.status(400).json({ error: 'Missing resumeId' });

    // Fetch resume from DB (source of truth)
    const resume = await prisma.resume.findFirst({
      where: { id: Number(resumeId), userId },
      select: { id: true, name: true, content: true, createdAt: true },
    });

    if (!resume?.content) {
      return res.status(404).json({ error: 'Resume not found or has no content' });
    }

    // System rules: grounded, no fake claims
    const systemPrompt = `
You are ForgeTomorrow's Onboarding & Growth roadmap advisor.

Goal:
Create a practical 30/60/90 plan and a 12-month trajectory that helps the candidate:
1) ramp quickly in a new role, OR
2) level up in their current role, OR
3) pivot into a new target role (if implied by their resume).

Hard rules:
- Do NOT invent degrees, employers, certifications, projects, or metrics not present in the resume.
- If information is missing, explicitly say what's missing as "MissingInfo".
- Avoid exact salary numbers. If mentioning market, keep it directional.
- Write in a clear, human, practical tone (no fluff).
- Output MUST be valid JSON matching the schema exactly.
- No extra keys. No commentary outside JSON.

Schema (return exactly):
{
  "meta": {
    "generatedAt": "",
    "candidate": "",
    "headline": "",
    "scenario": "",
    "missingInfo": []
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
  "month12": {
    "growthPath": [],
    "promotionSignals": [],
    "portfolioProof": [],
    "pivotOptions": []
  },
  "recommendations": {
    "skillsFocus": [],
    "credibilityBuilders": [],
    "networkingMoves": [],
    "toolsToUseOnForgeTomorrow": []
  }
}
`.trim();

    const userPrompt = `
Resume name: ${resume?.name || 'Resume'}
Resume created: ${resume?.createdAt ? new Date(resume.createdAt).toISOString() : 'N/A'}

Resume content:
${resume.content}

Instructions:
- Infer candidate name/headline ONLY if clearly present in the resume; otherwise use "Candidate" and a generic headline.
- Determine scenario: "new_role_ramp", "current_role_growth", or "pivot_plan" based on resume signals.
- Include missingInfo list for any inputs that would materially improve accuracy (e.g., target role, industry, current role, location, constraints, portfolio links).
- Keep actions measurable and realistic.
- Make day30/day60/day90 actionable.
- Provide month12 trajectory and pivot options if relevant.
- Include recommended ForgeTomorrow tools (Profile Builder, Resume Builder, Incentive Negotiator, Spotlights).
`.trim();

    let rawText = '';
    let parsed = null;

    // Prefer Responses API when available
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

    // Fallback to Chat Completions
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

    // Save to DB
    const created = await prisma.careerRoadmap.create({
      data: {
        userId,
        data: parsed,
        isPro: false, // you can flip this later based on plan checks
      },
      select: { id: true, createdAt: true },
    });

    return res.status(200).json({ roadmapId: created.id });
  } catch (err) {
    console.error('[roadmap/onboarding-growth/generate] Unhandled error', err);
    return res.status(500).json({ error: 'Failed to generate roadmap' });
  }
}
