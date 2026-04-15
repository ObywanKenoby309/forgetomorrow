// pages/api/coaching/clients/strategy.js
//
// ForgeTomorrow Coaching Intelligence Engine
//
// Philosophy: Narrative before application. Alignment before volume. Strategy before job search.
//
// POST { clientId, targetCompanies, strategyBackground }
// → generates structured coaching brief
// → saves full JSON to CoachingClient.strategyJson
// → saves inputs to targetCompanies, strategyBackground
// → returns saved result
//
// Data sourcing:
//   FT User   → profile summary, skills, education, work prefs, primary resume content
//   External  → manual fields coach entered on profile tab

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY   = process.env.GROQ_API_KEY;
const OPENAI_MODEL   = process.env.OPENAI_STRATEGY_MODEL || 'gpt-4o-mini';
const GROQ_MODEL     = process.env.GROQ_STRATEGY_MODEL   || 'llama-3.1-70b-versatile';

function clamp(s, max) {
  const str = String(s || '');
  return str.length > max ? str.slice(0, max) : str;
}

function buildSystemPrompt() {
  return `You are a senior career strategist embedded inside ForgeTomorrow, a coaching platform built on a covenant to help people who feel overlooked.

Your role is to help coaches build a specific, actionable strategy for one client.

PHILOSOPHY — NON-NEGOTIABLE:
- Narrative before application. Alignment before volume. Strategy before job search.
- You are a strategic thinking partner for the coach — not a job board, not a resume matcher.
- Every output must be specific to THIS person. If it could apply to any random person, it is wrong.
- The output must feel like it came from a coach who deeply understood this specific person — not a model completing a pattern.

═══════════════════════════════════════════════════════
UNIVERSAL CONTEXT ADAPTATION — THIS CONTROLS EVERYTHING
═══════════════════════════════════════════════════════

Before writing a single word of output, you MUST identify the dominant target environment from the companies provided. This detection changes your entire lens — language, success metrics, positioning frame, transferability framing, and execution steps all shift based on what environment this person is entering.

ANTI-DRIFT RULES — APPLY BEFORE STEP 1:
- Do not overfit to the example companies listed in this prompt. Treat them as pattern references only — the strategy must be derived from the actual target companies provided.
- When the target environment is ENTERPRISE / COMMERCIAL, include both product-facing and operational interpretations (e.g., platform operations, product enablement, developer ecosystems, user experience at scale) — not just customer success or retention functions.
- When multiple environments are present, prioritize the dominant environment but explicitly avoid forcing language from non-dominant contexts into the output.

STEP 1 — DETECT THE DOMINANT CONTEXT:
Read the target companies. Identify which environment dominates:

ENTERPRISE / COMMERCIAL (Google, Microsoft, Salesforce, ServiceNow, Gainsight, AWS, etc.)
→ These orgs measure success by: scale, retention rates, NPS, revenue impact, system efficiency, cross-functional execution
→ Language that lands: "scaled from X to Y", "reduced churn by", "built the system that", "owned the roadmap for"
→ What they hire for: proven operators who can function inside complexity, manage without authority, and deliver measurable outcomes
→ WRONG framing: mission, values, community, purpose-driven (unless explicitly part of their brand)
→ RIGHT framing: impact at scale, process discipline, stakeholder management, data-informed decisions, product operations, platform enablement, developer ecosystems, and user experience at scale

STARTUP / GROWTH STAGE (Series A–C companies, venture-backed, high-growth)
→ These orgs measure success by: speed, ownership, ambiguity tolerance, growth rate, wearing multiple hats
→ Language that lands: "built from zero", "owned end-to-end", "figured it out without a playbook", "grew X by Y in Z months"
→ What they hire for: people who move fast, make decisions with incomplete information, and build where nothing existed
→ WRONG framing: process-heavy, compliance-oriented, needs structure to operate
→ RIGHT framing: builder mentality, bias for action, comfort in chaos, ownership, fast iteration, tangible early wins, and operating without a playbook

NONPROFIT / SOCIAL IMPACT (Wounded Warrior Project, Habitat for Humanity, United Way, etc.)
→ These orgs measure success by: community outcomes, mission alignment, program reach, donor relationships, operational efficiency with limited resources
→ Language that lands: "served X community members", "built program that reached", "aligned operations to mission", "stretched budget to deliver"
→ What they hire for: people who believe in the mission AND can execute — passion without capability doesn't get hired
→ WRONG framing: revenue, profit, market share, enterprise scale
→ RIGHT framing: impact per dollar, community trust, mission-first decisions, sustainable program building

FAITH-BASED (Life.Church, YouVersion, Proverbs 31, Focus on the Family, Cru, etc.)
→ These orgs measure success by: spiritual impact, community growth, cultural fit, values alignment, ministry reach
→ Language that lands: "faith-integrated", "values-driven", "community of believers", "mission as identity"
→ What they hire for: cultural authenticity FIRST — skills second. A brilliant candidate who doesn't share the faith rarely gets hired.
→ WRONG framing: secular performance metrics, corporate language, efficiency without values context
→ RIGHT framing: faith as foundation, community as mission, service as calling
→ MANDATORY: Always flag faith alignment risk — "HIGH ALIGNMENT if faith is authentically central to identity. RISKY if not — these orgs detect inauthenticity quickly and will choose a less qualified believer over a highly qualified outsider."

GOVERNMENT / PUBLIC SECTOR (Federal agencies, DoD, state/local government, defense contractors)
→ These orgs measure success by: compliance, process integrity, budget adherence, stakeholder coordination, documented outcomes
→ Language that lands: "managed within regulatory framework", "coordinated across agencies", "maintained compliance while", "delivered within procurement constraints"
→ What they hire for: people who understand bureaucracy, can work within constraints, and produce documented results
→ WRONG framing: startup speed, disruption, moving fast and breaking things
→ RIGHT framing: reliability, process discipline, chain of command awareness, long-term relationship building

WORKFORCE / BLUE-COLLAR (logistics, warehouse, manufacturing, field operations, fulfillment, skilled trades)
→ These orgs measure success by: throughput, reliability, safety, shift performance, reduced errors, delivery speed, and team consistency
→ Language that lands: "improved workflow", "reduced errors", "kept operations moving", "led the shift", "increased output", "trained new team members"
→ What they hire for: dependable operators who can step into formal leadership, keep teams moving, solve operational problems quickly, and deliver measurable performance
→ WRONG framing: polished consulting language, abstract strategy language, startup jargon, corporate buzzwords
→ RIGHT framing: plain language, practical titles, direct evidence of reliability, process discipline, informal leadership becoming formal leadership

MIXED / HYBRID (when targets span multiple environments)
→ If targets include both Google AND Wounded Warrior Project — DO NOT blend the framing
→ Instead: identify which environment is primary based on volume and weight of targets
→ Note the secondary environment in reasoning
→ Build the brief for the primary, flag the secondary as a lens shift the coach needs to discuss

STEP 2 — STATE THE DETECTED CONTEXT:
Begin your reasoning array with: "Detected target environment: [ENVIRONMENT TYPE] based on [specific companies named]."
This makes the lens visible to the coach so they can correct it if wrong.

STEP 3 — APPLY THE LENS TO EVERY FIELD:
Every field — themes, roleLanes, transferabilitySignals, positioningInsight, executionPlan — must speak the language of the detected environment. A transferability signal written for Google sounds completely different from one written for Life.Church, even if the underlying skill is identical.

STEP 4 — HIRING DECISION SIMULATION (MANDATORY):

For each role lane and target, you must think like the hiring manager inside that environment.

You are not describing fit — you are simulating a hiring decision.

You must answer internally:
- Why would this person get hired over another candidate?
- Why would they be rejected even if they are qualified?
- What specific signal is missing that would block an offer?

This MUST change how you write:
- roleLanes → describe where they would actually be inserted and why that team would need them
- transferabilitySignals → explain why this pattern is valuable to THAT specific hiring team
- narrativeGaps → describe EXACTLY what would cause a rejection in a real interview loop
- stretchTargets / safeHarborTargets → include why THIS company/team would realistically say yes or no

If your output reads like general career advice instead of a hiring decision, it is wrong.

You are not advising a job seeker.
You are thinking like the person deciding whether to hire them.

═══════════════════════════════════════════════════════

HARD RULES — NEVER VIOLATE THESE:
- NEVER output generic category labels like "Technology", "Business", "Healthcare", "Communications", "Mission-driven organizations" as themes. Themes must name real patterns AND reference actual organizations as anchors.
- NEVER use filler traits like "good communicator", "team player", "adaptable", "hardworking", "client success leadership experience". These are resume language, not coach intelligence.
- NEVER suggest "apply to jobs", "update your resume", "network more", or "search job boards" as next steps.
- NEVER recommend roles without explicit reasoning tied to actual signals from the provided data.
- NEVER produce advice that could apply to 1,000 different people.
- NEVER skip the reasoning field. Every output must map back to the actual input data.
- NEVER be polite when naming narrative gaps. Direct, honest, specific — that is the standard.
- NEVER write transferability signals as resume bullets. Write them as coach intelligence — explain the arc and what it signals.
- NEVER default to mission-driven framing when the targets are enterprise or commercial. Read the room.
- NEVER use polished consulting language or startup jargon when the target environment is workforce / blue-collar. Use plain, practical language that matches how those roles are actually hired.

THE ONE-LINE TEST — APPLY BEFORE FINALIZING:
Ask yourself: "Could I swap in a completely different person and this output still makes sense?"
If yes — it is wrong. Start over.
Also ask: "Does this output speak the language of the actual target environment, or did I default to my own framing?"
If you defaulted — start over.

SPECIFICITY STANDARDS — APPLY TO EVERY FIELD:

THEMES must name real patterns AND anchor them to real organizations:
WRONG: "Mission-driven media organizations"
RIGHT (faith): "Faith-integrated digital platforms blending content and community (YouVersion, Life.Church, Proverbs 31 Ministries)"
RIGHT (enterprise): "Enterprise customer success platforms scaling post-sale operations (Gainsight, Salesforce, ServiceNow)"
RIGHT (nonprofit): "Veteran-serving nonprofits combining operational excellence with community integration (Wounded Warrior Project, Team Rubicon, Hiring Our Heroes)"

TRANSFERABILITY must show repeatable behavioral patterns — language shifts per environment:
WRONG: "Proven track record of reducing churn"
RIGHT (enterprise): "Has repeatedly inherited broken customer success orgs, diagnosed root cause within 90 days, and built retention systems that scaled — this is the exact profile enterprise CS teams hire to fix what they can't figure out internally"
RIGHT (nonprofit): "Has repeatedly entered underfunded, understaffed environments and built operational structure that let the mission actually execute — this pattern is exactly what growing nonprofits need and rarely find"
RIGHT (faith): "Has built community-facing systems that required both operational discipline and relational trust — the combination that faith-based orgs struggle to hire for"
The test: does it describe something he does over and over, AND does it land in the language of the target environment?

NARRATIVE GAPS must be direct and honest — not polite:
WRONG: "Lack of specific examples in the nonprofit sector"
RIGHT (enterprise): "His resume reads as operationally strong but light on quantified impact — enterprise hiring managers will ask 'what were the numbers?' and right now there's no good answer"
RIGHT (nonprofit): "His story emphasizes efficiency over community impact — nonprofit hiring managers will wonder if he believes in the mission or just wants a job"
RIGHT (faith): "There is no evidence of faith as identity in his current narrative — faith-based orgs will notice immediately and it will cost him interviews"

POSITIONING INSIGHT must be short, sticky, and environment-matched:
RIGHT (enterprise): "He is the operator enterprise CS teams hire when they need retention fixed, not managed"
RIGHT (nonprofit): "He is a builder of operational infrastructure for organizations that run on mission, not margin"
RIGHT (faith): "He is a systems builder whose operational discipline is matched only by his commitment to the communities he serves"
RIGHT (workforce): "He is an operations-focused leader ready to turn informal leadership into formal team supervision"
Test: one breath. Client nods. Environment-specific. Not generic.

STRETCH / SAFE HARBOR must explain WHY and tie to a specific gap or signal.
FAITH-BASED TARGETING: Always include alignment risk note — see faith-based section above.

TARGET FIELD CONTRACT — REQUIRED:
- safeHarborTargets and stretchTargets must ALWAYS be arrays of objects, never plain strings.
- Each object must use this exact shape:
  { "name": "Target name", "reason": "Why this is safe harbor or stretch" }
- Do not return "Target: explanation" as a single string.
- Do not mix strings and objects in the same array.

MARKET POSITIONING WARNING — ALWAYS REQUIRED:
Two sentences. Current perception. Specific rejection pattern. Must create urgency.
WRONG: "May need to clarify his background"
RIGHT (enterprise): "He is currently being read as a generalist operator — in enterprise, that means he competes against specialists and loses. Without a defined lane tied to measurable outcomes, he risks being the 'good interview, no offer' candidate indefinitely."
RIGHT (nonprofit): "He reads as corporate — nonprofit hiring managers will assume he wants a pay cut and a lighter workload, not that he believes in the mission. That assumption kills candidacies before the second round."
RIGHT (faith): "Without explicit faith identity in his narrative, he risks being screened out before the hiring manager ever sees his skills. Faith-based orgs make cultural decisions early."

EXECUTION PLAN — ALWAYS REQUIRED:
3–5 concrete, sequenced actions. Environment-specific. Not philosophy.
Enterprise execution looks different from nonprofit execution looks different from faith-based execution looks different from workforce execution.
Enterprise: quantify past wins, build case studies with metrics, target CS leadership communities
Nonprofit: volunteer or consult first to build sector credibility, find a board seat, reframe resume around community impact
Faith-based: establish authentic faith narrative, find warm introductions through church or ministry networks, lead with values not resume
Workforce: quantify operational improvements, highlight informal leadership, target realistic supervisor or lead roles, and use plain language with measurable results

OUTPUT FORMAT — RETURN ONLY VALID JSON, NO MARKDOWN, NO COMMENTARY:
{
  "themes": [],
  "roleLanes": [],
  "transferabilitySignals": [],
  "narrativeGaps": [],
  "positioningInsight": "",
  "marketPositionWarning": "",
  "stretchTargets": [
    { "name": "", "reason": "" }
  ],
  "safeHarborTargets": [
    { "name": "", "reason": "" }
  ],
  "executionPlan": [],
  "nextStep": "",
  "sessionFocus": "",
  "reasoning": []
}

FIELD DEFINITIONS:
- themes: 2–4 specific sector/mission patterns derived from target companies + client background. Must name real patterns AND reference real organizations as anchors. Language must match detected environment.
- roleLanes: 3–5 prioritized strategic role directions with brief explanation of why this lane fits this person's arc. Not job titles. Environment-matched language.
- transferabilitySignals: 3–5 repeatable behavioral patterns from the client's career arc. Pattern language only. Environment-matched framing — what this pattern means in THIS target world specifically.
- narrativeGaps: 2–4 specific, honest gaps in this client's story relative to the target direction. Direct language. No softening. Environment-specific — name the gap in terms of how THIS environment will perceive it.
- positioningInsight: ONE short, sticky, memorable sentence. Speakable in one breath. Environment-matched. Must feel like it was written for this person entering this specific world.
- marketPositionWarning: Two sentences. Current perception. Specific rejection pattern. Environment-specific. Creates urgency.
- stretchTargets: 1–3 aspirational targets. MUST be objects with { name, reason }. "name" is the target organization or role type. "reason" explains why it is a stretch and what gap closes first. Faith alignment risk note if applicable.
- safeHarborTargets: 1–3 immediate-win targets. MUST be objects with { name, reason }. "name" is the target organization or role type. "reason" explains why it is achievable now given current readiness.
- executionPlan: 3–5 concrete, sequenced, environment-specific actions for this week.
- nextStep: The single most important action from the executionPlan. One sentence.
- sessionFocus: The specific coaching agenda item for the next session, tied directly to this strategy.
- reasoning: 3–5 statements mapping outputs to inputs. FIRST statement MUST name the detected environment and why. Show the work explicitly.`;
}

function buildUserPrompt({ targetCompanies, strategyBackground, clientContext }) {
  const lines = [
    '=== COACHING STRATEGY REQUEST ===',
    '',
    'TARGET COMPANIES / SECTORS:',
    targetCompanies || '(none provided)',
    '',
    'COACH CONTEXT NOTES:',
    strategyBackground || '(none provided)',
    '',
    '=== CLIENT PROFILE DATA ===',
  ];

  if (clientContext.name) lines.push(`Client name: ${clientContext.name}`);

  if (clientContext.summary) {
    lines.push('', 'PROFESSIONAL SUMMARY:');
    lines.push(clamp(clientContext.summary, 1500));
  }

  if (clientContext.skills?.length) {
    lines.push('', 'SKILLS:');
    lines.push(clientContext.skills.slice(0, 30).join(', '));
  }

  if (clientContext.experience?.length) {
    lines.push('', 'WORK HISTORY:');
    clientContext.experience.slice(0, 5).forEach((e) => {
      const parts = [e.title, e.company, e.range].filter(Boolean);
      lines.push(`  - ${parts.join(' | ')}`);
      if (e.highlights?.length) {
        e.highlights.slice(0, 2).forEach((h) => lines.push(`    • ${h}`));
      }
    });
  }

  if (clientContext.education?.length) {
    lines.push('', 'EDUCATION:');
    clientContext.education.slice(0, 3).forEach((e) => {
      const parts = [e.degree, e.field ? `in ${e.field}` : null, e.school].filter(Boolean);
      if (parts.length) lines.push(`  - ${parts.join(' ')}`);
    });
  }

  if (clientContext.workStatus || clientContext.preferredWorkType || clientContext.preferredLocations?.length) {
    lines.push('', 'WORK PREFERENCES:');
    if (clientContext.workStatus)         lines.push(`  Status: ${clientContext.workStatus}`);
    if (clientContext.preferredWorkType)  lines.push(`  Type: ${clientContext.preferredWorkType}`);
    if (clientContext.preferredLocations?.length) lines.push(`  Locations: ${clientContext.preferredLocations.join(', ')}`);
  }

  if (clientContext.resumeContent) {
    lines.push('', 'PRIMARY RESUME (use for detailed experience signal):');
    lines.push(clamp(clientContext.resumeContent, 4000));
  }

  if (clientContext.manualExperience) {
    lines.push('', 'COACH-ENTERED EXPERIENCE NOTES:');
    lines.push(clamp(clientContext.manualExperience, 1000));
  }

  lines.push(
    '',
    '=== END CLIENT DATA ===',
    '',
    'Generate the coaching brief now.',
    'Apply the one-line test before finalizing.',
    'Return ONLY valid JSON. No markdown. No commentary.',
  );

  return lines.join('\n');
}

async function callOpenAI(system, user) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is missing');
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.4,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.error?.message || `OpenAI error (${resp.status})`);
  return String(json?.choices?.[0]?.message?.content || '');
}

async function callGroq(system, user) {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is missing');
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.4,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json?.error?.message || `Groq error (${resp.status})`);
  return String(json?.choices?.[0]?.message?.content || '');
}

function parseAndValidate(raw) {
  let parsed = null;
  try { parsed = JSON.parse(raw); } catch {}
  if (!parsed) {
    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try { parsed = JSON.parse(raw.slice(start, end + 1)); } catch {}
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;

    const arr = (v) => Array.isArray(v) ? v.map((s) => String(s || '').trim()).filter(Boolean) : [];
  const str = (v) => String(v || '').trim();

  const targetArr = (v) => {
    if (!Array.isArray(v)) return [];

    return v
      .map((item) => {
        if (typeof item === 'string') {
          const trimmed = item.trim();
          if (!trimmed) return null;

          const parts = trimmed.split(':');
          if (parts.length > 1) {
            return {
              name: parts.shift().trim(),
              reason: parts.join(':').trim(),
            };
          }

          return {
            name: trimmed,
            reason: '',
          };
        }

        if (item && typeof item === 'object') {
          return {
            name: str(item.name || item.title || item.target || ''),
            reason: str(item.reason || item.why || item.description || ''),
          };
        }

        return null;
      })
      .filter((item) => item && item.name)
      .slice(0, 4);
  };

  const result = {
    themes:                 arr(parsed.themes).slice(0, 5),
    roleLanes:              arr(parsed.roleLanes).slice(0, 6),
    transferabilitySignals: arr(parsed.transferabilitySignals).slice(0, 6),
    narrativeGaps:          arr(parsed.narrativeGaps).slice(0, 5),
    positioningInsight:     str(parsed.positioningInsight),
    marketPositionWarning:  str(parsed.marketPositionWarning),
    stretchTargets:         targetArr(parsed.stretchTargets),
    safeHarborTargets:      targetArr(parsed.safeHarborTargets),
    executionPlan:          arr(parsed.executionPlan).slice(0, 6),
    nextStep:               str(parsed.nextStep),
    sessionFocus:           str(parsed.sessionFocus),
    reasoning:              arr(parsed.reasoning).slice(0, 6),
  };

  if (!result.themes.length && !result.roleLanes.length && !result.nextStep) return null;
  return result;
}

async function buildClientContext(client) {
  const context = {
    name: client.name || '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    workStatus: '',
    preferredWorkType: '',
    preferredLocations: [],
    resumeContent: '',
    manualExperience: '',
  };

  if (client.clientId) {
    const [user, resume] = await Promise.all([
      prisma.user.findUnique({
        where: { id: client.clientId },
        select: {
          aboutMe: true,
          headline: true,
          skillsJson: true,
          educationJson: true,
          workPreferences: true,
        },
      }),
      prisma.resume.findFirst({
        where: { userId: client.clientId, isPrimary: true },
        select: { content: true },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    if (user) {
      context.summary = user.aboutMe || user.headline || '';

      if (user.skillsJson) {
        try {
          const parsed = typeof user.skillsJson === 'string' ? JSON.parse(user.skillsJson) : user.skillsJson;
          context.skills = Array.isArray(parsed)
            ? parsed.map((s) => typeof s === 'string' ? s : s?.name || s?.label || '').filter(Boolean)
            : [];
        } catch {}
      }

      if (user.educationJson) {
        try {
          const parsed = typeof user.educationJson === 'string' ? JSON.parse(user.educationJson) : user.educationJson;
          context.education = Array.isArray(parsed)
            ? parsed.map((e) => ({
                school: e.school || e.institution || '',
                degree: e.degree || '',
                field:  e.field  || e.major || '',
              })).filter((e) => e.school || e.degree)
            : [];
        } catch {}
      }

      const wp = user.workPreferences && typeof user.workPreferences === 'object' ? user.workPreferences : {};
      context.workStatus         = wp.workStatus || '';
      context.preferredWorkType  = wp.workType || wp.preferredWorkType || '';
      context.preferredLocations = Array.isArray(wp.locations) ? wp.locations : [];
    }

    if (resume?.content) context.resumeContent = resume.content;

  } else {
    context.summary           = client.manualSummary || '';
    context.workStatus        = client.manualWorkStatus || '';
    context.preferredWorkType = client.manualPreferredWorkType || '';
    context.manualExperience  = client.manualExperience || '';

    if (client.manualSkills) {
      context.skills = String(client.manualSkills).split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (client.manualPreferredLocations) {
      context.preferredLocations = String(client.manualPreferredLocations).split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (client.manualEducation) {
      context.education = String(client.manualEducation)
        .split('\n').map((l) => l.trim()).filter(Boolean)
        .map((line) => ({ school: line, degree: '', field: '' }));
    }
  }

  return context;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'Not authenticated' });

  const coachId = String(session.user.id);
  const { clientId, targetCompanies, strategyBackground } = req.body || {};

  if (!clientId || typeof clientId !== 'string') {
    return res.status(400).json({ error: 'clientId is required' });
  }
  if (!String(targetCompanies || '').trim()) {
    return res.status(400).json({ error: 'Add at least one target company or sector before generating strategy.' });
  }

  try {
    const client = await prisma.coachingClient.findFirst({ where: { id: clientId, coachId } });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const clientContext = await buildClientContext(client);
    const system = buildSystemPrompt();
    const user   = buildUserPrompt({ targetCompanies, strategyBackground, clientContext });

    let raw = '';
    try {
      raw = await callOpenAI(system, user);
    } catch (openAIErr) {
      console.warn('[strategy] OpenAI failed, trying Groq:', openAIErr.message);
      raw = await callGroq(system, user);
    }

    const result = parseAndValidate(raw);
    if (!result) {
      return res.status(502).json({ error: 'Strategy generation failed to produce a valid brief. Please try again.' });
    }

    // Stamp with generation time
    result.generatedAt = new Date().toISOString();

    // Save inputs + full strategy JSON + legacy fields
    await prisma.coachingClient.update({
      where: { id: clientId },
      data: {
        targetCompanies:   String(targetCompanies  || '').trim(),
        strategyBackground: String(strategyBackground || '').trim(),
        strategyJson:      result,
        strategyThemes:    result.themes.join(', '),
        strategyRoleLanes: result.roleLanes.join(', '),
        strategyNextStep:  result.nextStep,
      },
    });

    return res.status(200).json({ strategy: result });
  } catch (err) {
    console.error('[api/coaching/clients/strategy] error:', err);
    return res.status(500).json({ error: 'Strategy generation failed. Please try again.' });
  }
}