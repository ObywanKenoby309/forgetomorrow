// lib/intelligence/professionalOperatingProfileEngine.js
// ForgeTomorrow Professional Operating Profile Engine
//
// Purpose:
// - Convert user-owned self-reflection + professional evidence into an explainable
//   Professional Operating Profile.
// - Reuse ForgeTomorrow's existing intelligence layers instead of creating a second brain.
// - This is NOT a personality test, clinical tool, hiring score, or automatic decision system.
// - Output is seeker-owned and share-controlled.
//
// Intended inputs:
// - answersJson from ProfessionalOperatingProfile
// - profile details: headline, aboutMe, skills, projects, certifications, education, languages, workPreferences
// - primary resume text/content
//
// Intended consumers:
// - /api/anvil/identity/generate or /api/anvil/identity
// - Anvil Professional Operating Profile page
// - future portfolio / coach / hiring packet display when user opts in

import {
  detectCapabilityMatches,
  detectBehavioralSignals,
} from '@/lib/intelligence/operationalInference';

import {
  classifySignals,
} from '@/lib/intelligence/profileSignalShared';

const MAX = {
  strengthSignals: 8,
  evidencePerGroup: 5,
  bullets: 4,
};

function safe(value = '') {
  return String(value || '').trim();
}

function safeLower(value = '') {
  return safe(value).toLowerCase();
}

function safeArr(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);

  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return [];

    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return s
        .split(/\r?\n|,/g)
        .map((x) => safe(x))
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

  if (typeof value === 'object') {
    return Object.values(value).map(textOf).filter(Boolean).join(' ');
  }

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

function labelFromCapability(match) {
  return safe(match?.capability?.seekerLabel) || safe(match?.capability?.label) || '';
}

function normalizeEvidenceText(text = '') {
  return safe(text)
    .replace(/^Credibility vector:\s*/i, '')
    .replace(/^Skill:\s*/i, '')
    .replace(/^Project:\s*/i, '')
    .replace(/^Language:\s*/i, '')
    .replace(/^Headline present:\s*/i, 'Headline: ')
    .replace(/^Profile visibility:\s*/i, 'Profile visibility: ')
    .replace(/^Visibility setting present:\s*/i, 'Visibility setting: ')
    .replace(/^Primary resume evidence is available$/i, 'Primary resume available');
}

function sourceTextBundle({ answers = {}, profile = {}, resumeText = '', projects = [] } = {}) {
  const skills = safeArr(profile.skills || profile.skillsJson);
  const certifications = safeArr(profile.certifications || profile.certificationsJson);
  const education = safeArr(profile.education || profile.educationJson);
  const languages = safeArr(profile.languages || profile.languagesJson);

  const profileText = [
    profile.headline,
    profile.aboutMe,
    skills.join(' '),
    certifications.join(' '),
    education.join(' '),
    languages.join(' '),
  ]
    .filter(Boolean)
    .join(' ');

  const projectText = safeArr(projects.length ? projects : profile.projects || profile.projectsJson)
    .map(textOf)
    .filter(Boolean)
    .join(' ');

  const answerText = textOf(answers);

  return {
    answerText,
    profileText,
    resumeText: safe(resumeText),
    projectText,
    combinedText: [answerText, profileText, resumeText, projectText]
      .filter(Boolean)
      .join(' '),
  };
}

function buildProfileDataForSignals({ profile = {}, resumeText = '', projects = [] } = {}) {
  return {
    headline: profile.headline || '',
    aboutMe: profile.aboutMe || profile.summary || '',
    skills: safeArr(profile.skills || profile.skillsJson),
    projects: safeArr(projects.length ? projects : profile.projects || profile.projectsJson),
    certifications: safeArr(profile.certifications || profile.certificationsJson),
    education: safeArr(profile.education || profile.educationJson),
    languages: safeArr(profile.languages || profile.languagesJson),
    workPreferences: profile.workPreferences || {},
    profileVisibility: profile.profileVisibility || profile.visibility || '',
    primaryResume: resumeText ? { content: resumeText } : profile.primaryResume || null,
    resumeData: resumeText || profile.resumeData || null,
  };
}

function getTopCapabilities(combinedSource) {
  try {
    return detectCapabilityMatches(combinedSource, { limit: 12, minScore: 6 }) || [];
  } catch {
    return [];
  }
}

function getBehaviorSignals(combinedSource) {
  try {
    return detectBehavioralSignals(combinedSource) || [];
  } catch {
    return [];
  }
}

function getProfileSignals(profileData) {
  try {
    return classifySignals(profileData) || [];
  } catch {
    return [];
  }
}

function hasBehavior(behaviors = [], key) {
  return behaviors.some((item) => item?.key === key);
}

function hasCapability(capabilities = [], id) {
  return capabilities.some((item) => item?.capability?.id === id);
}

function hasAnyCapability(capabilities = [], ids = []) {
  return ids.some((id) => hasCapability(capabilities, id));
}

function inferOperatingStyle({ answers = {}, capabilities = [], behaviors = [] } = {}) {
  const energy = safeLower(answers.energy);

  if (
    energy === 'systems' ||
    hasAnyCapability(capabilities, [
      'operations_process_improvement',
      'it_service_management',
      'service_delivery',
      'business_analysis',
      'project_management',
    ]) ||
    hasBehavior(behaviors, 'operational_rigor')
  ) {
    return 'Operational Systems Builder';
  }

  if (
    energy === 'people' ||
    hasAnyCapability(capabilities, [
      'customer_service_support',
      'customer_success_account_management',
      'people_leadership',
      'training_enablement',
      'education_training',
    ]) ||
    hasBehavior(behaviors, 'customer_communication')
  ) {
    return 'Trust-Centered Connector';
  }

  if (
    energy === 'strategy' ||
    hasAnyCapability(capabilities, [
      'executive_leadership',
      'business_strategy',
      'product_management',
      'program_portfolio_management',
    ]) ||
    hasBehavior(behaviors, 'strategic_thinking')
  ) {
    return 'Strategic Direction Setter';
  }

  return 'Execution-Focused Operator';
}

function summaryForOperatingStyle(style) {
  switch (style) {
    case 'Operational Systems Builder':
      return 'You appear to operate best when you can turn complexity into structure, improve how work moves, and create systems that help others perform more effectively.';
    case 'Trust-Centered Connector':
      return 'You appear to operate best when your work involves trust, guidance, communication, and helping people move through decisions or challenges with clarity.';
    case 'Strategic Direction Setter':
      return 'You appear to operate best when you can assess direction, connect signals, solve complex problems, and help shape what should happen next.';
    default:
      return 'You appear to operate best when there is meaningful work to move forward, clear outcomes to deliver, and visible progress to create.';
  }
}

function buildStrengthSignals({ answers = {}, capabilities = [], behaviors = [] } = {}) {
  const out = [];
  const energy = safeLower(answers.energy);
  const autonomy = safeLower(answers.autonomy);
  const ambiguity = safeLower(answers.ambiguity);
  const pressure = safeLower(answers.pressure);

  if (energy === 'systems') out.push('Systems thinker');
  if (energy === 'people') out.push('Relationship builder');
  if (energy === 'execution') out.push('Execution driver');
  if (energy === 'strategy') out.push('Strategic navigator');

  if (pressure === 'calm') out.push('Calm under pressure');
  if (pressure === 'direct') out.push('Decisive problem solver');
  if (pressure === 'collaborative') out.push('Coordinated responder');
  if (pressure === 'reflective') out.push('Measured decision maker');

  if (autonomy === 'high') out.push('Independent operator');
  if (ambiguity === 'high') out.push('Ambiguity-capable builder');

  if (hasBehavior(behaviors, 'ownership')) out.push('Ownership-oriented operator');
  if (hasBehavior(behaviors, 'execution')) out.push('Execution and delivery focus');
  if (hasBehavior(behaviors, 'problem_solving')) out.push('Problem-solving orientation');
  if (hasBehavior(behaviors, 'strategic_thinking')) out.push('Strategic thinking signal');
  if (hasBehavior(behaviors, 'leadership_presence')) out.push('Leadership presence');
  if (hasBehavior(behaviors, 'analytical_reasoning')) out.push('Analytical reasoning');
  if (hasBehavior(behaviors, 'risk_discipline')) out.push('Risk-aware judgment');
  if (hasBehavior(behaviors, 'operational_rigor')) out.push('Operational rigor');

  for (const cap of capabilities.slice(0, 4)) {
    const label = labelFromCapability(cap);
    if (label) out.push(label);
  }

  return unique(out, MAX.strengthSignals);
}

function buildThrivesIn({ answers = {}, operatingStyle = '' } = {}) {
  const autonomy = safeLower(answers.autonomy);
  const ambiguity = safeLower(answers.ambiguity);
  const communication = safeLower(answers.communication);

  return unique([
    autonomy === 'high'
      ? 'High-ownership environments where trust, outcomes, and accountability matter.'
      : autonomy === 'medium'
      ? 'Environments with clear goals, reasonable autonomy, and useful check-ins.'
      : 'Structured environments with clear expectations, defined success measures, and steady alignment.',

    ambiguity === 'high'
      ? 'Ambiguous or developing situations where someone needs to create order and momentum.'
      : ambiguity === 'medium'
      ? 'Changing environments where priorities are clarified and communication stays consistent.'
      : 'Stable environments where expectations, handoffs, and responsibilities are well defined.',

    communication === 'direct'
      ? 'Teams that value direct, low-politics communication and practical problem solving.'
      : communication === 'collaborative'
      ? 'Teams that value shared context, discussion, trust, and cross-functional buy-in.'
      : 'Teams that value thoughtful written context, documentation, and well-structured decisions.',

    operatingStyle === 'Operational Systems Builder'
      ? 'Operations where improving process, visibility, consistency, or execution quality is valued.'
      : '',
    operatingStyle === 'Trust-Centered Connector'
      ? 'People-facing environments where trust, service, communication, and follow-through matter.'
      : '',
    operatingStyle === 'Strategic Direction Setter'
      ? 'Settings where complex decisions, direction-setting, and long-range positioning are needed.'
      : '',
  ], MAX.bullets);
}

function buildSupportAreas({ answers = {}, profileSignals = [] } = {}) {
  const growth = safeLower(answers.growth);

  const out = [
    growth === 'visibility'
      ? 'May benefit from more consistent documentation and communication of wins so value is visible beyond day-to-day execution.'
      : growth === 'delegation'
      ? 'May benefit from support delegating ownership instead of carrying too much alone.'
      : growth === 'focus'
      ? 'May benefit from clearer prioritization boundaries when multiple urgent needs compete for attention.'
      : 'May benefit from stronger strategic framing so work is understood as business impact, not just task completion.',
  ];

  const narrative = profileSignals.find((sig) => sig.key === 'narrative');
  const portfolio = profileSignals.find((sig) => sig.key === 'portfolio');
  const proof = profileSignals.find((sig) => sig.key === 'proof');

  if (narrative && narrative.status !== 'direct') {
    out.push('Professional narrative could be sharpened so others understand direction, value, and voice faster.');
  }

  if (portfolio && portfolio.status !== 'direct') {
    out.push('Project evidence may need clearer outcomes, ownership, metrics, or business impact.');
  }

  if (proof && proof.status !== 'direct') {
    out.push('Structured proof signals such as skills, capabilities, or credentials may need more detail.');
  }

  out.push('Should watch for environments that reward politics more than performance or create disconnects between leadership direction and frontline reality.');

  return unique(out, MAX.bullets);
}

function buildIntegrationGuidance({ answers = {}, operatingStyle = '' } = {}) {
  const autonomy = safeLower(answers.autonomy);
  const communication = safeLower(answers.communication);

  return unique([
    'Give this person clarity on the outcome, the operational context, and where success will be measured.',

    autonomy === 'high'
      ? 'Provide trust and decision space, then use check-ins to remove blockers instead of micromanaging execution.'
      : 'Provide clear expectations and cadence, then increase autonomy as trust and context develop.',

    communication === 'written'
      ? 'Provide written context for complex decisions and allow time to process important tradeoffs.'
      : 'Use direct, timely communication and practical feedback loops to keep momentum strong.',

    operatingStyle === 'Operational Systems Builder'
      ? 'Let them see the workflow, constraints, handoffs, and failure points so they can improve the operating system around the work.'
      : '',
    operatingStyle === 'Trust-Centered Connector'
      ? 'Connect them early with people, stakeholders, and context so they can build trust and reduce friction.'
      : '',
    operatingStyle === 'Strategic Direction Setter'
      ? 'Invite them into the why behind decisions so they can connect work to direction, tradeoffs, and future outcomes.'
      : '',
  ], MAX.bullets);
}

function evidenceFromCapabilities(capabilities = [], sourceLabel = 'Professional evidence') {
  return capabilities
    .slice(0, MAX.evidencePerGroup)
    .map((match) => {
      const label = labelFromCapability(match);
      const terms = unique([
        ...(match?.matchedTerms || []),
        ...(match?.anchorHits || []),
        ...(match?.supportHits || []),
      ], 4);

      if (!label) return '';

      return terms.length
        ? `${sourceLabel}: ${label} detected through ${terms.join(', ')}.`
        : `${sourceLabel}: ${label} detected.`;
    })
    .filter(Boolean);
}

function evidenceFromBehaviors(behaviors = []) {
  return behaviors
    .slice(0, MAX.evidencePerGroup)
    .map((behavior) => {
      const label = safe(behavior?.label);
      const terms = unique(behavior?.matchedTerms || [], 4);
      if (!label) return '';

      return terms.length
        ? `Behavioral signal: ${label} suggested by ${terms.join(', ')}.`
        : `Behavioral signal: ${label} detected.`;
    })
    .filter(Boolean);
}

function evidenceFromProfileSignals(profileSignals = []) {
  const out = [];

  for (const sig of profileSignals) {
    const evidence = safeArr(sig?.evidenceDetected)
      .map(normalizeEvidenceText)
      .filter(Boolean);

    if (!evidence.length) continue;

    out.push(`${sig.label}: ${evidence.slice(0, 2).join(' • ')}`);

    if (out.length >= MAX.evidencePerGroup) break;
  }

  return out;
}

function buildEvidenceGroups({ answers = {}, capabilities = [], behaviors = [], profileSignals = [] } = {}) {
  const selfReflectionEvidence = unique([
    answers.recentWin ? `Self-reported professional win: ${answers.recentWin}` : '',
    answers.drain ? `Self-reported drain pattern: ${answers.drain}` : '',
    answers.goal ? `Current reflection goal: ${answers.goal}` : '',
    answers.energy ? `Energy pattern selected: ${answers.energy}` : '',
    answers.autonomy ? `Autonomy preference selected: ${answers.autonomy}` : '',
    answers.ambiguity ? `Ambiguity comfort selected: ${answers.ambiguity}` : '',
  ], MAX.evidencePerGroup);

  return {
    selfReflectionEvidence,
    professionalEvidence: unique([
      ...evidenceFromCapabilities(capabilities, 'Capability evidence'),
      ...evidenceFromBehaviors(behaviors),
    ], MAX.evidencePerGroup),
    portfolioEvidence: unique(evidenceFromProfileSignals(profileSignals), MAX.evidencePerGroup),
  };
}

function confidenceLevel({ capabilities = [], behaviors = [], profileSignals = [], answers = {} } = {}) {
  let score = 0;

  if (safe(answers.energy)) score += 1;
  if (safe(answers.autonomy)) score += 1;
  if (safe(answers.ambiguity)) score += 1;
  if (safe(answers.pressure)) score += 1;
  if (safe(answers.communication)) score += 1;
  if (safe(answers.growth)) score += 1;

  score += Math.min(4, capabilities.length);
  score += Math.min(3, behaviors.length);
  score += Math.min(3, profileSignals.filter((sig) => sig.status === 'direct').length);

  if (score >= 12) return 'High';
  if (score >= 8) return 'Moderate-High';
  if (score >= 5) return 'Moderate';
  return 'Early';
}

export function buildProfessionalOperatingProfile(input = {}) {
  const answers = input.answersJson || input.answers || {};
  const profile = input.profile || {};
  const resumeText = safe(input.resumeText || input.primaryResumeText || input.resume?.content || '');
  const projects = safeArr(input.projects || profile.projects || profile.projectsJson);

  const bundle = sourceTextBundle({ answers, profile, resumeText, projects });
  const profileData = buildProfileDataForSignals({ profile, resumeText, projects });

  const capabilities = getTopCapabilities({
    answers,
    profile,
    resumeText,
    projects,
    text: bundle.combinedText,
  });

  const behaviors = getBehaviorSignals({
    answers,
    profile,
    resumeText,
    projects,
    text: bundle.combinedText,
  });

  const profileSignals = getProfileSignals(profileData);

  const operatingStyle = inferOperatingStyle({ answers, capabilities, behaviors });
  const professionalSummary = summaryForOperatingStyle(operatingStyle);

  const strengthSignals = buildStrengthSignals({ answers, capabilities, behaviors });
  const thrivesIn = buildThrivesIn({ answers, operatingStyle });
  const supportAreas = buildSupportAreas({ answers, profileSignals });
  const integrationGuidance = buildIntegrationGuidance({ answers, operatingStyle });
  const evidenceGroups = buildEvidenceGroups({ answers, capabilities, behaviors, profileSignals });

  const evidence = unique([
    ...evidenceGroups.selfReflectionEvidence,
    ...evidenceGroups.professionalEvidence,
    ...evidenceGroups.portfolioEvidence,
  ], 12);

  return {
    title: 'Professional Operating Profile',
    operatingStyle,
    professionalSummary,
    strengthSignals,
    thrivesIn,
    supportAreas,
    integrationGuidance,
    evidence,
    evidenceGroups,
    confidenceLevel: confidenceLevel({ capabilities, behaviors, profileSignals, answers }),
    sourceSummary: {
      selfReflection: Boolean(Object.values(answers || {}).filter(Boolean).length),
      resume: Boolean(resumeText),
      profile: Boolean(bundle.profileText),
      projects: Boolean(bundle.projectText),
    },
    detectedCapabilities: capabilities.slice(0, 10).map((match) => ({
      id: match?.capability?.id || '',
      label: match?.capability?.label || '',
      seekerLabel: match?.capability?.seekerLabel || match?.capability?.label || '',
      score: match?.score || 0,
      matchedTerms: unique(match?.matchedTerms || [], 6),
    })),
    detectedBehaviors: behaviors.slice(0, 8).map((behavior) => ({
      key: behavior?.key || '',
      label: behavior?.label || '',
      matchedTerms: unique(behavior?.matchedTerms || [], 6),
    })),
    profileSignals: profileSignals.map((sig) => ({
      key: sig.key,
      label: sig.label,
      status: sig.status,
      confidenceLevel: sig.confidenceLevel,
      evidenceSummary: sig.evidenceSummary,
      seekerCoaching: sig.seekerCoaching,
    })),
    generatedAt: new Date().toISOString(),
    disclaimer:
      'This is a voluntary professional reflection based on self-reported answers and available professional evidence. It is not a personality test, clinical tool, hiring score, or automatic decision system.',
  };
}

export default buildProfessionalOperatingProfile;
