// lib/forge/strategyBrain.js
//
// ForgeTomorrow Strategy Brain
//
// Shared intelligence layer for Forge Hammer, Coach, AI Scan, Keywords,
// and future coaching / seeker / recruiter intelligence.
//
// Philosophy:
// Narrative before application.
// Alignment before volume.
// Strategy before job search.

import { evaluateSignals } from './evidenceEngine';
import { classifyRisk, rankRisks } from './riskEngine';
import { detectNarrativeConflicts } from './narrativeEngine';
import { compareAgainstMarket } from './marketEngine';

export const FORGE_ENVIRONMENTS = {
  ENTERPRISE: 'enterprise_commercial',
  STARTUP: 'startup_growth',
  NONPROFIT: 'nonprofit_social_impact',
  FAITH: 'faith_based',
  GOVERNMENT: 'government_public_sector',
  WORKFORCE: 'workforce_blue_collar',
  MIXED: 'mixed_hybrid',
  GENERAL: 'general',
};

const ENVIRONMENT_PATTERNS = [
  {
    key: FORGE_ENVIRONMENTS.ENTERPRISE,
    label: 'Enterprise / Commercial',
    terms: [
      'google',
      'microsoft',
      'salesforce',
      'servicenow',
      'gainsight',
      'aws',
      'amazon web services',
      'oracle',
      'sap',
      'workday',
      'adobe',
      'hubspot',
      'zendesk',
      'atlassian',
      'snowflake',
      'datadog',
      'okta',
      'stripe',
      'enterprise',
      'saas',
      'platform',
      'customer success',
      'product operations',
    ],
    successMetrics:
      'scale, retention, revenue impact, measurable outcomes, system efficiency, stakeholder management, product enablement, platform operations',
    language:
      'scaled, reduced churn, improved retention, built the system, operationalized, measured impact, improved platform efficiency',
    hiringLens:
      'They hire proven operators who can work inside complexity, manage without authority, and produce measurable outcomes.',
    avoid:
      'Avoid vague mission language, generic passion statements, and unsupported claims without proof or numbers.',
  },
  {
    key: FORGE_ENVIRONMENTS.STARTUP,
    label: 'Startup / Growth Stage',
    terms: [
      'startup',
      'series a',
      'series b',
      'series c',
      'seed',
      'venture',
      'yc',
      'y combinator',
      'growth stage',
      'founder',
      'linear',
      'notion',
      'figma',
      'loom',
      'airtable',
      'rippling',
      'brex',
      'mercury',
    ],
    successMetrics:
      'speed, ownership, ambiguity tolerance, fast iteration, early wins, building without a playbook',
    language:
      'built from zero, owned end-to-end, figured it out, moved fast, launched, created the process, solved messy problems',
    hiringLens:
      'They hire builders who can make decisions with incomplete information and create structure where none exists.',
    avoid:
      'Avoid process-heavy language that makes the candidate sound dependent on structure.',
  },
  {
    key: FORGE_ENVIRONMENTS.NONPROFIT,
    label: 'Nonprofit / Social Impact',
    terms: [
      'nonprofit',
      'foundation',
      'united way',
      'habitat',
      'habitat for humanity',
      'wounded warrior',
      'team rubicon',
      'hiring our heroes',
      'red cross',
      'salvation army',
      'ymca',
      'mission',
      'community impact',
      'social impact',
    ],
    successMetrics:
      'community outcomes, mission alignment, program reach, donor trust, operational efficiency with limited resources',
    language:
      'served, reached, supported, aligned operations to mission, stretched resources, built community trust',
    hiringLens:
      'They hire people who believe in the mission and can actually execute with limited resources.',
    avoid:
      'Avoid making the candidate sound purely corporate, efficiency-only, or disconnected from impact.',
  },
  {
    key: FORGE_ENVIRONMENTS.FAITH,
    label: 'Faith-Based',
    terms: [
      'church',
      'ministry',
      'youversion',
      'life.church',
      'proverbs 31',
      'focus on the family',
      'cru',
      'faith',
      'christian',
      'missionary',
    ],
    successMetrics:
      'spiritual impact, community growth, cultural fit, values alignment, ministry reach, authentic service',
    language:
      'faith-integrated, values-driven, service, calling, community, ministry, mission as identity',
    hiringLens:
      'They hire for authentic cultural and faith alignment first, then skill.',
    avoid:
      'Avoid forcing faith language if the user has not provided authentic evidence.',
  },
  {
    key: FORGE_ENVIRONMENTS.GOVERNMENT,
    label: 'Government / Public Sector',
    terms: [
      'federal',
      'state government',
      'local government',
      'county',
      'city',
      'government',
      'public sector',
      'dod',
      'department of defense',
      'veterans affairs',
      'va',
      'usajobs',
      'municipal',
      'agency',
      'defense contractor',
    ],
    successMetrics:
      'compliance, process integrity, budget adherence, documentation, stakeholder coordination, reliability',
    language:
      'managed within regulatory framework, documented outcomes, coordinated across agencies, maintained compliance',
    hiringLens:
      'They hire people who can operate within constraints, respect process, and produce documented results.',
    avoid:
      'Avoid startup disruption language or move-fast-and-break-things phrasing.',
  },
  {
    key: FORGE_ENVIRONMENTS.WORKFORCE,
    label: 'Workforce / Blue-Collar Operations',
    terms: [
      'warehouse',
      'manufacturing',
      'logistics',
      'fulfillment',
      'field operations',
      'plant',
      'shift',
      'safety',
      'throughput',
      'skilled trades',
      'supervisor',
      'team lead',
    ],
    successMetrics:
      'throughput, safety, reliability, shift performance, reduced errors, delivery speed, team consistency',
    language:
      'improved workflow, reduced errors, kept operations moving, led the shift, increased output, trained new team members',
    hiringLens:
      'They hire dependable operators who can keep teams moving and turn informal leadership into formal leadership.',
    avoid:
      'Avoid polished consulting language, abstract strategy, and startup jargon.',
  },
];

function safeString(value, max = 6000) {
  const str = String(value || '').trim();
  return str.length > max ? `${str.slice(0, max)}\n\n[truncated]` : str;
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function scoreEnvironment(text, pattern) {
  const source = normalizeText(text);
  return pattern.terms.reduce((count, term) => {
    return source.includes(term.toLowerCase()) ? count + 1 : count;
  }, 0);
}

function uniqueStrings(values = []) {
  return Array.from(
    new Set(
      values
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );
}

function jdHas(text = '', terms = []) {
  const source = normalizeText(text);
  return terms.some((term) => source.includes(String(term || '').toLowerCase()));
}

function removeEmployerNoise(text = '') {
  return String(text || '')
    .replace(/crowdstrike/gi, '')
    .replace(/peraton/gi, '')
    .replace(/mercor/gi, '')
    .replace(/alight/gi, '')
    .replace(/air apps/gi, '')
    .replace(/moro tech/gi, '')
    .replace(/verra mobility/gi, '');
}

function deriveHammerSignals({ jdText = '', missing = {}, jobMeta = null } = {}) {
  const signals = [];
  const title = String(jobMeta?.title || '');
  const combined = removeEmployerNoise(`${title}\n${jdText}`);

  // ── UNIVERSAL ROLE STRUCTURE DETECTION ───────────────────────────────────
  // Every job — warehouse associate to NASA chief — requires some combination
  // of these seven universal role structures. We detect which ones this JD
  // actually demands, then the evidence engine maps them against the resume.
  // No domain assumptions. No industry hardcoding.

  // 1. OWNERSHIP — does the JD require the candidate to own something end-to-end?
  if (jdHas(combined, [
    'own', 'ownership', 'responsible for', 'accountable for', 'oversee', 'overseeing',
    'manage', 'managing', 'in charge of', 'lead the', 'leading the', 'head of',
    'primary contact', 'point of contact', 'drives', 'drive the',
  ])) signals.push('ownership and accountability');

  // 2. DELIVERY — does the JD require the candidate to execute, ship, or complete work?
  if (jdHas(combined, [
    'deliver', 'delivery', 'execute', 'execution', 'implement', 'implementation',
    'launch', 'ship', 'complete', 'completion', 'production', 'produce',
    'operate', 'operations', 'run the', 'maintain', 'maintenance',
    'perform', 'performance', 'throughput', 'output', 'results',
  ])) signals.push('delivery and execution');

  // 3. PEOPLE LEADERSHIP — does the JD require managing, coaching, or building a team?
  if (jdHas(combined, [
    'manage a team', 'managing a team', 'team of', 'direct reports', 'people manager',
    'team lead', 'team leader', 'supervise', 'supervisor', 'coach', 'coaching',
    'mentor', 'mentoring', 'staffing', 'hiring', 'performance management',
    'develop the team', 'build the team', 'grow the team', 'headcount',
    'workforce', 'crew', 'staff management',
  ])) signals.push('people leadership and team management');

  // 4. ADVISORY / CLIENT-FACING — does the JD require advising, guiding, or serving clients/customers?
  if (jdHas(combined, [
    'advise', 'advisory', 'consult', 'consulting', 'consultant', 'trusted advisor',
    'client', 'customer', 'patient', 'end user', 'user', 'service',
    'client-facing', 'customer-facing', 'patient-facing', 'serving',
    'support', 'help', 'assist', 'guide', 'guidance',
    'engagement', 'relationship', 'account',
  ])) signals.push('advisory and client service delivery');

  // 5. STAKEHOLDER AND EXECUTIVE ENGAGEMENT — does the JD require communicating up or across?
  if (jdHas(combined, [
    'stakeholder', 'executive', 'senior leadership', 'senior management', 'c-suite',
    'board', 'cross-functional', 'cross functional', 'collaborate', 'coordination',
    'align', 'alignment', 'escalation', 'escalate', 'communicate', 'communication',
    'present', 'presentation', 'brief', 'briefing', 'report to', 'reporting to',
    'interface with', 'partner with', 'work with leadership',
  ])) signals.push('stakeholder and executive engagement');

  // 6. METHODOLOGY / PROCESS BUILDING — does the JD require building or maintaining systems, processes, or standards?
  if (jdHas(combined, [
    'methodology', 'methodologies', 'process', 'processes', 'procedure', 'procedures',
    'standard', 'standards', 'framework', 'playbook', 'template', 'templates',
    'repeatable', 'scalable', 'protocol', 'policy', 'compliance',
    'quality', 'qa', 'quality assurance', 'audit', 'review process',
    'workflow', 'system', 'build out', 'develop the process', 'establish',
  ])) signals.push('process and methodology development');

  // 7. DOMAIN KNOWLEDGE / CREDENTIALS — does the JD require specific expertise or qualifications?
  // We detect the NEED for domain knowledge, not a specific domain.
  // The AI layer reads the JD and identifies what domain knowledge is actually required.
  if (jdHas(combined, [
    'experience in', 'background in', 'knowledge of', 'expertise in', 'familiar with',
    'understanding of', 'proficiency in', 'skilled in', 'trained in',
    'certified', 'certification', 'licensed', 'degree', 'education',
    'years of experience', 'years experience', 'proven track record',
    'subject matter expert', 'sme', 'specialist', 'expert',
  ])) signals.push('domain knowledge and qualification');

  // Always evaluate education as a credibility signal.
  // Even when the JD does not require a degree, relevant education,
  // certifications, or training can strengthen recruiter confidence.
  // The AI layer determines whether it materially helps for this role.
  signals.push('education and credential credibility');

  return uniqueStrings(signals).slice(0, 8);
}

// deriveHammerSignalWeights
// Returns { signal, termCount, weight, required } for every signal this JD demands.
// Weights are derived from term frequency in THIS JD -- fully defensible:
// "Delivery got 22% because the JD contained 8 delivery-related terms."
// Uses the same term lists as deriveHammerSignals so detection is consistent.
// Required signals share 92% of weight proportional to term counts.
// Education is always included at a fixed 8% credibility floor.
export function deriveHammerSignalWeights({ jdText = '', jobMeta = null } = {}) {
  const title = String(jobMeta?.title || '');
  const combined = removeEmployerNoise(`${title}\n${jdText}`);
  const source = normalizeText(combined);

  // Each entry mirrors the detection terms in deriveHammerSignals exactly.
  // termCount = number of distinct terms from the list that appear in the JD.
  const SIGNAL_TERM_LISTS = [
    { signal: 'ownership and accountability', terms: [
      'own', 'ownership', 'responsible for', 'accountable for', 'oversee', 'overseeing',
      'manage', 'managing', 'in charge of', 'lead the', 'leading the', 'head of',
      'primary contact', 'point of contact', 'drives', 'drive the',
    ]},
    { signal: 'delivery and execution', terms: [
      'deliver', 'delivery', 'execute', 'execution', 'implement', 'implementation',
      'launch', 'ship', 'complete', 'completion', 'production', 'produce',
      'operate', 'operations', 'run the', 'maintain', 'maintenance',
      'perform', 'performance', 'throughput', 'output', 'results',
    ]},
    { signal: 'people leadership and team management', terms: [
      'manage a team', 'managing a team', 'team of', 'direct reports', 'people manager',
      'team lead', 'team leader', 'supervise', 'supervisor', 'coach', 'coaching',
      'mentor', 'mentoring', 'staffing', 'hiring', 'performance management',
      'develop the team', 'build the team', 'grow the team', 'headcount',
      'workforce', 'crew', 'staff management',
    ]},
    { signal: 'advisory and client service delivery', terms: [
      'advise', 'advisory', 'consult', 'consulting', 'consultant', 'trusted advisor',
      'client', 'customer', 'patient', 'end user', 'user', 'service',
      'client-facing', 'customer-facing', 'patient-facing', 'serving',
      'support', 'help', 'assist', 'guide', 'guidance',
      'engagement', 'relationship', 'account',
    ]},
    { signal: 'stakeholder and executive engagement', terms: [
      'stakeholder', 'executive', 'senior leadership', 'senior management', 'c-suite',
      'board', 'cross-functional', 'cross functional', 'collaborate', 'coordination',
      'align', 'alignment', 'escalation', 'escalate', 'communicate', 'communication',
      'present', 'presentation', 'brief', 'briefing', 'report to', 'reporting to',
      'interface with', 'partner with', 'work with leadership',
    ]},
    { signal: 'process and methodology development', terms: [
      'methodology', 'methodologies', 'process', 'processes', 'procedure', 'procedures',
      'standard', 'standards', 'framework', 'playbook', 'template', 'templates',
      'repeatable', 'scalable', 'protocol', 'policy', 'compliance',
      'quality', 'qa', 'quality assurance', 'audit', 'review process',
      'workflow', 'system', 'build out', 'develop the process', 'establish',
    ]},
    { signal: 'domain knowledge and qualification', terms: [
      'experience in', 'background in', 'knowledge of', 'expertise in', 'familiar with',
      'understanding of', 'proficiency in', 'skilled in', 'trained in',
      'certified', 'certification', 'licensed', 'degree', 'education',
      'years of experience', 'years experience', 'proven track record',
      'subject matter expert', 'sme', 'specialist', 'expert',
    ]},
  ];

  // Count distinct term hits per signal
  const scored = SIGNAL_TERM_LISTS.map(({ signal, terms }) => ({
    signal,
    termCount: terms.filter((t) => source.includes(t.toLowerCase())).length,
  })).filter(({ termCount }) => termCount > 0);

  if (!scored.length) {
    // JD had no detectable signal terms -- return flat weights as fallback
    return SIGNAL_TERM_LISTS.map(({ signal }) => ({ signal, termCount: 0, weight: Math.round(92 / SIGNAL_TERM_LISTS.length), required: true }))
      .concat([{ signal: 'education and credential credibility', termCount: 0, weight: 8, required: false }]);
  }

  const totalTerms = scored.reduce((sum, s) => sum + s.termCount, 0);
  const REQUIRED_POOL = 92;
  const EDUCATION_WEIGHT = 8;

  const weighted = scored.map(({ signal, termCount }) => ({
    signal,
    termCount,
    weight: Math.round((termCount / totalTerms) * REQUIRED_POOL),
    required: true,
  }));

  // Always include education as a credibility signal at fixed floor weight
  const eduTermCount = ['degree', 'bachelor', 'master', 'mba', 'phd', 'certified',
    'certification', 'licensed', 'credential'].filter((t) => source.includes(t)).length;
  weighted.push({ signal: 'education and credential credibility', termCount: eduTermCount, weight: EDUCATION_WEIGHT, required: false });

  // Normalize: ensure weights sum to exactly 100
  const rawSum = weighted.reduce((sum, s) => sum + s.weight, 0);
  const diff = 100 - rawSum;
  if (diff !== 0) {
    // Apply rounding correction to the highest-weight required signal
    const top = weighted.filter((s) => s.required).sort((a, b) => b.weight - a.weight)[0];
    if (top) top.weight += diff;
  }

  return weighted;
}


function buildDeterministicHammerAnalysis({ jdText = '', resume = {}, missing = {}, jobMeta = null } = {}) {
  const targetRole =
    jobMeta?.title ||
    resume?.personalInfo?.targetedRole ||
    resume?.targetedRole ||
    resume?.jobTitle ||
    '';

  const requiredSignals = deriveHammerSignals({ jdText, missing, jobMeta });

  const evidenceSignals = evaluateSignals(requiredSignals, resume);

  const risks = rankRisks(
    evidenceSignals.map((signal) => ({
      signal: signal.signal,
      status: signal.status,
      confidence: signal.confidence,
      evidence: signal.evidence,
      ...classifyRisk({
        signal: signal.signal,
        status: signal.status,
        required: true,
      }),
    }))
  );

  const narrativeConflicts = detectNarrativeConflicts(resume);
  const marketInsights = compareAgainstMarket({
    targetRole,
    signals: evidenceSignals,
  });

  const fatalRisks = risks.filter((risk) => risk.level === 'fatal');
  const moderateRisks = risks.filter((risk) => risk.level === 'moderate');
  const survivableRisks = risks.filter((risk) => risk.level === 'survivable');

  const topRisk = risks[0] || null;

  return {
    targetRole,
    requiredSignals,
    evidenceSignals,
    risks,
    fatalRisks,
    moderateRisks,
    survivableRisks,
    narrativeConflicts,
    marketInsights,
    topRisk,
  };
}

function formatDeterministicAnalysis(analysis) {
  if (!analysis) return '';

  const riskLines = analysis.risks?.length
    ? analysis.risks
        .slice(0, 6)
        .map((risk) => {
          const readableStatus =
  risk.status === 'adjacent_technical'
    ? 'strong adjacent technical evidence'
    : risk.status;

return `- ${risk.signal}: evidence=${readableStatus}, confidence=${risk.confidence}, risk=${risk.level}. ${risk.reason}`;
        })
        .join('\n')
    : '- No deterministic risks detected.';

  const conflictLines = analysis.narrativeConflicts?.length
    ? analysis.narrativeConflicts
        .slice(0, 4)
        .map((conflict) => `- ${conflict.severity}: ${conflict.issue}`)
        .join('\n')
    : '- No narrative conflicts detected.';

  const marketLines = analysis.marketInsights?.length
    ? analysis.marketInsights
        .slice(0, 4)
        .map((insight) => `- ${insight.severity}: ${insight.insight}`)
        .join('\n')
    : '- No market competitiveness concerns detected.';

  return `
DETERMINISTIC HAMMER ANALYSIS:
This analysis is generated before the AI response. Treat it as the evidence/risk backbone.
Do not contradict it unless the resume snapshot clearly proves otherwise.

Target role inferred:
${analysis.targetRole || '[not specified]'}

Required / relevant signals detected:
${analysis.requiredSignals?.length ? analysis.requiredSignals.map((signal) => `- ${signal}`).join('\n') : '- No required signals detected.'}

Evidence and risk classification:
${riskLines}

Narrative consistency checks:
${conflictLines}

Market competitiveness notes:
${marketLines}

Priority rule:
- If a signal shows evidence=strong adjacent technical evidence OR evidence=direct: DO NOT say the resume "lacks direct evidence" for that signal. It has sufficient proof. Acknowledge the strength and focus on positioning, not gaps.
- If a signal shows evidence=adjacent: call it survivable and explain what clearer positioning would help.
- If a signal shows evidence=missing: this is a real gap. Explain the risk clearly.
- If any fatal risk exists:
  - Use "likely screen-out" ONLY if the JD explicitly requires the signal as a hard credential or years of experience.
  - Use "major screening risk" for roles where adjacent technical proof may still be accepted.
  - Never use "fatal screening risk" as a label in output — it is banned.
- If no fatal risk exists, lead with the highest moderate risk.
- If only survivable risks exist, say the risk is survivable and explain what proof would reduce it.
- CRITICAL: Do not contradict the deterministic evidence classification. If the evidence engine says strong adjacent technical, the output must reflect that strength, not ignore it.

Capability-equivalency rule:
- Job titles are labels. Capabilities are evidence.
- Do not penalize a candidate because their job title does not literally match the JD title.
- A candidate titled "Account Team Lead", "Client Services Lead", "Service Delivery Manager", "Operations Lead", or any adjacent title who demonstrates the responsibilities listed in the JD is a DIRECT match for those responsibilities — not an adjacent one.
- Evaluate whether the resume demonstrates the actual work: managing accounts, driving retention, owning SLAs, leading teams, handling escalations, managing client portfolios, building operational frameworks, reporting to leadership. If those things are present, the signal is proven regardless of what the role was called.
- Do not require the candidate to have held the exact job title in the JD. Require only that they have done the work.
- Title equivalency examples: Customer Success Operations ↔ Client Services Leadership ↔ Service Delivery Leadership ↔ Account Operations Leadership are capability-equivalent. Program Management ↔ Delivery Leadership ↔ Implementation Leadership are capability-equivalent. Operations Leadership ↔ Site Leadership ↔ Account Leadership are capability-equivalent.
- Score based on demonstrated responsibilities, outcomes, ownership, and scope — not title language.
`.trim();
}

export function detectTargetEnvironment(input = {}) {
  const combined = [
    input.jobDescription,
    input.jdText,
    input.targetCompanies,
    input.company,
    input.companyName,
    input.roleTitle,
    input.jobTitle,
    input.notes,
    input.strategyBackground,
  ]
    .filter(Boolean)
    .join('\n');

  const scored = ENVIRONMENT_PATTERNS.map((pattern) => ({
    ...pattern,
    score: scoreEnvironment(combined, pattern),
  })).sort((a, b) => b.score - a.score);

  const winner = scored[0];

  if (!winner || winner.score === 0) {
    return {
      key: FORGE_ENVIRONMENTS.GENERAL,
      label: 'General Career Alignment',
      confidence: 'low',
      secondary: [],
      successMetrics: 'role alignment, evidence strength, clarity, measurable impact',
      language: 'clear, specific, evidence-based, outcome-focused',
      hiringLens:
        'Use the job description as the primary source of truth and avoid assuming a specific market context.',
      avoid: 'Avoid generic resume advice.',
      reasoning: 'No strong target-environment signal detected.',
    };
  }

  const secondary = scored.filter((item) => item.score > 0 && item.key !== winner.key);
  const isMixed =
    secondary.length > 0 &&
    secondary[0].score >= Math.max(1, Math.floor(winner.score * 0.75));

  if (isMixed) {
    return {
      key: FORGE_ENVIRONMENTS.MIXED,
      label: 'Mixed / Hybrid',
      confidence: 'medium',
      primary: {
        key: winner.key,
        label: winner.label,
        score: winner.score,
      },
      secondary: secondary.slice(0, 2).map((item) => ({
        key: item.key,
        label: item.label,
        score: item.score,
      })),
      successMetrics: winner.successMetrics,
      language: winner.language,
      hiringLens:
        'Multiple environments are present. Use the primary environment as the main lens and avoid blending incompatible language from secondary contexts.',
      avoid: 'Avoid averaging multiple target environments into one bland message.',
      reasoning: `Detected mixed environment. Primary signal: ${winner.label}. Secondary signal: ${secondary[0].label}.`,
    };
  }

  return {
    key: winner.key,
    label: winner.label,
    confidence: winner.score >= 2 ? 'high' : 'medium',
    secondary: secondary.slice(0, 2).map((item) => ({
      key: item.key,
      label: item.label,
      score: item.score,
    })),
    successMetrics: winner.successMetrics,
    language: winner.language,
    hiringLens: winner.hiringLens,
    avoid: winner.avoid,
    reasoning: `Detected target environment: ${winner.label}.`,
  };
}

export function normalizeResumeForBrain(resume = {}) {
  const experiences = resume.workExperiences || resume.experiences || resume.experience || [];
  const education = resume.educationList || resume.education || [];
  const certifications = resume.certifications || resume.certificationList || resume.certificationsList || [];
  const languages = resume.languages || [];
  const projects = resume.projects || [];
  const achievements = resume.achievements || resume.awards || [];
  const volunteerExperiences = resume.volunteerExperiences || resume.volunteerExperience || resume.volunteer || [];

  return {
    targetedRole:
      resume?.personalInfo?.targetedRole ||
      resume?.targetedRole ||
      resume?.jobTitle ||
      '',
    summary: String(resume.summary || resume.professionalSummary || ''),
    skills: Array.isArray(resume.skills) ? resume.skills.filter(Boolean) : [],
    experiences: Array.isArray(experiences) ? experiences : [],
    education: Array.isArray(education) ? education : [],
    certifications: Array.isArray(certifications) ? certifications : [],
    languages: Array.isArray(languages) ? languages : [],
    projects: Array.isArray(projects) ? projects : [],
    achievements: Array.isArray(achievements) ? achievements : [],
    volunteerExperiences: Array.isArray(volunteerExperiences) ? volunteerExperiences : [],
  };
}

export function buildResumeSnapshot(resume = {}, limits = {}) {
  const normalized = normalizeResumeForBrain(resume);
  const maxExperience = limits.maxExperience || 5;
  const maxBullets = limits.maxBullets || 4;
  const maxSkills = limits.maxSkills || 35;

  const experienceText = normalized.experiences
    .slice(0, maxExperience)
    .map((exp, index) => {
      const title = exp.title || exp.jobTitle || exp.role || 'Role';
      const company = exp.company || 'Unknown company';
      const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];
      const bulletText = bullets
        .filter(Boolean)
        .slice(0, maxBullets)
        .map((b) => `    • ${String(b).trim()}`)
        .join('\n');

      return `${index + 1}. ${title} at ${company}${bulletText ? `\n${bulletText}` : ''}`;
    })
    .join('\n');

  const educationText = normalized.education
    .slice(0, 4)
    .map((ed, index) => {
      const school = ed.school || ed.institution || '';
      const degree = ed.degree || '';
      const field = ed.field || ed.program || '';
      return `${index + 1}. ${[degree, field, school].filter(Boolean).join(' | ')}`;
    })
    .join('\n');

  const certificationText = normalized.certifications
    .slice(0, 8)
    .map((cert, index) => {
      if (typeof cert === 'string') return `${index + 1}. ${cert}`;
      const name = cert.name || cert.title || cert.certification || cert.label || '';
      const issuer = cert.issuer || cert.organization || cert.provider || '';
      const date = cert.dateEarned || cert.date || cert.year || '';
      return `${index + 1}. ${[name, issuer, date].filter(Boolean).join(' | ')}`;
    })
    .filter(Boolean)
    .join('\n');

  const languageText = normalized.languages
    .slice(0, 8)
    .map((language, index) => {
      if (typeof language === 'string') return `${index + 1}. ${language}`;
      return `${index + 1}. ${[language.name, language.proficiency].filter(Boolean).join(' — ')}`;
    })
    .filter(Boolean)
    .join('\n');

  const projectText = normalized.projects
    .slice(0, 4)
    .map((project, index) => {
      const title = project.title || project.name || 'Project';
      const role = project.role || '';
      const description = project.description || '';
      return `${index + 1}. ${[title, role, description].filter(Boolean).join(' | ')}`;
    })
    .join('\n');

  const achievementText = normalized.achievements
    .slice(0, 6)
    .map((item, index) => {
      if (typeof item === 'string') return `${index + 1}. ${item}`;
      return `${index + 1}. ${[item.title || item.name, item.description].filter(Boolean).join(' | ')}`;
    })
    .filter(Boolean)
    .join('\n');

  const volunteerText = normalized.volunteerExperiences
    .slice(0, 4)
    .map((item, index) => {
      const title = item.title || item.role || 'Volunteer Experience';
      const org = item.organization || item.company || '';
      const bullets = Array.isArray(item.bullets) ? item.bullets.join(' ') : item.description || '';
      return `${index + 1}. ${[title, org, bullets].filter(Boolean).join(' | ')}`;
    })
    .join('\n');

  return {
    normalized,
    text: [
      `Targeted Role: ${normalized.targetedRole || '[Not specified]'}`,
      '',
      'Summary:',
      normalized.summary || '[No summary provided]',
      '',
      'Skills:',
      normalized.skills.length
        ? normalized.skills.slice(0, maxSkills).join(', ')
        : '[No skills provided]',
      '',
      'Experience:',
      experienceText || '[No experience provided]',
      '',
      'Projects:',
      projectText || '[No projects provided]',
      '',
      'Education:',
      educationText || '[No education provided]',
      '',
      'Certifications / Training:',
      certificationText || '[No certifications provided]',
      '',
      'Languages:',
      languageText || '[No languages provided]',
      '',
      'Achievements / Awards:',
      achievementText || '[No achievements provided]',
      '',
      'Volunteer Experience:',
      volunteerText || '[No volunteer experience provided]',
    ].join('\n'),
  };
}

export function buildHammerContext({ jdText = '', resumeData = {}, jobMeta = null } = {}) {
  const targetCompanies = [jobMeta?.title].filter(Boolean).join(' ');

  const environment = detectTargetEnvironment({
    jobDescription: jdText,
    jdText,
    targetCompanies,
    roleTitle: jobMeta?.title,
    company: jobMeta?.company,
  });

  return {
    environment,
    jdText: safeString(jdText, 6000),
    resumeData: resumeData || {},
    jobMeta: jobMeta || null,
  };
}

export function buildSectionCoachPrompt({
  jdText = '',
  resume = {},
  resumeData = null,
  context = { section: 'overview', keyword: null },
  missing = {},
  jobMeta = null,
  whyContext = {},
} = {}) {
  const effectiveResume = resumeData || resume || {};
  const hammerContext = buildHammerContext({ jdText, resumeData: effectiveResume, jobMeta });
  const snapshot = buildResumeSnapshot(effectiveResume, {
    maxExperience: 3,
    maxBullets: 2,
    maxSkills: 24,
  });
  const deterministicAnalysis = buildDeterministicHammerAnalysis({
    jdText,
    resume: effectiveResume,
    missing,
    jobMeta,
  });
  const deterministicBlock = formatDeterministicAnalysis(deterministicAnalysis);

const whyBlock = whyContext
  ? `
WHY ENGINE ALIGNMENT CONTEXT:
This is ForgeTomorrow's shared capability intelligence layer.
Use it as the source of truth for alignment score, matched capabilities, and missing capabilities.
Do NOT create a separate alignment score.
Do NOT contradict this context.

WHY Score:
${typeof whyContext.score === 'number' ? `${whyContext.score}%` : 'Not available'}

WHY Grade:
${whyContext.grade || 'Not available'}

Matched role-specific capabilities:
${Array.isArray(whyContext.signals?.matched) && whyContext.signals.matched.length
  ? whyContext.signals.matched.slice(0, 8).map((s) => `- ${s.seekerLabel || s.label}`).join('\n')
  : '- No direct matched capabilities detected.'}

Missing role-specific capabilities:
${Array.isArray(whyContext.signals?.not_yet_demonstrated) && whyContext.signals.not_yet_demonstrated.length
  ? whyContext.signals.not_yet_demonstrated.slice(0, 8).map((s) => `- ${s.label}`).join('\n')
  : '- No major missing capabilities detected.'}

WHY Summary:
${whyContext.summary || 'No WHY summary available.'}

HAMMER ROLE:
Hammer does not determine fit independently.
Hammer coaches the seeker on improving resume evidence against the WHY capability findings.
`.trim()
  : '';

  const section = context?.section || 'overview';
  const isOverview = section === 'overview';
  const keyword = context?.keyword || '';

  return `
ROLE:
Senior HR recruiter. Review this resume against this job. Be blunt, evidence-based, and non-motivational.

HIRING ENVIRONMENT:
${hammerContext.environment.label}
Lens: ${hammerContext.environment.hiringLens}
Success metrics: ${hammerContext.environment.successMetrics}
Avoid: ${hammerContext.environment.avoid}

SELECTED SECTION:
${section}

${keyword ? `FOCUS KEYWORD: ${keyword}\n` : ''}

JOB DESCRIPTION:
${safeString(removeEmployerNoise(jdText), 3000) || '[No JD supplied]'}

RESUME SNAPSHOT:
${snapshot.text}

${whyBlock ? `${whyBlock}\n\n` : ''}${deterministicBlock}

KEYWORD COVERAGE NOTES:
These are keyword coverage hints only. They are NOT automatically recruiter risks, requirements, or screen-out factors.
Do not treat employer names, company names, proprietary product names, or missing keyword terms as required experience unless the JD explicitly states they are mandatory.

High-impact keyword gaps: ${(missing.high || []).map((x) => removeEmployerNoise(x)).filter(Boolean).join(', ') || '[none]'}
Tool keyword gaps: ${(missing.tools || []).map((x) => removeEmployerNoise(x)).filter(Boolean).join(', ') || '[none]'}
Education keyword gaps: ${(missing.edu || []).map((x) => removeEmployerNoise(x)).filter(Boolean).join(', ') || '[none]'}
Soft-skill keyword gaps: ${(missing.soft || []).map((x) => removeEmployerNoise(x)).filter(Boolean).join(', ') || '[none]'}

CORE RULES:
- Return ONLY valid JSON.
- Do not invent experience, tools, metrics, projects, credentials, outcomes, clients, prior employers, or prior roles.
- Do not mention LinkedIn.
- Treat DETERMINISTIC HAMMER ANALYSIS as the evidence and risk backbone. It takes priority over all other rules below.
- CAPABILITY-EQUIVALENCY: Job titles are labels. Evaluate capabilities, not title language. A candidate who demonstrates the actual responsibilities, ownership, outcomes, and scope required by the JD is a DIRECT match — regardless of what their role was called. Customer Success ↔ Client Services ↔ Service Delivery ↔ Account Operations are capability-equivalent titles. Program Management ↔ Delivery Leadership ↔ Implementation Leadership are capability-equivalent. Do not penalize a candidate for title language when their bullets prove the work.
- Adjacent evidence is NOT the same as direct proof. However: if the DETERMINISTIC HAMMER ANALYSIS classifies a signal as strong adjacent technical evidence, treat it as credible and competitive — do not reframe it as a gap.
- If direct proof is missing for a signal AND the deterministic analysis confirms this, use ifTrue / ifNotTrue.
- Strong adjacent technical evidence must be acknowledged as credibility, not dismissed as generic leadership.
- Keyword coverage notes are supporting context only.
- Recruiter risks must come from the JD requirements and resume evidence, not from keyword gaps alone.
- Never turn an employer name into a requiredSignal.
- Do not default to platform/API/cloud/AI implementation proof unless the JD explicitly requires it.
- If the JD is advisory, consulting, governance, stakeholder, delivery, or leadership-oriented, evaluate those proof categories directly.
- If the resume explicitly states leadership, coordination, stakeholder management, advisory delivery, consulting delivery, governance ownership, escalation management, executive communication, or cross-functional coordination, treat those as DIRECT evidence for those categories.
- Do not label explicitly stated consulting leadership or stakeholder coordination as adjacent evidence.
- Do not reuse AI or platform architecture fallback language in ifNotTrue unless those subjects actually exist in the resume snapshot.
- Each improvement action must isolate ONE recruiter evaluation signal only. Never combine two separate signals into one requiredSignal.

ifTrue RULES:
- ifTrue must generate recruiter guidance, not policy text.
- ifTrue must describe observable proof structure, not restate the requirement.
- ifTrue must anchor to the strongest visible proof vehicle already present in the resume whenever possible.
- ifTrue must describe what was built, implemented, evaluated, reviewed, coordinated, operationalized, or owned.
- ifTrue must name the systems, workflows, APIs, platforms, standards, technical environments, evaluation processes, or delivery responsibilities involved.
- ifTrue must NOT request fake consulting history, fictional clients, invented prior jobs, generic experience, or unproven tools.

Good ifTrue:
"Evidence would need to show the candidate personally owned the type of work required by this JD, such as advisory delivery, stakeholder coordination, implementation oversight, technical evaluation, operational delivery, team leadership, tooling, governance, or standards ownership."

Good ifTrue:
"Evidence would need to show what the candidate personally owned, who they supported, what deliverables or decisions they influenced, and how that maps to the role's actual responsibilities."

Good ifTrue:
"Evidence would need to show the specific work category required by the JD. Do not default to platform, API, cloud, or AI implementation unless the JD explicitly requires those things."

ifNotTrue RULES:
- ifNotTrue must explicitly tell the candidate not to claim the missing signal.
- ifNotTrue must preserve the strongest truthful adjacent evidence already visible in the resume.
- ifNotTrue must reference the most technically relevant visible proof vehicle whenever possible.
- Do not write vague fallback language such as "Strengthen specific visible adjacent proof."

Good ifNotTrue:
"Do not claim direct consulting experience. Strengthen the strongest truthful adjacent evidence already visible in the resume snapshot — name it specifically from what the resume actually proves."

Good ifNotTrue:
"Do not claim hands-on delivery unless true. Name the closest proven adjacent evidence already visible in the snapshot — be specific to the actual resume, not a generic fallback."

SKILLS RULES:
- Skills may name tools only if the JD explicitly names them or the resume already proves them.
- If the JD references a tool category without naming tools, refer to the category only.
- Never inject popular example tools unless explicitly present in the JD or resume.
- Skills ifTrue must explain where tool/platform proof should appear in the resume, not copy policy text.

SECTION ROUTING:
- Summary = first-impression positioning.
- Skills = tools, technologies, platforms, APIs, hard skills.
- Experience = work-history proof: projects, ownership, delivery, stakeholders, outcomes.
- Education = degrees, certifications, licenses, and relevant technical training.
- Education analysis serves BOTH requirement validation and recruiter credibility assessment.
- Relevant education, certifications, or technical training should be acknowledged when they materially strengthen recruiter confidence for the role, even if the JD does not explicitly require them.
- Never use "overview" as an improvementActions section.
- Never combine unrelated sections into one action.

${isOverview ? `OVERVIEW REQUIREMENTS:
Return at least 3 or 4 improvementActions:
- exactly one section "summary"
- exactly one section "skills"
- exactly one section "experience"
- include "education" if:
  - the JD explicitly requires or prefers a degree, certification, or license
  - OR the resume contains education, certifications, or technical training materially relevant to the role
  - If the candidate has relevant education, certifications, or technical training aligned to the role, acknowledge it as a credibility-strengthening signal even if the JD does not explicitly require education.
- Do not output "No education requirement was detected" if relevant education materially strengthens recruiter confidence for the role.
- ALWAYS return an education action if the resume contains any degree, certification, training, or credential. Read the resume snapshot education section and acknowledge what is there. Even if the JD does not require it, visible education affects recruiter perception.
- include "certifications" if:
  - the JD explicitly names or prefers a certification (e.g. ITIL, PMP, Salesforce, AWS, etc.) AND the resume contains that certification or a direct equivalent
  - When both match, generate a certifications action that names the certification, confirms it is present, and states the credibility impact. Do NOT return empty feedback when a direct cert match exists.
  - If the JD prefers a certification the resume does NOT have, still generate a certifications action explaining the gap and its severity.
Do not repeat a section.
matchAssessment must synthesize:
- strongest visible credibility signal
- largest missing direct-proof gap
- overall recruiter interpretation
It must read like one coherent hiring evaluation, not disconnected critiques.
It must NOT end with weak hedging like "making it difficult to assess their fit."
The closing sentence must follow this structure:
"The resume demonstrates [strongest visible technical proof], but lacks direct evidence of [specific missing proof required by the JD]."
That is the elite-tier recruiter phrasing. Use it.

EDUCATION MITIGATION RULE:
When the JD prefers (not requires) a degree and the resume lacks one, evaluate whether the gap is mitigated by:
- Substantial years of experience (10+ years in the relevant domain)
- Portfolio scale (e.g. $10M+ account value, large team leadership, measurable outcomes)
- Professional certifications directly relevant to the role
If two or more of these mitigating factors are present, classify the education gap as: "Minor preference gap mitigated by demonstrated experience" — NOT simply "survivable gap" or "missing degree".
The hiringImpact for education must reflect the full picture: name the preference gap AND name the mitigating evidence. A recruiter reading this should understand why the absence of a degree does not materially reduce this candidate's competitiveness for this role.` : `SINGLE SECTION REQUIREMENTS:
Return only improvementActions with section "${section}".
Do not comment on other sections.`}

STYLE RULES:
- Write like private recruiter notes.
- requiredSignal must sound like a hiring evaluation category a human recruiter would say.
- requiredSignal must isolate ONE screening signal. Do not combine unrelated domains.
- Never combine multiple screening signals into one requiredSignal.
- If the resume literally states ownership or leadership of a responsibility, treat it as direct evidence.
- NEVER append the hiring environment label to a signal. "Ownership and accountability in a hybrid environment" is WRONG. "Ownership and accountability" is correct. The environment is context, not a job requirement.
- requiredSignal must describe a hiring evaluation category, not a compound phrase mixing signal and environment.
- requiredSignal MUST name the actual hiring signal inferred from the JD.
- Do not repeat instructional placeholder text.
- Bad: "Natural recruiter screening category"
- Good: "Cloud platform implementation ownership"
- Good: "Cross-functional stakeholder coordination"
- Good: "Technical consulting delivery leadership"
- Good: "AI workflow evaluation exposure"
- Avoid robotic compound phrases.
- hiringImpact must classify severity using one: likely screen-out, major screening risk, moderate screening risk, survivable gap, low-risk gap, likely ignored.
- Future positioning must explain recruiter interpretation behavior, not motivational advice.
- Do not repeat the same phrasing, proof vehicle, or recruiter interpretation across sections.
- Summary should focus on first-impression positioning risk.
- Skills should focus on tooling or technical verification risk.
- Experience should focus on delivery ownership or implementation proof risk.
- Do not escalate moderate gaps into existential hiring failures unless the JD explicitly makes the signal mandatory.
- Vendor familiarity gaps are usually survivable unless tied to explicit platform requirements.
- The skills section must evaluate signals actually required by THIS JD. Do not default to cloud platform, API, or technical implementation signals unless the JD explicitly requires them.
- For advisory, consulting, leadership, or people-management roles, skills signals should focus on methodology, governance, delivery frameworks, or domain expertise — not technical tooling unless stated.

Good requiredSignal:
- "Technical consulting workflow evaluation exposure"
- "Hands-on cloud platform implementation exposure"
- "AI output evaluation workflow exposure"
- "Technical implementation ownership"
- "Client-facing technical systems delivery ownership"
- "Cross-functional technical coordination"

BANNED PHRASES:
- a recruiter may question
- could add
- could include
- for example
- e.g.
- highlight transferable skills
- tailor your resume
- improve clarity
- potential for growth
- frame the answer around
- showcase
- strong candidate
- great fit
- lean into
- fatal risk
- Strengthen specific visible adjacent proof
- Tools only if JD/resume proves them
- Experience must prove where used
- Do not claim unproven tools
- Do not treat lack of vendor-specific experience as a likely screen-out unless the JD explicitly states it is mandatory.
- Do not penalize candidates for lacking experience with a specific company platform unless required in the JD.
- Do not frame lack of experience with the employer's proprietary platform, tooling, products, or company ecosystem as a major screening risk unless explicitly required in the JD.
- Prefer category-level capability evaluation over vendor-name matching.

PREFERRED PHRASES:
- This alone could cause a screen-out.
- This is survivable if reframed correctly.
- This creates moderate screening risk.
- The resume reads as adjacent, not directly proven.
- A recruiter will assume this experience is indirect unless clarified.
- Without explicit tooling evidence, recruiters will interpret this as indirect exposure.
- The experience currently reads implementation-adjacent rather than direct delivery leadership.

VISIBLE PROOF VEHICLE PRIORITY:
Use the strongest visible proof vehicle already present in THIS resume snapshot.
Do not import proof vehicles from other resumes or generic lists.
Do not reference platform architecture, explainable AI, or API-driven systems unless those phrases actually appear in the resume snapshot.
The proof vehicle must come from what the resume actually says — not from assumptions about what technical candidates typically have.

Read the resume snapshot. Name what it actually proves. Use that as the proof vehicle.

For consulting and advisory resumes: the proof vehicles are managing teams, building methodologies, handling escalations, executive communication, delivering engagements, and governance strategy — because those are what the resume actually shows.

For technical resumes: the proof vehicles are architecture, implementation, systems, APIs, platforms — because those are what those resumes show.

Never cross-contaminate. Never reference proof vehicles that are not in the resume.

JSON SHAPE:
${isOverview ? `{
  "opening": "One concise recruiter-style sentence. Not a bio.",
  "environment": "${hammerContext.environment.label}",
  "matchAssessment": "Synthesize strongest visible credibility, largest missing direct proof, and overall recruiter interpretation.",
  "signalGaps": ["Most important direct-proof gap."],
  "improvementActions": [
  {"section": "summary", "requiredSignal": "Specific recruiter screening signal derived from the JD.", "resumeEvidence": "Summary evidence read.", "hiringImpact": "Severity classification plus screening consequence.", "ifTrue": "Observable proof structure tied to visible resume evidence.", "ifNotTrue": "Do-not-claim warning plus named strongest truthful adjacent proof.", "futurePositioning": "Recruiter interpretation behavior."},

  {"section": "skills", "requiredSignal": "The actual skill or capability gap for THIS JD — not a generic tech signal. For advisory/consulting/leadership roles this means methodology, domain expertise, or governance skills. Only name cloud/API/technical tools if the JD explicitly requires them.", "resumeEvidence": "What the resume skills section actually shows vs what this JD needs.", "hiringImpact": "Severity classification plus screening consequence.", "ifTrue": "Observable proof structure tied to what the resume actually proves.", "ifNotTrue": "Do-not-claim warning plus the specific adjacent evidence visible in this resume.", "futurePositioning": "Recruiter interpretation of this skills gap or strength."},

  {"section": "experience", "requiredSignal": "Specific delivery ownership signal derived from the JD.", "resumeEvidence": "Experience evidence read.", "hiringImpact": "Severity classification plus screening consequence.", "ifTrue": "Observable implementation, evaluation, coordination, or ownership proof structure.", "ifNotTrue": "Do-not-claim warning plus named strongest truthful adjacent proof.", "futurePositioning": "Recruiter delivery/ownership interpretation behavior."},

  {"section": "education", "requiredSignal": "Education and credential credibility for this role", "resumeEvidence": "Read what education, certifications, or training the resume actually shows. State it specifically. If no degree is present, state that clearly.", "hiringImpact": "Apply the EDUCATION MITIGATION RULE: if the JD prefers (not requires) a degree and the resume lacks one, check for mitigating factors: 10+ years experience, portfolio scale ($10M+, large team), relevant certifications. If two or more are present, classify as 'Minor preference gap mitigated by demonstrated experience' and name the mitigating evidence explicitly. Do not default to a generic survivable gap label when strong mitigation exists.", "ifTrue": "If relevant education or certifications exist, name them specifically and explain why they strengthen credibility for this role.", "ifNotTrue": "If no degree exists but strong mitigating experience and credentials are present, state what those mitigating factors are and why they offset the preference gap. Do not simply say the degree is missing without acknowledging what replaces it.", "futurePositioning": "How a recruiter interprets this candidate's educational background and experience profile together for this specific role. If experience volume is high, say so."}
],
  "prioritySection": "summary | skills | experience | education",
  "reasoning": []
}` : `{
  "opening": "One concise recruiter-style sentence about this section.",
  "environment": "${hammerContext.environment.label}",
  "matchAssessment": "Section-specific recruiter read.",
  "signalGaps": ["Most important direct-proof gap in this section."],
  "improvementActions": [{"section": "${section}", "requiredSignal": "Specific section-relevant hiring signal derived from the JD.", "resumeEvidence": "Section evidence read.", "hiringImpact": "Severity classification plus screening consequence.", "ifTrue": "Observable proof structure tied to visible resume evidence.", "ifNotTrue": "Do-not-claim warning plus named strongest truthful adjacent proof.", "futurePositioning": "Recruiter interpretation behavior."}],
  "bulletFixes": [{"original": "", "improved": "", "reason": ""}],
  "summaryFix": {"original": "", "improved": "", "reason": ""},
  "reasoning": []
}`}
`.trim();
}

export function buildJDSignalExtractionPrompt({ jdText = '', jobMeta = null } = {}) {
  return `
You are ForgeTomorrow JD Signal Extraction.

Your job is to read this job description and extract the hiring signals a real recruiter would evaluate.

Return ONLY valid JSON.
Do not include markdown.
Do not invent requirements.
Do not treat employer names as required experience unless the JD explicitly says the candidate must have experience with that employer's platform, tools, or products.

JOB TITLE:
${jobMeta?.title || '[not provided]'}

JOB DESCRIPTION:
${safeString(removeEmployerNoise(jdText), 5000) || '[No JD supplied]'}

JSON SHAPE:
{
  "hardRequirements": [],
  "preferredSignals": [],
  "toolsAndPlatforms": [],
  "deliverySignals": [],
  "credibilitySignals": [],
  "educationSignals": [],
  "softSignals": [],
  "screenOutRisks": []
}

RULES:
- hardRequirements = must-have items stated as required.
- preferredSignals = nice-to-have or preferred items.
- toolsAndPlatforms = named tools, platforms, systems, frameworks, or technologies.
- deliverySignals = ownership, execution, project, advisory, implementation, management, stakeholder, or operational delivery signals.
- credibilitySignals = experience that strengthens recruiter confidence but is not a hard requirement.
- educationSignals = degrees, certifications, licenses, clearances, or training.
- softSignals = communication, leadership, collaboration, detail orientation, judgment, analytical thinking.
- screenOutRisks = only items that would realistically block the candidate if missing.
- Keep each item short, recruiter-readable, and role-specific.
`.trim();
}

export function buildRecruiterScanPrompt({
  jdText = '',
  resume = {},
  resumeData = null,
  jobMeta = null,
  role = 'SEEKER',
} = {}) {
  const effectiveResume = resumeData || resume || {};
  const hammerContext = buildHammerContext({ jdText, resumeData: effectiveResume, jobMeta });
  const snapshot = buildResumeSnapshot(effectiveResume, {
    maxExperience: 6,
    maxBullets: 5,
    maxSkills: 40,
  });
  const deterministicAnalysis = buildDeterministicHammerAnalysis({
    jdText,
    resume: effectiveResume,
    missing: {},
    jobMeta,
  });

  const reviewerFrame =
    String(role || '').toUpperCase() === 'RECRUITER'
      ? 'You are reviewing as a recruiter evaluating hiring risk and fit.'
      : String(role || '').toUpperCase() === 'COACH'
        ? 'You are reviewing as a senior career coach preparing session-ready feedback.'
        : 'You are reviewing as a senior HR recruiter deciding whether this applicant advances.';

  return `
You are the ForgeTomorrow AI Scan.
${reviewerFrame}

Decide whether this resume would likely move forward for this JD.
Use deterministic analysis as the risk backbone.
Do not invent experience, tools, metrics, credentials, or outcomes.
Do not mention LinkedIn.
Return ONLY valid JSON.

HIRING LENS:
${hammerContext.environment.label}
${hammerContext.environment.hiringLens}

JOB DESCRIPTION:
${safeString(jdText, 3600) || '[No JD supplied]'}

RESUME SNAPSHOT:
${snapshot.text}

${formatDeterministicAnalysis(deterministicAnalysis)}

DECISION QUESTIONS:
- Would this resume move forward?
- What would cause rejection even if the candidate is qualified?
- What proof is missing?
- What is the strongest visible match signal?
- What are the top 3 fixes before applying?
RECRUITER REASONING RULES:
- Evaluate recruiter confidence, not keyword density.
- Distinguish between:
  - direct proof
  - adjacent proof
  - inferred capability
- Adjacent evidence may still be competitive if operational ownership, technical coordination, delivery leadership, or implementation oversight is strongly visible.
- Do not assume a missing vendor, platform, or tooling keyword automatically creates rejection risk.
- Evaluate whether the candidate could realistically perform the role based on visible trajectory and evidence quality.
- Strong strategic advisory, implementation oversight, governance, delivery leadership, systems coordination, operational ownership, or technical consulting experience may satisfy implementation-adjacent roles even without exact tooling matches.
- Prefer recruiter reasoning over ATS keyword matching.
- Avoid rigid keyword-based rejection logic.
- Treat recruiter confidence as the primary scoring factor.
- CAPABILITY-EQUIVALENCY: A candidate whose resume demonstrates 80%+ of the JD responsibilities scores as a strong match even if their job titles differ from the JD title. Titles are naming conventions. Responsibilities are evidence. Do not subtract score points for title mismatch when the underlying work is proven. Customer Success Operations ↔ Client Services Leadership ↔ Service Delivery Leadership ↔ Account Operations Leadership are the same capability cluster. Score the work, not the label.
- When scoring: a candidate with 85%+ of JD responsibilities demonstrated in their bullets should score 85 or higher regardless of title alignment. Reduce the score only for responsibilities that are genuinely absent from the resume, not for title language differences.

JSON SHAPE:
{
  "score": 82,
  "summary": "3-5 sentences explaining the hiring decision for THIS job.",
  "wouldAdvance": true,
  "advanceLikelihood": "low | medium | high",
  "strongestSignal": "Strongest visible evidence supporting advancement.",
  "rejectionRisk": "Clearest likely rejection reason.",
  "missingProof": ["Specific missing proof."],
  "topFixes": ["Specific fix before applying."],
  "recommendations": ["Specific recommendation tied to JD and visible resume evidence."]
}

SCORING GUIDE:
90-100 likely advance; 75-89 competitive with visible gaps; 60-74 possible but weak proof; 40-59 weak match; 0-39 unlikely.
`.trim();
}

export function buildKeywordLensPrompt({
  jdText = '',
  resume = {},
  resumeData = null,
  jobMeta = null,
} = {}) {
  const effectiveResume = resumeData || resume || {};
  const hammerContext = buildHammerContext({ jdText, resumeData: effectiveResume, jobMeta });
  const snapshot = buildResumeSnapshot(effectiveResume, {
    maxExperience: 6,
    maxBullets: 5,
    maxSkills: 50,
  });

  return `
You are the ForgeTomorrow Keyword Lens.

YOUR ROLE:
You handle evidence mapping.
You do not write advice.
You identify how well the resume covers the job description's visible signals.

STRATEGIC LENS:
Environment: ${hammerContext.environment.label}
Language that matters: ${hammerContext.environment.language}

JOB DESCRIPTION:
${safeString(jdText, 3600)}

RESUME SNAPSHOT:
${snapshot.text}

OUTPUT RULES:
Return ONLY valid JSON.
No markdown.
No commentary outside JSON.

JSON SHAPE:
{
  "buckets": [
    {
      "key": "title",
      "label": "Title/Role",
      "matched": 0,
      "total": 0,
      "points": 0,
      "matchedTerms": [],
      "missingTerms": []
    },
    {
      "key": "hard",
      "label": "Hard Skills",
      "matched": 0,
      "total": 0,
      "points": 0,
      "matchedTerms": [],
      "missingTerms": []
    },
    {
      "key": "tools",
      "label": "Tools",
      "matched": 0,
      "total": 0,
      "points": 0,
      "matchedTerms": [],
      "missingTerms": []
    },
    {
      "key": "edu",
      "label": "Education",
      "matched": 0,
      "total": 0,
      "points": 0,
      "matchedTerms": [],
      "missingTerms": []
    },
    {
      "key": "soft",
      "label": "Soft Skills",
      "matched": 0,
      "total": 0,
      "points": 0,
      "matchedTerms": [],
      "missingTerms": []
    }
  ],
  "biggestGap": "",
  "recommendedFirstFix": ""
}

RULES:
- Use only requirements/signals present in the JD.
- Do not invent requirements.
- Keep matchedTerms and missingTerms short.
- points must be 0 to 100 per bucket.
- Missing terms should be usable by the Coach for honest placement.
`.trim();
}

export default {
  FORGE_ENVIRONMENTS,
  detectTargetEnvironment,
  normalizeResumeForBrain,
  buildResumeSnapshot,
  buildHammerContext,
  buildSectionCoachPrompt,
  buildJDSignalExtractionPrompt,
  buildRecruiterScanPrompt,
  buildKeywordLensPrompt,
};