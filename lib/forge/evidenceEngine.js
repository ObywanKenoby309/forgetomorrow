// /lib/forge/evidenceEngine.js
//
// Universal evidence evaluator.
// Maps resume evidence against the seven universal role structure signals.
// Works for any job — warehouse associate to NASA chief to neurosurgeon to CEO.
// No domain hardcoding. No industry assumptions.

function safe(value) {
  return String(value || '').trim();
}

function normalize(value) {
  return safe(value).toLowerCase();
}

function flattenResume(resume = {}) {
  const summary = safe(resume.summary);

  const skills = Array.isArray(resume.skills)
    ? resume.skills.map((s) => safe(s))
    : [];

  const experiences = Array.isArray(resume.workExperiences)
    ? resume.workExperiences
    : Array.isArray(resume.experiences)
      ? resume.experiences
      : [];

  const education = Array.isArray(resume.educationList)
    ? resume.educationList
    : Array.isArray(resume.education)
      ? resume.education
      : [];

  const certifications = Array.isArray(resume.certifications) ? resume.certifications : [];
  const languages = Array.isArray(resume.languages) ? resume.languages : [];
  const projects = Array.isArray(resume.projects) ? resume.projects : [];
  const volunteerExperiences = Array.isArray(resume.volunteerExperiences)
    ? resume.volunteerExperiences
    : [];
  const achievements = Array.isArray(resume.achievements) ? resume.achievements : [];
  const customSections = Array.isArray(resume.customSections) ? resume.customSections : [];

  const stringifyValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(stringifyValue).filter(Boolean).join(' ');
    if (typeof value === 'object') return Object.values(value).map(stringifyValue).filter(Boolean).join(' ');
    return String(value || '');
  };

  const experienceText = experiences
    .map((exp) => {
      const bullets = Array.isArray(exp.bullets) ? exp.bullets.join(' ') : '';
      return [exp.title, exp.company, bullets].filter(Boolean).join(' ');
    })
    .join(' ');

  const educationText = education
    .map((ed) =>
      [
        ed.degree,
        ed.field,
        ed.program,
        ed.school,
        ed.institution,
        ed.certification,
        ed.name,
      ]
        .filter(Boolean)
        .join(' ')
    )
    .join(' ');

  return normalize(
    [
      resume.personalInfo,
      summary,
      skills.join(' '),
      experienceText,
      educationText,
      certifications.map(stringifyValue).join(' '),
      languages.map(stringifyValue).join(' '),
      projects.map(stringifyValue).join(' '),
      volunteerExperiences.map(stringifyValue).join(' '),
      achievements.map(stringifyValue).join(' '),
      customSections.map(stringifyValue).join(' '),
    ]
      .map(stringifyValue)
      .join(' ')
  );
}

const adjacentPatterns = {
  'ownership and accountability': [
    'owned', 'ownership', 'responsible', 'accountability', 'accountable',
    'managed', 'managing', 'oversaw', 'oversight', 'led', 'leading',
    'drove', 'driving', 'spearheaded', 'directed', 'head of',
    'primary', 'point of contact', 'in charge', 'steward',
    'founded', 'launched', 'established', 'built', 'created',
    'designed', 'developed', 'implemented', 'executed',
    'facilitated', 'coordinated', 'guided', 'supported',
    'overseeing', 'managing the', 'leading the', 'led the',
    'managed the', 'built the', 'owned the', 'drove the',
    'responsible for', 'accountable for', 'serve as', 'served as',
    'act as', 'acted as', 'oversee', 'maintain', 'ensure',
  ],

  'delivery and execution': [
    'delivered', 'delivery', 'executed', 'execution', 'implemented',
    'implementation', 'launched', 'shipped', 'completed', 'produced',
    'operated', 'operations', 'maintained', 'maintenance', 'performed',
    'throughput', 'output', 'results', 'outcomes', 'deployed',
    'ran', 'managed operations', 'day-to-day', 'on-time', 'on time',
  ],

  'people leadership and team management': [
    'managed a team', 'managed consulting', 'managed delivery', 'managed advisory',
    'managed the team', 'team of', 'direct reports', 'supervised', 'supervision',
    'coached', 'coaching', 'coached consultants', 'mentored', 'mentoring',
    'staffed', 'staffing', 'hired', 'hiring', 'performance management',
    'developed the team', 'built the team', 'grew the team',
    'team lead', 'team leader', 'team leadership', 'leading the team',
    'workforce', 'crew', 'personnel', 'staff', 'headcount',
    'onboarding', 'training', 'developing people',
    'skills development', 'consulting team', 'advisory team',
    'delivery team', 'practice operations', 'managing consultants',
  ],

  'advisory and client service delivery': [
    'advised', 'advisory', 'consulted', 'consulting', 'consultant',
    'trusted advisor', 'client', 'customer', 'patient', 'user',
    'service', 'client-facing', 'customer-facing', 'patient-facing',
    'supported', 'helped', 'assisted', 'guided', 'guidance',
    'engagement', 'relationship', 'account management', 'serving',
    'recommendations', 'strategic recommendations', 'advisory services',
  ],

  'stakeholder and executive engagement': [
    'stakeholder', 'executive', 'senior leadership', 'senior management',
    'c-suite', 'board', 'cross-functional', 'collaborated', 'coordination',
    'aligned', 'alignment', 'escalation', 'escalated', 'communicated',
    'communication', 'presented', 'presentation', 'briefed', 'briefing',
    'reported to', 'reporting', 'interfaced', 'partnered', 'worked with leadership',
    'executive communication', 'executive reporting', 'workshops',
  ],

  'process and methodology development': [
    'methodology', 'methodologies', 'process', 'processes', 'procedure',
    'procedures', 'standard', 'standards', 'framework', 'playbook',
    'template', 'templates', 'repeatable', 'scalable', 'protocol',
    'policy', 'compliance', 'quality', 'qa', 'quality assurance',
    'audit', 'workflow', 'built the process', 'established', 'created',
    'developed the process', 'standardized', 'operationalized',
    'delivery standards', 'practice operations', 'tools and methodology',
  ],

  'domain knowledge and qualification': [
    'expertise', 'expert', 'specialist', 'proficiency', 'proficient',
    'certified', 'certification', 'licensed', 'degree', 'education',
    'trained', 'training', 'background in', 'knowledge of',
    'years of experience', 'proven track record', 'subject matter',
    'sme', 'qualified', 'credentialed', 'experienced in',
  ],

  'education and credential credibility': [
    'bachelor', 'master', 'mba', 'phd', 'doctorate', 'associate',
    'degree', 'education', 'university', 'college', 'certified',
    'certification', 'licensed', 'credential', 'trained',
    'information systems', 'computer science', 'engineering',
    'business administration', 'management', 'sciences',
    'professional development', 'continuing education',
  ],
};

const technicalTerms = [
  // Engineering / technical
  'platform', 'architecture', 'systems', 'api', 'integration', 'implementation',
  'technical', 'ai', 'automation', 'workflow', 'delivery', 'evaluation',
  'cloud', 'security', 'governance', 'risk', 'data', 'engineering',
  'software', 'infrastructure', 'network', 'database', 'analytics',
  'clinical', 'medical', 'scientific', 'research', 'regulatory',
  'financial', 'accounting', 'legal', 'compliance', 'audit',
  'operations', 'logistics', 'supply chain', 'manufacturing',
  // Service / delivery / leadership domain
  // These are the capability vocabulary for CS Ops, Account Ops, Service Delivery,
  // Client Services, and all adjacent leadership titles.
  // Without these, high-evidence service leadership signals grade as plain "adjacent"
  // instead of "adjacent_technical", causing the AI to underrate demonstrated capability.
  'customer success', 'client success', 'account management', 'service delivery',
  'client services', 'account operations', 'customer operations', 'success operations',
  'retention', 'escalation', 'onboarding', 'sla', 'kpi', 'nps', 'csat',
  'renewal', 'expansion', 'churn', 'adoption', 'health score',
  'enterprise', 'strategic account', 'portfolio', 'client portfolio',
  'service level', 'service management', 'service model', 'service strategy',
  'managed services', 'professional services', 'consulting services',
  'workforce planning', 'staffing model', 'capacity planning',
  'operational reporting', 'performance reporting', 'dashboard',
  'process improvement', 'operational excellence', 'continuous improvement',
  'cross-functional', 'stakeholder management', 'executive reporting',
  'team leadership', 'people management', 'direct reports', 'hybrid team',
  'offshore', 'onshore', 'distributed team', 'remote team',
];

function getPatternsForSignal(signal) {
  const normalizedSignal = normalize(signal);

  if (adjacentPatterns[normalizedSignal]) {
    return adjacentPatterns[normalizedSignal];
  }

  const dynamicPatterns = [];

  Object.entries(adjacentPatterns).forEach(([key, patterns]) => {
    const keyWords = key.split(/\s+/).filter((w) => w.length > 4);
    const signalWords = normalizedSignal.split(/\s+/).filter((w) => w.length > 4);

    const overlap = keyWords.some((kw) =>
      signalWords.some((sw) => kw.includes(sw) || sw.includes(kw))
    );

    if (overlap || normalizedSignal.includes(key) || key.includes(normalizedSignal)) {
      dynamicPatterns.push(...patterns);
    }
  });

  return Array.from(new Set(dynamicPatterns));
}

export function evaluateSignal(signal, resume = {}) {
  const source = flattenResume(resume);
  const normalizedSignal = normalize(signal);

  if (!normalizedSignal) {
    return { signal, status: 'missing', confidence: 'low', evidence: '' };
  }

  if (source.includes(normalizedSignal)) {
    return {
      signal,
      status: 'direct',
      confidence: 'high',
      evidence: `Direct evidence for "${signal}" exists in the resume.`,
    };
  }

  const patterns = getPatternsForSignal(normalizedSignal);
  const matched = patterns.filter((p) => source.includes(normalize(p)));

  if (matched.length) {
    const technicalMatches = matched.filter((m) =>
      technicalTerms.some((term) => normalize(m).includes(term))
    );

    const status =
      technicalMatches.length >= 2 || matched.length >= 3
        ? 'adjacent_technical'
        : 'adjacent';

    const confidence =
      technicalMatches.length >= 2 || matched.length >= 3
        ? 'high'
        : 'medium';

    return {
      signal,
      status,
      confidence,
      evidence:
        status === 'adjacent_technical'
          ? `Strong adjacent evidence detected: ${matched.slice(0, 5).join(', ')}.`
          : `Adjacent evidence detected: ${matched.slice(0, 5).join(', ')}.`,
    };
  }

  return {
    signal,
    status: 'missing',
    confidence: 'high',
    evidence: `No visible proof for "${signal}" detected in the resume.`,
  };
}

export function evaluateSignals(signals = [], resume = {}) {
  return signals.map((signal) => evaluateSignal(signal, resume));
}

export default {
  evaluateSignal,
  evaluateSignals,
};