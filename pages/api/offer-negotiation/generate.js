// pages/api/offer-negotiation/generate.js
// UNIFIED — DB-first resume evidence before GPT
// Same intelligence backbone as Forge Hammer and Coaching Strategy

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';
import { evaluateSignals } from '@/lib/forge/evidenceEngine';
import { classifyRisk } from '@/lib/forge/riskEngine';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function safeString(v) { return typeof v === 'string' ? v.trim() : ''; }
function safeNum(v) { return String(v ?? '').trim(); }
function safeJsonParse(text) {
  if (!text) return null;
  if (typeof text === 'object') return text;
  try { return JSON.parse(text); } catch { return null; }
}
function extractChat(resp) { return String(resp?.choices?.[0]?.message?.content || ''); }

function normalizeArray(val) {
  return Array.isArray(val) ? val.filter(Boolean) : [];
}

function pickFirstNonEmptyArray(...vals) {
  for (const v of vals) {
    const arr = normalizeArray(v);
    if (arr.length > 0) return arr;
  }
  return [];
}

function normalizeRoot(builderData) {
  if (!builderData || typeof builderData !== 'object') return {};
  return builderData.resumeData || builderData.data || builderData;
}

function buildResumeDataFromStoredResume({ stored, user }) {
  const root = normalizeRoot(stored?.data || stored);
  const formDataRaw = root.formData || root.personalInfo || {};

  return {
    summary: root.summary || root.professionalSummary || root.about || root.summaryText || '',
    skills: normalizeArray(root.skills),
    workExperiences: pickFirstNonEmptyArray(root.experiences, root.workExperiences, root.workExperience),
    educationList: pickFirstNonEmptyArray(root.educationList, root.education, root.educations),
    projects: normalizeArray(root.projects),
    certifications: pickFirstNonEmptyArray(root.certifications, root.certificationList),
    achievements: normalizeArray(root.achievements),
    volunteerExperiences: pickFirstNonEmptyArray(root.volunteerExperiences, root.volunteer, root.volunteering),
    customSections: normalizeArray(root.customSections),
    personalInfo: {
      name: formDataRaw.fullName || formDataRaw.name || user?.name || '',
      email: formDataRaw.email || user?.email || '',
      phone: formDataRaw.phone || '',
      location: formDataRaw.location || '',
      portfolio: formDataRaw.portfolio || formDataRaw.forgeUrl || formDataRaw.ftProfile || '',
      externalurl: formDataRaw.externalurl || '',
      github: formDataRaw.github || '',
      role: formDataRaw.role || formDataRaw.targetedRole || '',
    },
  };
}

function hasResumeEvidence(resumeData) {
  return Boolean(
    resumeData?.summary ||
    resumeData?.workExperiences?.length ||
    resumeData?.skills?.length ||
    resumeData?.projects?.length ||
    resumeData?.certifications?.length ||
    resumeData?.educationList?.length
  );
}

async function loadDbResumeData(userId) {
  const [user, resume] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    }),
    prisma.resume.findFirst({
      where: { userId },
      orderBy: [
        { isPrimary: 'desc' },
        { updatedAt: 'desc' },
      ],
      select: {
        id: true,
        name: true,
        content: true,
        isPrimary: true,
        updatedAt: true,
      },
    }),
  ]);

  if (!resume?.content) {
    return { resumeData: null, resumeMeta: null };
  }

  const stored = safeJsonParse(resume.content);
  if (!stored) {
    console.error('[offer-negotiation/generate] Failed to parse stored resume content', { resumeId: resume.id });
    return { resumeData: null, resumeMeta: null };
  }

  const resumeData = buildResumeDataFromStoredResume({ stored, user });

  return {
    resumeData,
    resumeMeta: {
      id: resume.id,
      name: resume.name || 'Resume',
      isPrimary: resume.isPrimary,
      updatedAt: resume.updatedAt,
      source: 'database',
    },
  };
}

// Seven universal negotiation leverage signals — same categories as Forge Hammer
const NEGOTIATION_SIGNALS = [
  'ownership and accountability',
  'delivery and execution',
  'people leadership and team management',
  'advisory and client service delivery',
  'stakeholder and executive engagement',
  'process and methodology development',
  'domain knowledge and qualification',
];

function runEvidenceEngine(resumeData) {
  if (!resumeData) return { summary: '', leverageBand: '', score: 0 };

  const hasData = hasResumeEvidence(resumeData);

  if (!hasData) return { summary: '', leverageBand: '', score: 0 };

  try {
    const signalResults = evaluateSignals(NEGOTIATION_SIGNALS, resumeData);

    const direct = signalResults.filter(s => s.status === 'direct').map(s => s.signal);
    const adjacentTech = signalResults.filter(s => s.status === 'adjacent_technical').map(s => s.signal);
    const adjacent = signalResults.filter(s => s.status === 'adjacent').map(s => s.signal);
    const missing = signalResults.filter(s => s.status === 'missing').map(s => s.signal);

    const risks = signalResults.map(s => classifyRisk({ signal: s.signal, status: s.status, required: true }));
    const fatalRisks = risks.filter(r => r.level === 'fatal').map(r => r.reason);
    const survivableRisks = risks.filter(r => r.level === 'survivable').map(r => r.reason);

    const lines = [];
    if (direct.length) lines.push(`DIRECTLY PROVEN: ${direct.join(', ')}`);
    if (adjacentTech.length) lines.push(`STRONG ADJACENT EVIDENCE: ${adjacentTech.join(', ')}`);
    if (adjacent.length) lines.push(`ADJACENT EVIDENCE: ${adjacent.join(', ')}`);
    if (missing.length) lines.push(`NOT VISIBLE IN RESUME: ${missing.join(', ')}`);
    if (fatalRisks.length) lines.push(`FATAL GAPS: ${fatalRisks.join(' ')}`);
    if (survivableRisks.length) lines.push(`SURVIVABLE GAPS: ${survivableRisks.slice(0, 2).join(' ')}`);

    const score = (direct.length * 3) + (adjacentTech.length * 2) + (adjacent.length * 1);
    const leverageBand = score >= 14 ? 'Strong' : score >= 7 ? 'Moderate' : score >= 3 ? 'Developing' : 'Weak';

    return { summary: lines.join('\n'), leverageBand, score };
  } catch (e) {
    console.error('[offer-negotiation/generate] Evidence engine error:', e?.message);
    return { summary: '', leverageBand: '', score: 0 };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });

    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

    const { formData, resumeData: clientResumeData } = req.body || {};
    if (!formData) return res.status(400).json({ error: 'Missing formData' });

    const { resumeData: dbResumeData, resumeMeta } = await loadDbResumeData(session.user.id);

    const resolvedResumeData = hasResumeEvidence(dbResumeData)
      ? dbResumeData
      : hasResumeEvidence(clientResumeData)
        ? clientResumeData
        : null;

    const resumeSource = hasResumeEvidence(dbResumeData)
      ? 'database'
      : hasResumeEvidence(clientResumeData)
        ? 'client_context'
        : 'none';

    // ── Run resume through ForgeTomorrow evidence engine ─────────────────────
    const evidence = runEvidenceEngine(resolvedResumeData);

    // ── Extract form fields ───────────────────────────────────────────────────
    const jobDescription = safeString(formData.jobDescription);
    const currentJobTitle = safeString(formData.currentJobTitle);
    const currentSalary = safeNum(formData.currentSalary);
    const isNewJob = safeString(formData.isNewJob);
    const location = safeString(formData.location);
    const targetSalaryMin = safeNum(formData.targetSalaryMin);
    const targetSalaryMax = safeNum(formData.targetSalaryMax);
    const desiredBenefits = safeString(formData.desiredBenefits);
    const industry = safeString(formData.industry);
    const skillsCertsExperience = safeString(formData.skillsCertsExperience);
    const yearsRelevantExperience = safeNum(formData.yearsRelevantExperience);
    const notableProjectsEvidence = safeString(formData.notableProjectsEvidence);
    const hasOffer = safeString(formData.hasOffer);
    const offerCompany = safeString(formData.offerCompany);
    const offerRoleTitle = safeString(formData.offerRoleTitle);
    const offerBaseSalary = safeNum(formData.offerBaseSalary);
    const offerBonus = safeString(formData.offerBonus);
    const offerSignOn = safeNum(formData.offerSignOn);
    const offerEquity = safeString(formData.offerEquity);
    const offerBenefitsNotes = safeString(formData.offerBenefitsNotes);
    const offerDeadline = safeString(formData.offerDeadline);
    const offerWorkMode = safeString(formData.offerWorkMode);
    const offerOtherComp = safeString(formData.offerOtherComp);
    const competingOffers = safeString(formData.competingOffers);
    const competingOffersCount = safeNum(formData.competingOffersCount);
    const bestAlternativeNotes = safeString(formData.bestAlternativeNotes);
    const willingnessToRelocate = safeString(formData.willingnessToRelocate);
    const mustHaves = safeString(formData.mustHaves);
    const dealBreakers = safeString(formData.dealBreakers);
    const topPriority = safeString(formData.topPriority);
    const secondPriority = safeString(formData.secondPriority);
    const thirdPriority = safeString(formData.thirdPriority);
    const desiredStartDate = safeString(formData.desiredStartDate);
    const confidenceLevel = safeString(formData.confidenceLevel);

    const systemPrompt = `
You are ForgeTomorrow's Offer & Negotiation Intelligence Engine — part of a unified career intelligence platform.

UNIFIED INTELLIGENCE SYSTEM:
You receive resume evidence pre-analyzed by ForgeTomorrow's evidence engine — the same backbone powering the Forge Hammer resume alignment tool and Coaching Strategy system. When evidence analysis is present, it represents what the resume ACTUALLY proves through pattern matching and signal classification — not what the candidate claims. Ground every leverage assessment, negotiation path, and script in this evidence. Do not contradict the evidence engine findings.

CORE PHILOSOPHY:
The candidate needs a move, not a menu. Every word must serve the decision. You are a senior advisor who has seen 500 negotiations. You tell people what to do.

HARD RULES:
- NEVER fabricate salary numbers or market statistics.
- Market ranges: directional only (low/mid/high tier) with clear reasoning. Never invented figures.
- Call out misaligned expectations directly — with respect, without softening.
- The evidence engine output is authoritative. Trust it over self-reported fields when they conflict.
- Disclaimers required: guidance only — not legal, financial, or tax advice.
- Do NOT name LinkedIn, Indeed, Glassdoor, or any external platform by name in any output field. Say "your professional network" or "your professional profile" instead.

DECISION CARD — COMMAND LANGUAGE:
oneLineSummary must read like a command. "Push for $65K with remote locked in — do not accept below $58K." Never hedge.

LEVERAGE SCORE — EVIDENCE-GROUNDED:
leverageScore: integer 1-10. Must be consistent with evidence engine analysis.
leverageDrivers: exactly 3 strings — what is DRIVING the score based on actual resume proof.

MARKET REALITY — AUTHORITATIVE:
Format: "[City/Region] – [Role Type]: $X – $Y typical. $Z+ requires [specific justification]."

NEGOTIATION RISK SNAPSHOT — REQUIRED:
biggestStrength: from actual resume evidence
biggestWeakness: from actual gaps identified by evidence engine
biggestOpportunity: the one move that unlocks the most value
biggestRisk: the most likely way they lose value or the deal

SCRIPTS — EVIDENCE-GROUNDED:
Reference the candidate's actual proven signals. Never invent achievements. If the resume has no metrics, the script has no metrics.

Output MUST be valid JSON matching the schema exactly. No extra keys. No commentary outside JSON.
`.trim();

    const userPrompt = `
FORGETOMORROW EVIDENCE ENGINE ANALYSIS:
${evidence.summary
  ? `Resume analyzed through unified intelligence backbone:
${evidence.summary}
Evidence-based leverage band: ${evidence.leverageBand} (score: ${evidence.score}/21)
Resume source: ${resumeSource}${resumeMeta?.name ? ` (${resumeMeta.name})` : ''}

This analysis reflects what is ACTUALLY PROVEN in the resume. Use it to ground the leverage assessment.`
  : 'No resume connected — relying on self-reported inputs only.'}

NEGOTIATION CONTEXT:
- Negotiating for: ${isNewJob === 'yes' ? 'New Job Offer' : 'Raise / Promotion'}
- Role / JD: ${jobDescription || 'N/A'}
- Location: ${location || 'N/A'}
- Industry: ${industry || 'N/A'}
- Current title: ${currentJobTitle || 'N/A'}
- Current salary: ${currentSalary || 'N/A'}
- Target range: ${targetSalaryMin || 'N/A'} to ${targetSalaryMax || 'N/A'}

OFFER DETAILS:
- Has offer: ${hasOffer || 'N/A'}
- Company: ${offerCompany || 'N/A'}
- Offered title: ${offerRoleTitle || 'N/A'}
- Offered base: ${offerBaseSalary || 'N/A'}
- Bonus: ${offerBonus || 'N/A'}
- Sign-on: ${offerSignOn || 'N/A'}
- Equity: ${offerEquity || 'N/A'}
- Work mode: ${offerWorkMode || 'N/A'}
- Deadline: ${offerDeadline || 'N/A'}
- Benefits: ${offerBenefitsNotes || 'N/A'}
- Other comp: ${offerOtherComp || 'N/A'}

SELF-REPORTED EVIDENCE (supplement evidence engine above):
- Years experience: ${yearsRelevantExperience || 'N/A'}
- Skills / certs: ${skillsCertsExperience || 'N/A'}
- Proof of impact: ${notableProjectsEvidence || 'N/A'}

LEVERAGE CONTEXT:
- Competing offers: ${competingOffers || 'N/A'} ${competingOffersCount ? `(${competingOffersCount})` : ''}
- Best alternative: ${bestAlternativeNotes || 'N/A'}
- Willing to relocate: ${willingnessToRelocate || 'N/A'}
- Priorities: ${[topPriority, secondPriority, thirdPriority].filter(Boolean).join(', ') || 'N/A'}
- Must-haves: ${mustHaves || 'N/A'}
- Deal-breakers: ${dealBreakers || 'N/A'}
- Desired benefits: ${desiredBenefits || 'N/A'}
- Start date: ${desiredStartDate || 'N/A'}
- Confidence: ${confidenceLevel === 'low' ? 'Low — needs clear anchoring and scripted language' : confidenceLevel === 'high' ? 'High — optimize for ambitious path, hold-firm language' : 'Medium — balanced approach'}

Return JSON:
{
  "decision": {
    "recommendedMove": "Negotiate | Accept | Hold | Walk Away",
    "leverageBand": "Strong | Moderate | Developing | Weak",
    "leverageScore": 7,
    "leverageDrivers": ["driver 1", "driver 2", "driver 3"],
    "riskLevel": "Low | Low-Moderate | Moderate | High",
    "targetAsk": "",
    "fallbackFloor": "",
    "doNotTradeAway": [],
    "oneLineSummary": ""
  },
  "disclaimer": { "summary": "", "mentorNote": "" },
  "roleContext": { "interpretedRole": "", "seniorityBand": "", "workContext": "" },
  "marketReality": { "directionalRange": "", "marketTension": "", "confidenceLevel": "" },
  "assumptionCheck": { "potentialMisalignments": [], "unknowns": [] },
  "valueJustification": { "coreLeverage": [], "nonSalaryLevers": [] },
  "negotiationRiskSnapshot": {
    "biggestStrength": "", "biggestWeakness": "", "biggestOpportunity": "", "biggestRisk": ""
  },
  "negotiationPaths": [
    { "label": "Conservative", "askFraming": "", "bestWhen": "", "tradeoffs": "" },
    { "label": "Balanced", "askFraming": "", "bestWhen": "", "tradeoffs": "" },
    { "label": "Ambitious", "askFraming": "", "bestWhen": "", "tradeoffs": "" }
  ],
  "conversationScript": { "emailVersion": "", "liveConversationVersion": "" },
  "nextSteps": { "immediate": [], "prepareForPushback": [], "walkAwaySignals": [] },
  "mentorEscalation": { "whyItHelps": "", "whatToBring": "", "spotlightCTA": "" }
}
`.trim();

    let parsed = null;
    try {
      const resp = await client.chat.completions.create({
        model: process.env.OPENAI_COACH_MODEL || 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });
      parsed = safeJsonParse(extractChat(resp));
    } catch (e) {
      console.error('[offer-negotiation/generate] OpenAI error:', e?.message || e);
      return res.status(500).json({ error: 'Failed to generate negotiation plan' });
    }

    if (!parsed || typeof parsed !== 'object') {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    let negotiation = null;
    try {
      negotiation = await prisma.negotiation.create({
        data: {
          userId: session.user.id,
          input: {
            formData,
            resumeConnected: !!(evidence.summary),
            resumeSource,
            resumeMeta,
            evidenceBand: evidence.leverageBand || null,
            evidenceScore: evidence.score || 0,
          },
          result: parsed,
        },
        select: { id: true, createdAt: true },
      });
    } catch (saveErr) {
      console.error('[offer-negotiation/generate] Failed to save negotiation report:', saveErr?.message || saveErr);
    }

    return res.status(200).json({
      plan: parsed,
      negotiationId: negotiation?.id || null,
      savedAt: negotiation?.createdAt || null,
      resumeConnected: !!(evidence.summary),
      resumeSource,
      resumeMeta,
      evidenceBand: evidence.leverageBand || null,
    });
  } catch (err) {
    console.error('[offer-negotiation/generate] Unhandled error', err);
    return res.status(500).json({ error: 'Failed to generate negotiation plan' });
  }
}