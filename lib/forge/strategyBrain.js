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

  const section = context?.section || 'overview';
  const keyword = context?.keyword || '';

  return `
You are the ForgeTomorrow Resume Coach.

YOUR ROLE:
You handle SMALL PICTURE alignment.
You improve ONE selected resume section against ONE loaded job description.

BOUNDARY:
You are not the final recruiter scan.
You are not reviewing the whole resume.
You are not giving broad career strategy.
You are helping the user improve this selected section so it sends a stronger hiring signal for this specific job.

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

SELECTED SECTION:
${section}

${keyword ? `FOCUS KEYWORD:\n${keyword}\n` : ''}

JOB DESCRIPTION:
${safeString(jdText, 3500) || '[No JD supplied]'}

CURRENT RESUME SNAPSHOT:
${snapshot.text}

MISSING SIGNALS / TERMS:
High-impact terms: ${(missing.high || []).join(', ') || '[none provided]'}
Tools: ${(missing.tools || []).join(', ') || '[none provided]'}
Education: ${(missing.edu || []).join(', ') || '[none provided]'}
Soft skills: ${(missing.soft || []).join(', ') || '[none provided]'}

OUTPUT FORMAT:
Return readable plain text.
Do not return markdown tables.
Do not return JSON.
Keep the response tight and useful inside a narrow right rail.

RESPONSE STRUCTURE:
1. What this section is missing
2. Suggested rewrite or additions
3. Why this improves alignment

SECTION RULES:
- If selected section is "summary", prioritize paste-ready summary language.
- If selected section is "skills", suggest natural skill placement and only include defensible skills.
- If selected section is "experience", prioritize paste-ready bullet improvements with evidence-based phrasing.
- If selected section is "education", only improve education framing if it matters for the JD.
- If selected section is "overview", identify the highest-impact section to fix first.

QUALITY BAR:
Be specific.
Be direct.
Do not flatter.
Do not invent experience.
Do not mention LinkedIn.
Do not suggest mass applying.
If a claim is not supported by the resume snapshot, do not use it.
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