// /lib/forge/riskEngine.js

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

export function classifyRisk({
  signal = '',
  status = '',
  required = true,
}) {
  const s = normalize(signal);
  const st = normalize(status);

  if (!required) {
    return {
      level: 'ignorable',
      reason: `The signal "${signal}" is not required.`,
    };
  }

  if (st === 'missing') {
  const hardRequirementSignals = [
    'active pmp certification',
    'security clearance',
    'licensed',
    'required certification',
    'aws govcloud',
    'icam',
    'identity and access management',
  ];

  const trulyHardRequirement = hardRequirementSignals.some((req) =>
    s.includes(req)
  );

  if (trulyHardRequirement) {
    return {
      level: 'fatal',
      reason: `The role explicitly requires "${signal}" and no supporting evidence exists.`,
    };
  }

  if (
    s.includes('project management') ||
    s.includes('ai') ||
    s.includes('automation') ||
    s.includes('technical leadership') ||
    s.includes('consulting') ||
    s.includes('cloud') ||
    s.includes('evaluation')
  ) {
    return {
      level: 'moderate',
      reason: `The signal "${signal}" lacks direct proof, but adjacent technical evidence may still support recruiter confidence.`,
    };
  }

  return {
    level: 'survivable',
    reason: `The signal "${signal}" is not strongly supported, but this alone is unlikely to determine recruiter outcome.`,
  };
}

  if (st === 'adjacent') {
    return {
      level: 'survivable',
      reason: `There is adjacent evidence for "${signal}", but recruiters may view it as indirect.`,
    };
  }

  return {
    level: 'low',
    reason: `The signal "${signal}" is directly supported.`,
  };
}

export function rankRisks(risks = []) {
  const order = {
    fatal: 4,
    moderate: 3,
    survivable: 2,
    low: 1,
    ignorable: 0,
  };

  return [...risks].sort((a, b) => {
    return (order[b.level] || 0) - (order[a.level] || 0);
  });
}

export default {
  classifyRisk,
  rankRisks,
};
