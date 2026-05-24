// lib/intelligence/professionalOperatingProfileEngine.js
// ForgeTomorrow Professional Operating Profile Engine
// Purpose: convert seeker-owned reflection + profile/resume/project evidence into
// an explainable Professional Operating Profile.
// Pure functions only. No Prisma. No HTTP. No React.

import {
  detectBehavioralSignals,
  detectCapabilityMatches,
} from '@/lib/intelligence/operationalInference';

function safe(value = '') {
  return String(value || '').trim();
}

function safeLower(value = '') {
  return safe(value).toLowerCase();
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return value
        .split(/[,|]/g)
        .map((item) => safe(item))
        .filter(Boolean);
    }
  }

  return [];
}

function textOf(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(textOf).filter(Boolean).join(' ');
  if (typeof value === 'object') return Object.values(value).map(textOf).filter(Boolean).join(' ');
  return String(value || '');
}

function unique(items = [], limit = 10) {
  const out = [];
  const seen = new Set();

  for (const item of Array.isArray(items) ? items : []) {
    const clean = safe(item);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(clean);
    if (out.length >= limit) break;
  }

  return out;
}

function labelizeKey(key = '') {
  return safe(key)
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function extractEvidenceLines(items = [], limit = 5) {
  return unique(
    toArray(items)
      .map((item) => {
        if (typeof item === 'string') return item;
        if (!item || typeof item !== 'object') return '';

        const title = safe(item.title || item.name || item.projectName || item.company || item.role);
        const description = safe(
          item.description ||
            item.summary ||
            item.details ||
            item.impact ||
            toArray(item.highlights || item.bullets).join(' ')
        );

        return [title, description].filter(Boolean).join(': ');
      })
      .filter(Boolean),
    limit
  );
}

function buildEvidenceSourceText(identityContext = {}) {
  const profileText = [
    identityContext.headline,
    identityContext.aboutMe,
    textOf(identityContext.skills),
    textOf(identityContext.education),
    textOf(identityContext.languages),
    textOf(identityContext.workPreferences),
  ]
    .filter(Boolean)
    .join(' ');

  const resume = identityContext.resume || {};

  const resumeText = [
    resume.summary,
    textOf(resume.skills),
    textOf(resume.experience),
    textOf(resume.certifications),
  ]
    .filter(Boolean)
    .join(' ');

  const projectText = textOf(resume.projects || identityContext.projects);

  return {
    profileText,
    resumeText,
    projectText,
    combinedText: [profileText, resumeText, projectText].filter(Boolean).join(' '),
  };
}

function reflectionSignals(answers = {}) {
  const signals = [];

  if (answers.energy === 'systems') signals.push('Systems thinker');
  if (answers.energy === 'people') signals.push('Relationship builder');
  if (answers.energy === 'execution') signals.push('Execution driver');
  if (answers.energy === 'strategy') signals.push('Strategic navigator');

  if (answers.pressure === 'calm') signals.push('Calm under pressure');
  if (answers.pressure === 'direct') signals.push('Decisive problem solver');
  if (answers.pressure === 'collaborative') signals.push('Coordinated responder');
  if (answers.pressure === 'reflective') signals.push('Measured decision maker');

  if (answers.autonomy === 'high') signals.push('Independent operator');
  if (answers.ambiguity === 'high') signals.push('Ambiguity-capable builder');

  return unique(signals, 8);
}

function evidenceBackedSignals(capabilityMatches = [], behavioralSignals = []) {
  const capabilityLabels = capabilityMatches
    .slice(0, 6)
    .map((match) => match?.capability?.label)
    .filter(Boolean);

  const behaviorLabels = behavioralSignals
    .slice(0, 6)
    .map((signal) => signal?.label || labelizeKey(signal?.key))
    .filter(Boolean);

  return unique([...behaviorLabels, ...capabilityLabels], 10);
}

function inferOperatingStyle(answers = {}, capabilityMatches = [], behavioralSignals = []) {
  const text = [
    answers.energy,
    ...capabilityMatches.map((m) => m?.capability?.id || ''),
    ...behavioralSignals.map((b) => b?.key || ''),
  ]
    .filter(Boolean)
    .join(' ');

  const t = safeLower(text);

  if (
    answers.energy === 'systems' ||
    t.includes('operations_process_improvement') ||
    t.includes('operational_rigor') ||
    t.includes('it_service_management') ||
    t.includes('platform_architecture')
  ) {
    if (t.includes('executive_leadership') || t.includes('business_strategy')) {
      return 'Operational Systems Builder with Strategic Founder Signals';
    }
    return 'Operational Systems Builder';
  }

  if (answers.energy === 'strategy' || t.includes('strategic_thinking') || t.includes('business_strategy')) {
    return 'Strategic Direction Setter';
  }

  if (answers.energy === 'people' || t.includes('customer_communication') || t.includes('people_leadership')) {
    return 'Trust-Centered Connector';
  }

  return 'Execution-Focused Operator';
}

function buildProfessionalSummary(style, answers = {}, evidenceSignals = []) {
  const hasFounder = evidenceSignals.some((s) => /founder|executive|business strategy|product|platform/i.test(s));
  const hasOps = evidenceSignals.some((s) => /operations|process|service|project|delivery|systems/i.test(s));

  if (style.includes('Strategic Founder')) {
    return 'You appear to operate best when building systems from ambiguity, connecting strategy to execution, and turning complex professional problems into structured operating models others can use.';
  }

  if (style === 'Operational Systems Builder' && hasOps) {
    return 'You appear to operate best when you can turn complexity into structure, improve how work moves, and create repeatable systems that help teams perform more effectively.';
  }

  if (style === 'Strategic Direction Setter') {
    return 'You appear to operate best when you can assess direction, connect signals, solve complex problems, and help shape what should happen next.';
  }

  if (style === 'Trust-Centered Connector') {
    return 'You appear to operate best when your work involves trust, guidance, communication, and helping people move through decisions or challenges with clarity.';
  }

  return 'You appear to operate best when there is meaningful work to move forward, clear outcomes to deliver, and visible progress to create.';
}

function buildThrivesIn(answers = {}, evidenceSignals = []) {
  const out = [];

  out.push(
    answers.autonomy === 'high'
      ? 'High-ownership environments where trust, outcomes, and accountability matter.'
      : answers.autonomy === 'medium'
      ? 'Environments with clear goals, reasonable autonomy, and useful check-ins.'
      : 'Structured environments with clear expectations, defined success measures, and steady alignment.'
  );

  out.push(
    answers.ambiguity === 'high'
      ? 'Ambiguous or developing situations where someone needs to create order and momentum.'
      : answers.ambiguity === 'medium'
      ? 'Changing environments where priorities are clarified and communication stays consistent.'
      : 'Stable environments where expectations, handoffs, and responsibilities are well defined.'
  );

  out.push(
    answers.communication === 'direct'
      ? 'Teams that value direct, low-politics communication and practical problem solving.'
      : answers.communication === 'collaborative'
      ? 'Teams that value shared context, discussion, trust, and cross-functional buy-in.'
      : 'Teams that value thoughtful written context, documentation, and well-structured decisions.'
  );

  if (evidenceSignals.some((s) => /executive|strategy|product|project|operations|platform/i.test(s))) {
    out.push('Work where strategy, systems, people, and execution need to connect instead of operating in silos.');
  }

  return unique(out, 5);
}

function buildSupportAreas(answers = {}, evidenceSignals = []) {
  const out = [];

  out.push(
    answers.growth === 'visibility'
      ? 'May benefit from more consistent documentation and communication of wins so value is visible beyond day-to-day execution.'
      : answers.growth === 'delegation'
      ? 'May benefit from support delegating ownership instead of carrying too much alone.'
      : answers.growth === 'focus'
      ? 'May benefit from clearer prioritization boundaries when multiple urgent needs compete for attention.'
      : 'May benefit from stronger strategic framing so work is understood as business impact, not just task completion.'
  );

  if (answers.drain) {
    out.push(`Should watch for environments that repeat this drain pattern: ${answers.drain}.`);
  } else {
    out.push('Should watch for environments that reward politics more than performance or create disconnects between leadership direction and frontline reality.');
  }

  if (evidenceSignals.some((s) => /ownership|execution|leadership|operations/i.test(s))) {
    out.push('May need explicit priority agreements so high ownership does not become silent over-extension.');
  } else {
    out.push('Can use this profile as a conversation starter with coaches, mentors, managers, or hiring teams.');
  }

  return unique(out, 5);
}

function buildIntegrationGuidance(answers = {}, evidenceSignals = []) {
  const out = [
    'Give this person clarity on the outcome, the operational context, and where success will be measured.',
    answers.autonomy === 'high'
      ? 'Provide trust and decision space, then use check-ins to remove blockers instead of micromanaging execution.'
      : 'Provide clear expectations and cadence, then increase autonomy as trust and context develop.',
    answers.communication === 'written'
      ? 'Provide written context for complex decisions and allow time to process important tradeoffs.'
      : 'Use direct, timely communication and practical feedback loops to keep momentum strong.',
  ];

  if (evidenceSignals.some((s) => /process|systems|operations|project|platform/i.test(s))) {
    out.push('Invite them into process, system, and workflow conversations early; they are likely to see operational friction before it becomes visible to everyone else.');
  }

  return unique(out, 5);
}

function buildWhyEvidence(answers = {}, identityContext = {}, capabilityMatches = [], behavioralSignals = []) {
  const resume = identityContext.resume || {};
  const projects = toArray(resume.projects || identityContext.projects);

  const selfReflection = unique(
    [
      answers.recentWin ? `Professional win: ${answers.recentWin}` : '',
      answers.drain ? `Drain pattern: ${answers.drain}` : '',
      answers.goal ? `Current reflection goal: ${answers.goal}` : '',
      answers.energy ? `Energy pattern: ${answers.energy}` : '',
      answers.autonomy ? `Autonomy preference: ${answers.autonomy}` : '',
      answers.ambiguity ? `Ambiguity tolerance: ${answers.ambiguity}` : '',
    ],
    8
  );

  const resumeEvidence = unique(
    [
      resume.summary ? `Resume summary: ${safe(resume.summary).slice(0, 180)}` : '',
      ...extractEvidenceLines(resume.experience, 4),
      ...toArray(resume.skills).slice(0, 6).map((skill) => `Resume skill: ${skill}`),
    ],
    8
  );

  const portfolioEvidence = unique(
    [
      identityContext.headline ? `Headline: ${identityContext.headline}` : '',
      identityContext.aboutMe ? `About/profile: ${safe(identityContext.aboutMe).slice(0, 220)}` : '',
      ...toArray(identityContext.skills).slice(0, 6).map((skill) => `Profile skill: ${skill}`),
    ],
    8
  );

  const projectEvidence = extractEvidenceLines(projects, 6).map((item) => `Project evidence: ${item}`);

  const intelligenceEvidence = unique(
    [
      ...capabilityMatches.slice(0, 5).map((m) => {
        const label = m?.capability?.label;
        const terms = unique([...(m?.anchorHits || []), ...(m?.matchedTerms || [])], 4).join(', ');
        return label ? `${label}${terms ? ` — matched: ${terms}` : ''}` : '';
      }),
      ...behavioralSignals.slice(0, 5).map((b) => {
        const terms = unique(b?.matchedTerms || [], 4).join(', ');
        return `${b?.label || labelizeKey(b?.key)}${terms ? ` — matched: ${terms}` : ''}`;
      }),
    ],
    10
  );

  return {
    selfReflection,
    resumeEvidence,
    portfolioEvidence,
    projectEvidence,
    intelligenceEvidence,
  };
}

export function buildProfessionalOperatingProfile({ answersJson = {}, identityContext = {} } = {}) {
  const answers = answersJson || {};
  const sourceText = buildEvidenceSourceText(identityContext);

  const capabilityMatches = detectCapabilityMatches({
    profile: sourceText.profileText,
    resume: sourceText.resumeText,
    projects: sourceText.projectText,
  }, { limit: 10 });

  const behavioralSignals = detectBehavioralSignals({
    profile: sourceText.profileText,
    resume: sourceText.resumeText,
    projects: sourceText.projectText,
    reflection: textOf(answers),
  });

  const reflection = reflectionSignals(answers);
  const evidenceSignals = evidenceBackedSignals(capabilityMatches, behavioralSignals);
  const strengthSignals = unique([...reflection, ...evidenceSignals], 10);

  const operatingStyle = inferOperatingStyle(answers, capabilityMatches, behavioralSignals);
  const professionalSummary = buildProfessionalSummary(operatingStyle, answers, strengthSignals);
  const why = buildWhyEvidence(answers, identityContext, capabilityMatches, behavioralSignals);

  return {
    title: 'Professional Operating Profile',
    operatingStyle,
    professionalSummary,
    strengthSignals,
    thrivesIn: buildThrivesIn(answers, strengthSignals),
    supportAreas: buildSupportAreas(answers, strengthSignals),
    integrationGuidance: buildIntegrationGuidance(answers, strengthSignals),
    why,
    evidence: [
      ...why.selfReflection.slice(0, 3).map((item) => `Self-reflection evidence: ${item}`),
      ...why.resumeEvidence.slice(0, 2).map((item) => `Resume evidence: ${item}`),
      ...why.portfolioEvidence.slice(0, 2).map((item) => `Portfolio evidence: ${item}`),
      ...why.projectEvidence.slice(0, 2),
      ...why.intelligenceEvidence.slice(0, 3).map((item) => `WHY intelligence signal: ${item}`),
    ],
    meta: {
      generatedAt: new Date().toISOString(),
      source: 'professionalOperatingProfileEngine',
      evidenceSources: {
        selfReflection: why.selfReflection.length,
        resume: why.resumeEvidence.length,
        portfolio: why.portfolioEvidence.length,
        projects: why.projectEvidence.length,
        intelligence: why.intelligenceEvidence.length,
      },
      resumeId: identityContext.resumeId || identityContext.resume?.resumeId || null,
      resumeUpdatedAt: identityContext.resumeUpdatedAt || null,
    },
  };
}

export default buildProfessionalOperatingProfile;
