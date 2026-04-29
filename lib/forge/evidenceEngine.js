// /lib/forge/evidenceEngine.js

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

  const experienceText = experiences
    .map((exp) => {
      const bullets = Array.isArray(exp.bullets) ? exp.bullets.join(' ') : '';
      return [exp.title, exp.company, bullets].filter(Boolean).join(' ');
    })
    .join(' ');

  const educationText = education
    .map((ed) => {
      return [
        ed.degree,
        ed.field,
        ed.program,
        ed.school,
        ed.institution,
        ed.certification,
        ed.name,
      ].filter(Boolean).join(' ');
    })
    .join(' ');

  return normalize([
    summary,
    skills.join(' '),
    experienceText,
    educationText,
  ].join(' '));
}

const adjacentPatterns = {
  'project management': [
    'project',
    'delivery',
    'coordination',
    'implementation',
    'planning',
    'execution',
    'risk management',
    'reporting',
    'stakeholder',
    'timeline',
    'milestone',
  ],

  'technical leadership': [
    'technical',
    'platform',
    'systems',
    'architecture',
    'implementation',
    'engineering',
    'api',
    'integration',
    'delivery',
    'cross-functional',
  ],

  'ai/llm': [
    'ai',
    'automation',
    'workflow',
    'model',
    'output',
    'evaluation',
    'responsible automation',
    'explainable ai',
    'data-driven',
  ],

  'workflow automation': [
    'workflow',
    'automation',
    'process improvement',
    'implementation',
    'operations',
    'repeatable',
    'standardized',
    'templates',
    'delivery standards',
  ],

  'stakeholder coordination': [
    'stakeholder',
    'executive stakeholder',
    'executive communication',
    'client',
    'customer',
    'cross-functional',
    'coordination',
    'communication',
    'executive reporting',
    'workshops',
    'escalation',
    'engagement coordination',
    'client-facing',
    'senior management',
  ],

  'agile delivery': [
    'agile',
    'scrum',
    'kanban',
    'sprint',
    'backlog',
    'delivery',
    'iteration',
    'planning',
    'retrospective',
    'standup',
    'velocity',
  ],

  'technical consulting workflow evaluation': [
    'consulting',
    'consultant',
    'advisory',
    'strategic advisory',
    'client-facing',
    'engagement',
    'methodology',
    'methodologies',
    'delivery standards',
    'practice processes',
    'advisory templates',
    'customer-facing',
    'executive workshops',
    'strategic recommendations',
    'maturity assessments',
  ],

  'cloud / enterprise architecture evaluation': [
    'enterprise',
    'architecture',
    'platform',
    'systems',
    'security standards',
    'governance',
    'risk posture',
    'security program maturity',
    'operational readiness',
    'technical workflows',
    'implementation planning',
    'security readiness',
  ],

  'ai output evaluation': [
    'ai',
    'output',
    'evaluation',
    'accuracy',
    'quality',
    'review',
    'annotating',
    'data',
    'structured evaluation',
    'model',
    'explainable ai',
  ],

  'cybersecurity advisory delivery': [
    'cybersecurity advisory',
    'security advisory',
    'security program maturity',
    'governance strategy',
    'cyber risk',
    'risk mitigation',
    'breach readiness',
    'security posture',
    'operational security',
    'strategic security',
    'advisory engagements',
    'security operations',
  ],
};

const technicalTerms = [
  'platform',
  'architecture',
  'systems',
  'api',
  'integration',
  'implementation',
  'technical',
  'ai',
  'automation',
  'workflow',
  'delivery',
  'evaluation',
  'cloud',
  'security',
  'governance',
  'risk',
  'data',
];

function getPatternsForSignal(signal) {
  const normalizedSignal = normalize(signal);

  if (adjacentPatterns[normalizedSignal]) {
    return adjacentPatterns[normalizedSignal];
  }

  const dynamicPatterns = [];

  Object.entries(adjacentPatterns).forEach(([key, patterns]) => {
    if (
      normalizedSignal.includes(key) ||
      key.includes(normalizedSignal) ||
      normalizedSignal.split(/\s+/).some((word) => word.length > 4 && key.includes(word))
    ) {
      dynamicPatterns.push(...patterns);
    }
  });

  return Array.from(new Set(dynamicPatterns));
}

export function evaluateSignal(signal, resume = {}) {
  const source = flattenResume(resume);
  const normalizedSignal = normalize(signal);

  if (!normalizedSignal) {
    return {
      signal,
      status: 'missing',
      confidence: 'low',
      evidence: '',
    };
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
          ? `Strong adjacent technical evidence detected through: ${matched.join(', ')}.`
          : `Adjacent evidence detected through: ${matched.join(', ')}.`,
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