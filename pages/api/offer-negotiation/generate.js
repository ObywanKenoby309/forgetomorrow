import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeStr(v) {
  return String(v ?? '').trim();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { formData } = req.body || {};
    if (!formData) {
      return res.status(400).json({ error: 'Missing formData' });
    }

    // Your CURRENT form schema
    const jobDescription = safeStr(formData.jobDescription);
    const currentJobTitle = safeStr(formData.currentJobTitle);
    const currentSalary = safeStr(formData.currentSalary);
    const isNewJob = safeStr(formData.isNewJob); // 'yes' | 'no'
    const location = safeStr(formData.location);
    const targetSalaryMin = safeStr(formData.targetSalaryMin);
    const targetSalaryMax = safeStr(formData.targetSalaryMax);
    const desiredBenefits = safeStr(formData.desiredBenefits);
    const jobType = safeStr(formData.jobType);
    const industry = safeStr(formData.industry);

    const systemPrompt = `
You are an experienced compensation and negotiation advisor.

You help candidates evaluate assumptions, compare market reality, and prepare for real conversations.
You do NOT validate user expectations by default.

Rules:
- Never fabricate salary numbers, statistics, or citations
- If market data is missing, give directional guidance only (low / mid / high) and list unknowns
- Explicitly call out assumption misalignment when present (politely, clearly)
- Acknowledge uncertainty and what inputs would reduce it
- Always include disclaimers: guidance only, not legal/financial/tax advice, outcomes not guaranteed
- Always encourage consulting a human coach/mentor, and reference the Spotlight page
- Tone: calm, grounded, professional, human

Output:
Return ONLY valid JSON matching the required schema. No extra keys. No commentary outside JSON.
`.trim();

    const userPrompt = `
User context:

Target role / offer context (from user):
${jobDescription || 'N/A'}

Current job title:
${currentJobTitle || 'N/A'}

Current salary:
${currentSalary || 'N/A'}

Is this a new job (yes) or current job (no)?
${isNewJob || 'N/A'}

Location:
${location || 'N/A'}

User-entered target salary range (optional):
Min: ${targetSalaryMin || 'N/A'}
Max: ${targetSalaryMax || 'N/A'}

Desired benefits/perks (optional):
${desiredBenefits || 'N/A'}

Job type (optional):
${jobType || 'N/A'}

Industry (optional):
${industry || 'N/A'}

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

    const completion = await client.responses.create({
      model: process.env.OPENAI_OFFER_NEGOTIATION_MODEL || 'gpt-4.1-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.55,
    });

    const raw = completion.output_text || '{}';

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    if (!parsed || typeof parsed !== 'object') {
      return res.status(502).json({ error: 'AI response could not be parsed' });
    }

    return res.status(200).json({ plan: parsed });
  } catch (err) {
    console.error('[offer-negotiation/generate]', err);
    return res.status(500).json({ error: 'Failed to generate negotiation plan' });
  }
}
