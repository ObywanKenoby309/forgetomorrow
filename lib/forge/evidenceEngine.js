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

  const experienceText = experiences
    .map((exp) => {
      const bullets = Array.isArray(exp.bullets) ? exp.bullets.join(' ') : '';
      return [
        exp.title,
        exp.company,
        bullets,
      ].filter(Boolean).join(' ');
    })
    .join(' ');

  return normalize([
    summary,
    skills.join(' '),
    experienceText,
  ].join(' '));
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

  const adjacentPatterns = {
    'project management': ['operations', 'delivery', 'coordination', 'implementation'],
    'technical leadership': ['platform', 'systems', 'implementation', 'technical'],
    'ai/llm': ['automation', 'workflow', 'platform'],
    'workflow automation': ['process improvement', 'implementation', 'operations'],
  };

  const patterns = adjacentPatterns[normalizedSignal] || [];

  const matched = patterns.filter((p) => source.includes(normalize(p)));

  if (matched.length) {
    return {
      signal,
      status: 'adjacent',
      confidence: 'medium',
      evidence: `Adjacent evidence detected through: ${matched.join(', ')}.`,
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
