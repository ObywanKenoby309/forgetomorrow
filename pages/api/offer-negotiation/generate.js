import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeString(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function safeNumberString(v) {
  const s = String(v ?? '').trim();
  return s;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractTextFromResponsesApi(resp) {
  // Newer SDKs may provide output_text directly
  if (resp?.output_text && typeof resp.output_text === 'string') return resp.output_text;

  // Or provide a nested structure
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
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { formData } = req.body || {};
    if (!formData) {
      return res.status(400).json({ error: 'Missing formData' });
    }

    // Map to your actual form fields
    const jobDescription = safeString(formData.jobDescription);
    const currentJobTitle = safeString(formData.currentJobTitle);
    const currentSalary = safeNumberString(formData.currentSalary);
    const isNewJob = safeString(formData.isNewJob); // 'yes'/'no'
    const location = safeString(formData.location);
    const targetSalaryMin = safeNumberString(formData.targetSalaryMin);
    const targetSalaryMax = safeNumberString(formData.targetSalaryMax);
    const desiredBenefits = safeString(formData.desiredBenefits);
    const jobType = safeString(formData.jobType);
    const industry = safeString(formData.industry);

    const systemPrompt = `
You are an experienced compensation and negotiation advisor.

You help candidates evaluate assumptions, compare market reality, and prepare for real conversations.
You do NOT validate user expectations by default.

Hard rules:
- Do NOT fabricate salary numbers or statistics.
- If you mention market ranges, keep them directional (low / mid / high) and explain what would move them.
- Call out misaligned assumptions when present.
- Acknowledge uncertainty and what info is missing.
- Always include disclaimers: guidance only (not legal/financial/tax advice; outcomes not guaranteed).
- Always encourage consulting a human coach/mentor via ForgeTomorrow Spotlight for incentive negotiations.
- Output MUST be valid JSON matching the schema exactly. No extra keys. No commentary outside JSON.

Tone:
Calm, grounded, professional, human.
`.trim();

    const userPrompt = `
User inputs:
- What they’re negotiating: ${jobDescription || 'N/A'}
- Current job title: ${currentJobTitle || 'N/A'}
- Current salary: ${currentSalary || 'N/A'}
- New job? ${isNewJob === 'yes' ? 'Yes' : isNewJob === 'no' ? 'No (current role)' : 'N/A'}
- Location: ${location || 'N/A'}
- Target salary range: ${targetSalaryMin || 'N/A'} to ${targetSalaryMax || 'N/A'}
- Desired benefits/perks: ${desiredBenefits || 'N/A'}
- Job type: ${jobType || 'N/A'}
- Industry: ${industry || 'N/A'}

Return JSON in this exact structure:

{
  "disclaimer": {
    "summary": "",
    "mentorNote": ""
  },
  "roleContext": {
    "interpretedRole": "",
    "seniorityBand": "",
    "workContext": ""
  },
  "marketReality": {
    "directionalRange": "",
    "marketTension": "",
    "confidenceLevel": ""
  },
  "assumptionCheck": {
    "whatAligns": [],
    "potentialMisalignments": [],
    "unknowns": []
  },
  "valueJustification": {
    "coreLeverage": [],
    "nonSalaryLevers": []
  },
  "negotiationPaths": [
    {
      "label": "Conservative",
      "askFraming": "",
      "bestWhen": "",
      "tradeoffs": ""
    },
    {
      "label": "Balanced",
      "askFraming": "",
      "bestWhen": "",
      "tradeoffs": ""
    },
    {
      "label": "Ambitious",
      "askFraming": "",
      "bestWhen": "",
      "tradeoffs": ""
    }
  ],
  "conversationScript": {
    "emailVersion": "",
    "liveConversationVersion": ""
  },
  "nextSteps": {
    "immediate": [],
    "prepareForPushback": [],
    "walkAwaySignals": []
  },
  "mentorEscalation": {
    "whyItHelps": "",
    "whatToBring": "",
    "spotlightCTA": ""
  }
}
`.trim();

    let rawText = '';
    let parsed = null;

    // 1) Prefer Responses API if available
    try {
      if (client?.responses?.create) {
        const resp = await client.responses.create({
          model: 'gpt-4.1-mini',
          input: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.6,
        });

        rawText = extractTextFromResponsesApi(resp);
        parsed = safeJsonParse(rawText);
      }
    } catch (e) {
      console.error('[offer-negotiation/generate] Responses API failed:', e?.message || e);
    }

    // 2) Fallback to Chat Completions if needed
    if (!parsed) {
      try {
        const resp = await client.chat.completions.create({
          model: 'gpt-4.1-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          // Some accounts/models support this; if not, it’s ignored or throws.
          response_format: { type: 'json_object' },
          temperature: 0.6,
        });

        rawText = extractTextFromChatCompletions(resp);
        parsed = safeJsonParse(rawText);
      } catch (e) {
        console.error('[offer-negotiation/generate] Chat Completions failed:', e?.message || e);
        return res.status(500).json({ error: 'Failed to generate negotiation plan' });
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      console.error('[offer-negotiation/generate] Could not parse JSON. Raw:', rawText);
      return res.status(500).json({ error: 'Failed to generate negotiation plan' });
    }

    return res.status(200).json({ plan: parsed });
  } catch (err) {
    console.error('[offer-negotiation/generate] Unhandled error', err);
    return res.status(500).json({ error: 'Failed to generate negotiation plan' });
  }
}
