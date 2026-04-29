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

function deriveHammerSignals({ jdText = '', missing = {}, jobMeta = null } = {}) {
  const signals = [];

  const title = String(jobMeta?.title || '');
  const combined = `${title}\n${jdText}`;

  if (jdHas(combined, ['project manager', 'project management', 'technical project manager', 'tpm'])) {
    signals.push('project management');
  }

  if (jdHas(combined, ['technical leadership', 'technical lead', 'technical delivery', 'engineering coordination'])) {
    signals.push('technical leadership');
  }

  if (jdHas(combined, ['workflow automation', 'zapier', 'make', 'integromat', 'n8n', 'automation workflow'])) {
    signals.push('workflow automation');
  }

  if (jdHas(combined, ['llm', 'openai', 'gemini', 'claude', 'ai integration', 'ai/llm', 'large language model'])) {
    signals.push('ai/llm');
  }

  if (jdHas(combined, ['stakeholder', 'cross-functional', 'cross functional'])) {
    signals.push('stakeholder coordination');
  }

  if (jdHas(combined, ['jira', 'agile', 'scrum', 'kanban'])) {
    signals.push('agile delivery');
  }

  const missingSignals = [
    ...(Array.isArray(missing.high) ? missing.high : []),
    ...(Array.isArray(missing.tools) ? missing.tools : []),
    ...(Array.isArray(missing.edu) ? missing.edu : []),
  ];

  return uniqueStrings([...signals, ...missingSignals]).slice(0, 10);
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
          return `- ${risk.signal}: evidence=${risk.status}, confidence=${risk.confidence}, risk=${risk.level}. ${risk.reason}`;
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
- If any fatal risk exists, lead with the highest fatal risk.
- If no fatal risk exists, lead with the highest moderate risk.
- If only survivable risks exist, say the risk is survivable and explain what proof would reduce it.
- Do not treat adjacent evidence as direct proof.
- Do not inflate adjacent proof into direct experience.
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
  const experiences = resume.workExperiences || resume.experiences || [];
  const education = resume.educationList || resume.education || [];

  return {
    targetedRole:
      resume?.personalInfo?.targetedRole ||
      resume?.targetedRole ||
      resume?.jobTitle ||
      '',
    summary: String(resume.summary || ''),
    skills: Array.isArray(resume.skills) ? resume.skills.filter(Boolean) : [],
    experiences: Array.isArray(experiences) ? experiences : [],
    education: Array.isArray(education) ? education : [],
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
      'Education:',
      educationText || '[No education provided]',
    ].join('\n'),
  };
}

export function buildHammerContext({ jdText = '', resumeData = {}, jobMeta = null } = {}) {
  const targetCompanies = [jobMeta?.company, jobMeta?.title].filter(Boolean).join(' ');

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
} = {}) {
  const effectiveResume = resumeData || resume || {};
  const hammerContext = buildHammerContext({ jdText, resumeData: effectiveResume, jobMeta });
  const snapshot = buildResumeSnapshot(effectiveResume, {
    maxExperience: 4,
    maxBullets: 2,
    maxSkills: 30,
  });
  const deterministicAnalysis = buildDeterministicHammerAnalysis({
    jdText,
    resume: effectiveResume,
    missing,
    jobMeta,
  });
  const deterministicBlock = formatDeterministicAnalysis(deterministicAnalysis);

  const section = context?.section || 'overview';
  const isOverview = section === 'overview';
  const keyword = context?.keyword || '';

  return `
YOUR ROLE:
You are a senior HR recruiter with 15 years of experience.
You have seen thousands of resumes.
You know exactly what causes rejection and what earns an interview.
You are reviewing this specific resume against this specific job description.
You are not here to be encouraging. You are here to be accurate.

FORGETOMORROW PHILOSOPHY:
- Narrative before application.
- Alignment before volume.
- Strategy before job search.

DETECTED HIRING ENVIRONMENT:
Environment: ${hammerContext.environment.label}
Hiring lens: ${hammerContext.environment.hiringLens}
What success looks like here: ${hammerContext.environment.successMetrics}
Language that lands in this environment: ${hammerContext.environment.language}
What will hurt this candidate here: ${hammerContext.environment.avoid}

SELECTED SECTION:
${section}

${keyword ? `FOCUS KEYWORD: ${keyword}\n` : ''}

JOB DESCRIPTION:
${safeString(jdText, 3500) || '[No JD supplied]'}

CURRENT RESUME SNAPSHOT:
${snapshot.text}

${deterministicBlock}

MISSING SIGNALS:
High-impact terms: ${(missing.high || []).join(', ') || '[none provided]'}
Tools: ${(missing.tools || []).join(', ') || '[none provided]'}
Education: ${(missing.edu || []).join(', ') || '[none provided]'}
Soft skills: ${(missing.soft || []).join(', ') || '[none provided]'}

YOUR JOB:
Identify exactly what would cause this resume to be rejected for this role.
Then tell the candidate what to do about it — honestly, specifically, and only based on what the resume actually proves.

SECTION ROUTING — NON-NEGOTIABLE:
- Summary = first-impression positioning. Does the opening statement create immediate alignment?
- Skills = tools, technologies, platforms, APIs, hard skills. Can a recruiter confirm technical fit in 10 seconds?
- Experience = work history proof. Projects, ownership, delivery, stakeholder coordination, outcomes.
- Education = degrees, certifications, licenses, formal credentials ONLY. Only include if JD explicitly requires one.
- NEVER use "overview" as a section value in improvementActions.
- NEVER put tool/technology feedback in summary.
- NEVER put project/delivery feedback in skills.
- NEVER combine multiple sections into one action.

${isOverview ? `OVERVIEW RULES — YOU MUST FOLLOW THESE EXACTLY:
You MUST return at least 3 improvementActions.
You MUST return exactly ONE action with "section": "summary".
You MUST return exactly ONE action with "section": "skills".
You MUST return exactly ONE action with "section": "experience".
Only add "section": "education" if the JD explicitly requires a degree, certification, or license.
Do NOT tag more than one action with the same section value.
Each action must address a DIFFERENT JD signal.

The matchAssessment must read like private recruiter notes — not a template sentence.
It must answer: would I move this candidate forward, what is the single biggest blocker, and what proof would change my mind?
Lead with the biggest screening risk from DETERMINISTIC HAMMER ANALYSIS.
Do NOT write a generic risk sentence. Write what you actually see.` : `SINGLE SECTION RULES:
You are reviewing ONLY the "${section}" section.
Return only improvementActions with "section": "${section}".
Do not comment on other sections.`}

EVIDENCE RULES — NON-NEGOTIABLE:
- Never tell the candidate to claim something not proven by the resume snapshot.
- If a required signal is missing, use conditional guidance: ifTrue / ifNotTrue.
- Use DETERMINISTIC HAMMER ANALYSIS as the risk and evidence backbone.
- Do not treat adjacent evidence as direct proof.
- Do not treat missing evidence as survivable unless the deterministic risk says survivable or moderate.
- ifTrue: Describe WHAT TYPE of real evidence would strengthen this section if the candidate truly has it.
  Do NOT write example sentences, invented quotes, or fictional resume copy.
  Do NOT put words in quotation marks that the candidate should paste in.
  Instead describe the proof structure:
  - Project management: show what was built, who was involved, scope, coordination, outcome
  - Tools/automation: show which tool, what workflow it was applied to, what changed as a result
  - AI/LLM: show how it was integrated, what problem it solved, what the business impact was
  - Stakeholders: show how alignment was achieved, decisions made, communication handled
- ifNotTrue: Say "Do not claim [specific signal]." Then name the SPECIFIC visible adjacent evidence
  already present in the resume snapshot. Do not use generic phrases like "strengthen technical skills."
  Name the actual evidence visible in the resume snapshot, such as the candidate's platform ownership, operational leadership, technical implementation work, client ownership, program delivery, team leadership, or other clearly stated proof.
- Never write fictional bullets, invented quotes, made-up metrics, fake percentages, or sample resume sentences.
- Never invent measurable outcomes unless they are explicitly visible in the resume snapshot.
- Future positioning must describe framing strategy, not fabricated resume content.
- Never mention LinkedIn.

LANGUAGE RULES — NON-NEGOTIABLE:
Do NOT use:
- "a recruiter may question..." → too soft. Say what WILL happen.
- "could add" or "could include" → use "If true, place..." or "If true, the strongest proof shows..."
- "for example" or "e.g." → remove entirely
- "highlight transferable skills" → use "Strengthen the strongest visible proof already present in the resume:"
- "tailor your resume" → never say this
- "improve clarity" → never say this
- generic fallback language that could apply to any resume

DO use:
- "This will cause a screen-out unless addressed."
- "A recruiter scanning this in 6 seconds will not see [signal]."
- "The screening risk is [specific consequence]."
- "This section already works because [specific JD signal it supports]."
- "If true, the strongest proof would show [specific evidence type]."
- "If not true, do not claim it. Strengthen [specific adjacent evidence from snapshot]."

RECRUITER TONE RULES:
Write like internal recruiter notes, not motivational coaching.

Avoid:
- "potential for growth"
- "frame the answer around"
- "highlight transferable skills"
- "position yourself as"
- "showcase"
- "demonstrate passion"
- "strong candidate"
- "great fit"
- "lean into"

Prefer blunt recruiter language such as:
- "This alone could cause a screen-out."
- "This is survivable if reframed correctly."
- "This creates moderate screening risk."
- "The resume reads as adjacent, not directly proven."
- "The founder title creates credibility, but not proof."
- "A recruiter will assume this experience is indirect unless clarified."
- "This section currently reads operational, not project-driven."
- "This skill gap is likely survivable."
- "This is the first thing a recruiter will question."

VISIBLE ADJACENT EVIDENCE:
Identify the strongest visible adjacent proof vehicle already present in the resume snapshot.

Use ONLY evidence actually visible in the loaded resume.

Do not collapse founder, architecture, platform, AI, systems, or technical implementation experience into generic operational leadership if stronger technical proof is visibly present.

Prefer the MOST technically relevant visible proof vehicle.

Bad:
- operational leadership
- leadership experience

Better:
- platform architecture ownership
- AI systems implementation
- technical product delivery
- systems design and API integration work
- explainable AI platform development
- end-to-end platform implementation ownership

Use the strongest directly relevant evidence already visible in the resume snapshot.

Examples of valid proof vehicles:
- a major platform or product build
- operational leadership
- systems architecture
- workforce management
- healthcare coordination
- nonprofit program ownership
- manufacturing operations
- military leadership
- client success ownership
- technical implementation work
- automation or process improvement work
- cross-functional delivery leadership
- customer operations ownership

The ifTrue field must reference the candidate’s actual visible proof vehicle whenever one exists.

Bad ifTrue:
"If true, the strongest proof would show project ownership, delivery, stakeholders, and outcomes."

Good ifTrue:
"If true, the strongest visible proof vehicle is the candidate’s operational leadership experience — show what systems were improved, who was coordinated across, what changed operationally, and what measurable outcomes resulted."

Good ifTrue:
"If true, the strongest visible proof vehicle is the platform implementation work already present in the resume — show the scope, integrations, coordination, and business impact."

If no adjacent proof vehicle exists in the resume snapshot, explain what real evidence would be needed without inventing experience.

Never invent projects, tools, metrics, or achievements.

QUALITY BAR:
Every improvementAction must:
1. Identify the actual screening risk.
2. Classify the screening severity as:
- likely screen-out
- major screening risk
- moderate screening risk
- survivable gap
- low-risk gap
- likely ignored
3. Reference a visible proof vehicle already present in the resume whenever possible.
4. Tell the candidate what real evidence would strengthen the case.
5. Prevent the candidate from overstating experience.

The response should sound like private recruiter evaluation notes.

Do not sound motivational, inspirational, or corporate.

Avoid repetitive phrasing across sections.
Each section should feel independently reasoned.

Summary should sound like first-impression screening.
Skills should sound like technical verification.
Experience should sound like delivery and ownership evaluation.
Education should sound like credential validation only.

The ifTrue field must not be generic.
It must connect the required JD signal to a specific visible proof vehicle already present in the resume whenever possible.

requiredSignal must read like a recruiter evaluation category, not a keyword tag.

Bad:
- "project management"
- "workflow automation"
- "stakeholder coordination"

Good:
- "Direct project delivery ownership"
- "Workflow automation tooling exposure"
- "Cross-functional coordination across technical stakeholders"

requiredSignal should sound like a real hiring evaluation criterion.

requiredSignal should isolate the SINGLE most important screening signal for that section.

Do not combine multiple unrelated domains into one requiredSignal.

Bad:
- "Cloud architecture, cybersecurity consulting, and data engineering expertise"

Better:
- "Hands-on cloud architecture exposure"
- "Technical consulting workflow evaluation experience"
- "Security standards evaluation exposure"

Each improvementAction should focus on ONE hiring signal only.

For Skills actions:
- Never invent or suggest specific tools unless:
  1. the JD explicitly names them, OR
  2. the resume snapshot already proves them.
- If the JD references a tool category but does not name tools, refer to the category only.
- Do not inject popular examples like Zapier, n8n, Make, Salesforce, Jira, or similar unless explicitly present in the JD or resume.
- The Skills section may only name tools the candidate has actually used.
- The Experience section must prove where and how the tool was applied.

Every hiringImpact must explicitly classify the screening severity.

Use one:
- likely screen-out
- moderate screening risk
- survivable gap
- low-risk gap
- likely ignored

Examples:
- "This creates moderate screening risk because the resume reads operational rather than project-driven."
- "This is likely to cause a screen-out because the JD requires direct implementation ownership."
- "This gap is survivable if supported elsewhere in the experience section."

Bad:
"show ownership, delivery, stakeholders, and outcomes."

Good:
"use the operational leadership experience already visible in the resume as the proof vehicle for coordination, delivery ownership, and measurable operational change."

Good:
"use the platform implementation work already visible in the resume as the proof vehicle for integrations, workflow ownership, and technical coordination."

If no visible proof vehicle exists, explain what real evidence would be needed without inventing experience, projects, metrics, or achievements.

If an action sounds reusable across any resume, rewrite it to be more specific to the visible evidence and JD requirements.

FUTURE POSITIONING RULES:
Future positioning is not motivational advice.
Future positioning should explain recruiter interpretation behavior.

Good:
- "A recruiter will assume this work was operational support rather than ownership unless coordination responsibility is clarified."
- "The experience currently reads implementation-adjacent rather than direct delivery leadership."
- "Without explicit tooling evidence, recruiters will interpret this as indirect exposure."

Avoid abstract phrasing like:
- "can support"
- "may align"
- "could strengthen"

Do not say:
- "frame the answer around"
- "highlight the candidate's ability"
- "position yourself as"
- "showcase"
- "lean into"

Instead:
- identify the most defensible existing proof vehicle
- explain how recruiters are likely to interpret it
- explain what additional evidence would reduce screening risk

Good:
"A recruiter will interpret the operational leadership experience as adjacent to delivery ownership unless measurable coordination and execution responsibility is clarified."

Good:
"Without workflow tooling listed explicitly, recruiters will interpret this as adjacent leadership rather than direct automation experience."

Good:
"The founder experience supports ownership credibility, but the resume still needs direct implementation evidence."

OUTPUT FORMAT:
Return ONLY valid JSON. No markdown. No commentary outside the JSON object.

${isOverview ? `JSON SHAPE FOR OVERVIEW:
{
  "opening": "One sharp recruiter-style sentence about the overall fit. Not a bio. Not a summary rewrite.",
  "environment": "${hammerContext.environment.label}",
  "matchAssessment": "Write your private recruiter read here. Lead with the biggest blocker. Name the strongest visible support. Use specific evidence from the JD, resume, and deterministic risk analysis. Do NOT repeat these instructions in the output. Do NOT use template phrasing.",
  "signalGaps": [
    "The single most critical missing signal that creates rejection risk."
  ],
  "improvementActions": [
    {
      "section": "summary",
      "requiredSignal": "The specific first-impression alignment signal the Summary must convey for this JD.",
      "resumeEvidence": "What the current Summary proves or fails to prove against the JD.",
      "hiringImpact": "What will happen at screening if this stays as-is. Be specific.",
      "ifTrue": "Required unless the resume already strongly proves this signal.",
      "ifNotTrue": "Required when the signal is missing or weak.",
      "futurePositioning": "Describe positioning strategy only. Never invent bullets, metrics, outcomes, percentages, or sample resume language. Leave empty string if redundant."
    },
    {
      "section": "skills",
      "requiredSignal": "The specific tool, technology, platform, or hard skill signal the JD requires.",
      "resumeEvidence": "What the current Skills section proves or fails to prove against the JD.",
      "hiringImpact": "What will happen at screening if this stays as-is. Be specific.",
      "ifTrue": "Required unless the resume already strongly proves this signal.",
      "ifNotTrue": "Required when the signal is missing or weak.",
      "futurePositioning": "Describe positioning strategy only. Never invent bullets, metrics, outcomes, percentages, or sample resume language. Leave empty string if redundant."
    },
    {
      "section": "experience",
      "requiredSignal": "The specific work-history proof the JD requires — ownership, delivery, stakeholders, outcomes.",
      "resumeEvidence": "What the current Experience proves or fails to prove against the JD.",
      "hiringImpact": "What will happen at screening if this stays as-is. Be specific.",
      "ifTrue": "Required unless the resume already strongly proves this signal.",
      "ifNotTrue": "Required when the signal is missing or weak.",
      "futurePositioning": "Describe positioning strategy only. Never invent bullets, metrics, outcomes, percentages, or sample resume language. Leave empty string if redundant."
    }
  ],
  "prioritySection": "summary | skills | experience | education",
  "reasoning": []
}` : `JSON SHAPE FOR SINGLE SECTION:
{
  "opening": "One sharp recruiter-style sentence about this section's alignment.",
  "environment": "${hammerContext.environment.label}",
  "matchAssessment": "Your honest read of this section against the JD. Lead with the biggest gap or strength.",
  "signalGaps": [
    "The most critical missing signal in this section."
  ],
  "improvementActions": [
    {
      "section": "${section}",
      "requiredSignal": "The specific signal this section must convey for this JD.",
      "resumeEvidence": "What this section currently proves or fails to prove.",
      "hiringImpact": "What will happen at screening if this stays as-is.",
      "ifTrue": "Required unless the resume already strongly proves this signal.",
      "ifNotTrue": "Required when the signal is missing or weak.",
      "futurePositioning": "Describe positioning strategy only. Never invent bullets, metrics, outcomes, percentages, or sample resume language. Leave empty string if redundant."
    }
  ],
  "bulletFixes": [
    {
      "original": "",
      "improved": "",
      "reason": ""
    }
  ],
  "summaryFix": {
    "original": "",
    "improved": "",
    "reason": ""
  },
  "reasoning": []
}`}
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

YOUR ROLE:
${reviewerFrame}

You handle BIG PICTURE alignment.
You judge the full resume against the loaded job description.
This is the confidence check after the user has worked with the coach.

BOUNDARY:
You are not rewriting one section.
You are not generating broad career strategy.
You are deciding whether this resume would likely move forward for this job.

FORGETOMORROW PHILOSOPHY:
- Narrative before application.
- Alignment before volume.
- Strategy before job search.

DETECTED HIRING LENS:
Environment: ${hammerContext.environment.label}
Hiring lens: ${hammerContext.environment.hiringLens}
Success metrics: ${hammerContext.environment.successMetrics}
Language that lands: ${hammerContext.environment.language}
Avoid: ${hammerContext.environment.avoid}

JOB DESCRIPTION:
${safeString(jdText, 5000) || '[No JD supplied]'}

FULL RESUME SNAPSHOT:
${snapshot.text}

${formatDeterministicAnalysis(deterministicAnalysis)}

HIRING DECISION QUESTIONS:
- Would this resume move forward for this JD?
- What would cause rejection even if the candidate is qualified?
- What proof is missing?
- What is the strongest match signal?
- What are the top 3 fixes before applying?

OUTPUT RULES:
Return ONLY valid JSON.
No markdown.
No commentary outside JSON.

JSON SHAPE:
{
  "score": 82,
  "summary": "3-5 sentences explaining the overall hiring decision for THIS job.",
  "wouldAdvance": true,
  "advanceLikelihood": "low | medium | high",
  "strongestSignal": "The strongest evidence supporting advancement.",
  "rejectionRisk": "The clearest reason this resume may be rejected.",
  "missingProof": [
    "Specific proof or evidence missing from the resume."
  ],
  "topFixes": [
    "Specific fix before applying."
  ],
  "recommendations": [
    "Specific recommendation tied to the JD and resume evidence."
  ]
}

SCORING GUIDE:
- 90-100: likely advance, strong direct alignment, clear evidence.
- 75-89: competitive but still has visible gaps.
- 60-74: possible but needs stronger evidence or keyword alignment.
- 40-59: weak match or unclear story.
- 0-39: unlikely to advance.

QUALITY BAR:
Be direct.
Do not flatter.
Do not invent experience.
Tie every recommendation to the job description and visible resume evidence.
Use deterministic risk classification when deciding the rejection risk.
Do not mention LinkedIn.
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
${safeString(jdText, 4500)}

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
  buildRecruiterScanPrompt,
  buildKeywordLensPrompt,
};
