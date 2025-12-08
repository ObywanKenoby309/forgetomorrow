// pages/api/offer-negotiation/generate.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // Pull out only what you need from the form
    const {
      currentRole,
      targetRole,
      currentBase,
      targetBase,
      location,
      remotePreference,
      benefits,
      competingOffers,
      riskTolerance,
      keyWins,
      constraints,
    } = formData;

    const prompt = `
You are a senior compensation & negotiation coach.

User context:
- Current role: ${currentRole || 'N/A'}
- Target role: ${targetRole || 'N/A'}
- Current base: ${currentBase || 'N/A'}
- Target base: ${targetBase || 'N/A'}
- Location: ${location || 'N/A'}
- Remote preference: ${remotePreference || 'N/A'}
- Benefits priorities: ${benefits || 'N/A'}
- Competing offers / leverage: ${competingOffers || 'N/A'}
- Risk tolerance: ${riskTolerance || 'N/A'}
- Key wins / impact: ${keyWins || 'N/A'}
- Constraints (family, health, etc.): ${constraints || 'N/A'}

Return a JSON object with this exact shape (no extra fields, no commentary outside JSON):

{
  "headline": "one sentence summary of strategy",
  "marketSummary": "short paragraph on how their ask fits the market (no fake numbers, just directional)",
  "leveragePoints": [
    "bullet 1",
    "bullet 2"
  ],
  "risks": [
    "bullet 1",
    "bullet 2"
  ],
  "counterOffers": [
    {
      "label": "Conservative",
      "description": "what they should ask for",
      "whenToUse": "when to use this path"
    },
    {
      "label": "Balanced",
      "description": "what they should ask for",
      "whenToUse": "when to use this path"
    },
    {
      "label": "Aggressive",
      "description": "what they should ask for",
      "whenToUse": "when to use this path"
    }
  ],
  "recruiterScript": "word-for-word script they can paste into email or say on a call",
  "fallbackPlan": "how to walk away or pause gracefully if they need to protect themselves"
}
    `.trim();

    const completion = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: prompt,
      response_format: { type: 'json_object' },
    });

    const raw = completion.output[0]?.content[0]?.text || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { headline: 'Negotiation plan', error: 'Could not parse AI response' };
    }

    return res.status(200).json({ plan: parsed });
  } catch (err) {
    console.error('[offer-negotiation/generate] error', err);
    return res.status(500).json({ error: 'Failed to generate negotiation plan' });
  }
}
