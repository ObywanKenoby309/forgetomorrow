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

  if (jdHas(combined, ['it services firm', 'systems integrator', 'technology consultancy', 'technical consulting', 'consulting workflows', 'consultancy'])) {
    signals.push('technical consulting workflow evaluation');
  }

  if (jdHas(combined, ['enterprise architecture', 'cloud platform', 'cloud platforms', 'cloud architecture', 'security standards', 'cybersecurity consulting', 'data engineering'])) {
    signals.push('cloud / enterprise architecture evaluation');
  }

  if (jdHas(combined, ['ai-generated outputs', 'ai generated outputs', 'annotating data', 'ai accuracy', 'evaluation tasks', 'evaluate ai', 'reviewing and evaluating ai'])) {
    signals.push('ai output evaluation');
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
- If any fatal risk exists, describe it as likely screen-out or major screening risk unless the JD makes it an absolute blocker.
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
${safeString(jdText, 3000) || '[No JD supplied]'}

RESUME SNAPSHOT:
${snapshot.text}

${deterministicBlock}

MISSING SIGNALS:
High-impact: ${(missing.high || []).join(', ') || '[none]'}
Tools: ${(missing.tools || []).join(', ') || '[none]'}
Education: ${(missing.edu || []).join(', ') || '[none]'}
Soft skills: ${(missing.soft || []).join(', ') || '[none]'}

CORE RULES:
- Return ONLY valid JSON.
- Do not invent experience, tools, metrics, projects, credentials, outcomes, clients, prior employers, or prior roles.
- Do not mention LinkedIn.
- Treat DETERMINISTIC HAMMER ANALYSIS as the evidence and risk backbone.
- Do not treat adjacent evidence as direct proof.
- If direct proof is missing, use ifTrue / ifNotTrue.
- Strong adjacent technical evidence must be acknowledged as credibility, not dismissed as generic leadership.

ifTrue RULES:
- ifTrue must generate recruiter guidance, not policy text.
- ifTrue must describe observable proof structure, not restate the requirement.
- ifTrue must anchor to the strongest visible proof vehicle already present in the resume whenever possible.
- ifTrue must describe what was built, implemented, evaluated, reviewed, coordinated, operationalized, or owned.
- ifTrue must name the systems, workflows, APIs, platforms, standards, technical environments, evaluation processes, or delivery responsibilities involved.
- ifTrue must NOT request fake consulting history, fictional clients, invented prior jobs, generic experience, or unproven tools.

Good ifTrue:
"Show where platform systems, APIs, technical workflows, evaluation processes, or standards were implemented or reviewed, what technical responsibility existed, and what decisions the candidate personally owned."

Good ifTrue:
"Show where AI systems, platform workflows, integrations, or output-quality review processes were evaluated, operationalized, or improved, and what evidence proves the candidate owned the work."

ifNotTrue RULES:
- ifNotTrue must explicitly tell the candidate not to claim the missing signal.
- ifNotTrue must preserve the strongest truthful adjacent evidence already visible in the resume.
- ifNotTrue must reference the most technically relevant visible proof vehicle whenever possible.
- Do not write vague fallback language such as "Strengthen specific visible adjacent proof."

Good ifNotTrue:
"Do not claim direct consulting experience. Strengthen the platform architecture and explainable AI implementation ownership already visible in the resume."

Good ifNotTrue:
"Do not claim hands-on cloud platform delivery unless true. Strengthen the systems design, API-driven platform work, and technical implementation ownership already visible in the resume."

SKILLS RULES:
- Skills may name tools only if the JD explicitly names them or the resume already proves them.
- If the JD references a tool category without naming tools, refer to the category only.
- Never inject popular example tools unless explicitly present in the JD or resume.
- Skills ifTrue must explain where tool/platform proof should appear in the resume, not copy policy text.

SECTION ROUTING:
- Summary = first-impression positioning.
- Skills = tools, technologies, platforms, APIs, hard skills.
- Experience = work-history proof: projects, ownership, delivery, stakeholders, outcomes.
- Education = degrees, certifications, licenses only.
- Never use "overview" as an improvementActions section.
- Never combine unrelated sections into one action.

${isOverview ? `OVERVIEW REQUIREMENTS:
Return at least 3 improvementActions:
- exactly one section "summary"
- exactly one section "skills"
- exactly one section "experience"
- include "education" only if the JD explicitly requires a degree, certification, or license
Do not repeat a section.
matchAssessment must synthesize:
- strongest visible credibility signal
- largest missing direct-proof gap
- overall recruiter interpretation
It must read like one coherent hiring evaluation, not disconnected critiques.` : `SINGLE SECTION REQUIREMENTS:
Return only improvementActions with section "${section}".
Do not comment on other sections.`}

STYLE RULES:
- Write like private recruiter notes.
- requiredSignal must sound like a hiring evaluation category a human recruiter would say.
- requiredSignal must isolate ONE screening signal. Do not combine unrelated domains.
- Avoid robotic compound phrases.
- hiringImpact must classify severity using one: likely screen-out, major screening risk, moderate screening risk, survivable gap, low-risk gap, likely ignored.
- Future positioning must explain recruiter interpretation behavior, not motivational advice.
- Do not repeat the same phrasing, proof vehicle, or recruiter interpretation across sections.
- Summary should focus on first-impression positioning risk.
- Skills should focus on tooling or technical verification risk.
- Experience should focus on delivery ownership or implementation proof risk.

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

PREFERRED PHRASES:
- This alone could cause a screen-out.
- This is survivable if reframed correctly.
- This creates moderate screening risk.
- The resume reads as adjacent, not directly proven.
- A recruiter will assume this experience is indirect unless clarified.
- Without explicit tooling evidence, recruiters will interpret this as indirect exposure.
- The experience currently reads implementation-adjacent rather than direct delivery leadership.

VISIBLE PROOF VEHICLE PRIORITY:
Use the strongest visible proof vehicle already present in the resume.
Prefer technical proof over generic leadership when visible:
- platform architecture ownership
- explainable AI implementation ownership
- AI systems implementation
- technical product delivery
- systems design and API-driven platform work
- end-to-end platform implementation ownership
- technical workflow evaluation
- cross-functional technical delivery leadership
- operational leadership only when no stronger technical proof exists

Never downgrade highly technical visible evidence into generic leadership phrasing.

If the resume visibly proves platform architecture, systems design, AI implementation, technical product ownership, API/data-driven systems, explainable AI models, or end-to-end platform delivery, those MUST be treated as stronger proof vehicles than generic operational or leadership experience.

Good:
"platform architecture and explainable AI implementation ownership"

Good:
"end-to-end technical product delivery and systems design ownership"

Good:
"technical implementation and API-driven platform architecture work already visible in the resume"

When stronger technical proof exists, do not fallback to generic operational leadership language.

JSON SHAPE:
${isOverview ? `{
  "opening": "One concise recruiter-style sentence. Not a bio.",
  "environment": "${hammerContext.environment.label}",
  "matchAssessment": "Synthesize strongest visible credibility, largest missing direct proof, and overall recruiter interpretation.",
  "signalGaps": ["Most important direct-proof gap."],
  "improvementActions": [
    {"section": "summary", "requiredSignal": "Natural recruiter screening category.", "resumeEvidence": "Summary evidence read.", "hiringImpact": "Severity classification plus screening consequence.", "ifTrue": "Observable proof structure tied to visible resume evidence.", "ifNotTrue": "Do-not-claim warning plus named strongest truthful adjacent proof.", "futurePositioning": "Recruiter interpretation behavior."},
    {"section": "skills", "requiredSignal": "Natural technical verification category.", "resumeEvidence": "Skills evidence read.", "hiringImpact": "Severity classification plus screening consequence.", "ifTrue": "Observable tool/platform/workflow proof structure tied to visible resume evidence.", "ifNotTrue": "Do-not-claim warning plus named strongest truthful adjacent proof.", "futurePositioning": "Recruiter tooling interpretation behavior."},
    {"section": "experience", "requiredSignal": "Natural delivery ownership category.", "resumeEvidence": "Experience evidence read.", "hiringImpact": "Severity classification plus screening consequence.", "ifTrue": "Observable implementation, evaluation, coordination, or ownership proof structure.", "ifNotTrue": "Do-not-claim warning plus named strongest truthful adjacent proof.", "futurePositioning": "Recruiter delivery/ownership interpretation behavior."}
  ],
  "prioritySection": "summary | skills | experience | education",
  "reasoning": []
}` : `{
  "opening": "One concise recruiter-style sentence about this section.",
  "environment": "${hammerContext.environment.label}",
  "matchAssessment": "Section-specific recruiter read.",
  "signalGaps": ["Most important direct-proof gap in this section."],
  "improvementActions": [{"section": "${section}", "requiredSignal": "Natural recruiter screening category.", "resumeEvidence": "Section evidence read.", "hiringImpact": "Severity classification plus screening consequence.", "ifTrue": "Observable proof structure tied to visible resume evidence.", "ifNotTrue": "Do-not-claim warning plus named strongest truthful adjacent proof.", "futurePositioning": "Recruiter interpretation behavior."}],
  "bulletFixes": [{"original": "", "improved": "", "reason": ""}],
  "summaryFix": {"original": "", "improved": "", "reason": ""},
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
  buildRecruiterScanPrompt,
  buildKeywordLensPrompt,
};
