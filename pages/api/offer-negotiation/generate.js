// pages/api/offer-negotiation/generate.js

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
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { formData } = req.body || {};
    if (!formData) {
      return res.status(400).json({ error: 'Missing formData' });
    }

    // Core
    const jobDescription = safeString(formData.jobDescription);
    const currentJobTitle = safeString(formData.currentJobTitle);
    const currentSalary = safeNumberString(formData.currentSalary);
    const isNewJob = safeString(formData.isNewJob);
    const location = safeString(formData.location);
    const targetSalaryMin = safeNumberString(formData.targetSalaryMin);
    const targetSalaryMax = safeNumberString(formData.targetSalaryMax);
    const desiredBenefits = safeString(formData.desiredBenefits);
    const jobType = safeString(formData.jobType);
    const industry = safeString(formData.industry);

    // Evidence
    const skillsCertsExperience = safeString(formData.skillsCertsExperience);
    const yearsRelevantExperience = safeNumberString(formData.yearsRelevantExperience);
    const portfolioLinks = safeString(formData.portfolioLinks);
    const notableProjectsEvidence = safeString(formData.notableProjectsEvidence);

    // Offer snapshot
    const hasOffer = safeString(formData.hasOffer);
    const offerCompany = safeString(formData.offerCompany);
    const offerRoleTitle = safeString(formData.offerRoleTitle);
    const offerBaseSalary = safeNumberString(formData.offerBaseSalary);
    const offerBonus = safeString(formData.offerBonus);
    const offerSignOn = safeNumberString(formData.offerSignOn);
    const offerEquity = safeString(formData.offerEquity);
    const offerBenefitsNotes = safeString(formData.offerBenefitsNotes);
    const offerDeadline = safeString(formData.offerDeadline);
    const offerWorkMode = safeString(formData.offerWorkMode);
    const offerOtherComp = safeString(formData.offerOtherComp);

    // Leverage + preferences
    const competingOffers = safeString(formData.competingOffers);
    const competingOffersCount = safeNumberString(formData.competingOffersCount);
    const bestAlternativeNotes = safeString(formData.bestAlternativeNotes);

    const preferredWorkMode = safeString(formData.preferredWorkMode);
    const willingnessToRelocate = safeString(formData.willingnessToRelocate);
    const mustHaves = safeString(formData.mustHaves);
    const dealBreakers = safeString(formData.dealBreakers);

    const topPriority = safeString(formData.topPriority);
    const secondPriority = safeString(formData.secondPriority);
    const thirdPriority = safeString(formData.thirdPriority);

    const desiredStartDate = safeString(formData.desiredStartDate);
    const confidenceLevel = safeString(formData.confidenceLevel); // low / medium / high

    const systemPrompt = `
You are ForgeTomorrow's Offer & Negotiation Intelligence Engine — a decisive compensation advisor, not a passive presenter of options.

Your job: Make a clear call. Tell the candidate exactly what to do, what to ask for, and what to protect.

CORE PHILOSOPHY:
- You are a trusted advisor who has seen hundreds of negotiations. You give a recommendation, not a menu.
- The candidate is looking for clarity, not options. Give them a move.
- Every section must serve the decision. Cut anything that doesn't.

HARD RULES:
- NEVER fabricate salary numbers or market statistics.
- Keep market ranges directional (low / mid / high) with explanation — never specific invented figures.
- Call out misaligned expectations directly, with respect but without softening.
- Acknowledge what's unknown and what it means for confidence level.
- Disclaimers: guidance only — not legal, financial, or tax advice. Outcomes not guaranteed.
- Factor ALL provided evidence (years, certs, projects, competing offers) into leverage assessment.
- Scripts must sound like a real human professional, not a template. Specific to this person, this role, this company.

DECISION CARD — REQUIRED AND CRITICAL:
You MUST lead with a decisive recommendation in the "decision" field:
- recommendedMove: ONE of: "Negotiate", "Accept", "Hold", "Walk Away" — no hedging
- leverageBand: ONE of: "Strong", "Moderate", "Developing", "Weak" — be honest
- riskLevel: ONE of: "Low", "Low-Moderate", "Moderate", "High"
- targetAsk: The specific number or range to open with — based on evidence, not wishes
- fallbackFloor: The minimum acceptable — below this, walk
- doNotTradeAway: 1-3 items the candidate must protect no matter what
- oneLineSummary: One sentence. Decisive. No hedging. e.g. "You have moderate leverage — push to $60k and protect remote, or walk."

SCRIPTS must be sharp, human, and specific:
- No "Dear Hiring Manager" openers that sound like templates
- Reference the specific role, company (if known), and the candidate's strongest proof point
- Email: confident, brief, specific ask in the first two sentences
- Live conversation: natural, direct, not robotic

TONE: Direct. Grounded. Confident. Like a mentor who respects the candidate enough to be honest.

Output MUST be valid JSON matching the schema exactly. No extra keys. No commentary outside JSON.
`.trim();

    const userPrompt = `
User inputs:

Core:
- What they are negotiating (role/JD): ${jobDescription || 'N/A'}
- Current job title: ${currentJobTitle || 'N/A'}
- Current salary: ${currentSalary || 'N/A'}
- New job? ${isNewJob === 'yes' ? 'Yes' : isNewJob === 'no' ? 'No (current role)' : isNewJob || 'N/A'}
- Location: ${location || 'N/A'}
- Target salary range: ${targetSalaryMin || 'N/A'} to ${targetSalaryMax || 'N/A'}
- Desired benefits/perks: ${desiredBenefits || 'N/A'}
- Job type: ${jobType || 'N/A'}
- Industry: ${industry || 'N/A'}

Evidence (important):
- Years of relevant experience: ${yearsRelevantExperience || 'N/A'}
- Skills/certs/experience: ${skillsCertsExperience || 'N/A'}
- Portfolio links: ${portfolioLinks || 'N/A'}
- Notable projects / proof of impact: ${notableProjectsEvidence || 'N/A'}

Offer snapshot:
- Has offer? ${hasOffer || 'N/A'}
- Company: ${offerCompany || 'N/A'}
- Offered role title: ${offerRoleTitle || 'N/A'}
- Offer base salary: ${offerBaseSalary || 'N/A'}
- Offer annual bonus: ${offerBonus || 'N/A'}
- Offer sign-on: ${offerSignOn || 'N/A'}
- Offer equity: ${offerEquity || 'N/A'}
- Offer benefits notes: ${offerBenefitsNotes || 'N/A'}
- Offer work mode: ${offerWorkMode || 'N/A'}
- Offer deadline: ${offerDeadline || 'N/A'}
- Other comp notes: ${offerOtherComp || 'N/A'}

Leverage and preferences:
- Competing offers? ${competingOffers || 'N/A'}
- Number of competing offers: ${competingOffersCount || 'N/A'}
- Best alternative notes: ${bestAlternativeNotes || 'N/A'}
- Preferred work mode: ${preferredWorkMode || 'N/A'}
- Willing to relocate? ${willingnessToRelocate || 'N/A'}
- Desired start date: ${desiredStartDate || 'N/A'}
- Priorities (top 3): ${[topPriority, secondPriority, thirdPriority].filter(Boolean).join(', ') || 'N/A'}
- Must-haves: ${mustHaves || 'N/A'}
- Deal-breakers: ${dealBreakers || 'N/A'}
- Candidate confidence level: ${confidenceLevel === 'low' ? 'Low — needs clear anchoring and scripted language' : confidenceLevel === 'high' ? 'High — optimize for ambitious path, hold-firm language' : 'Medium — balanced approach'}

Return JSON in this exact structure:

{
  "decision": {
    "recommendedMove": "Negotiate | Accept | Hold | Walk Away",
    "leverageBand": "Strong | Moderate | Developing | Weak",
    "riskLevel": "Low | Low-Moderate | Moderate | High",
    "targetAsk": "",
    "fallbackFloor": "",
    "doNotTradeAway": [],
    "oneLineSummary": ""
  },
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
          temperature: 0.3,
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
          response_format: { type: 'json_object' },
          temperature: 0.3,
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