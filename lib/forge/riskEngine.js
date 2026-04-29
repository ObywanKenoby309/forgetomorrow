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

  const hardRequirementSignals = [
    'active pmp certification',
    'pmp certification',
    'security clearance',
    'public trust',
    'licensed',
    'license required',
    'required certification',
    'must be certified',
    'must be a us citizen',
    'us citizen',
    'bachelor required',
    'degree required',
    'aws govcloud',
    'icam',
    'identity and access management',
  ];

  const trulyHardRequirement = hardRequirementSignals.some((req) =>
    s.includes(req)
  );

  if (st === 'missing') {
    if (trulyHardRequirement) {
      return {
        level: 'fatal',
        reason: `The role explicitly requires "${signal}" and no supporting evidence exists.`,
      };
    }

    return {
      level: 'survivable',
      reason: `The signal "${signal}" lacks direct proof, but it is not automatically disqualifying unless the job description makes it a hard requirement.`,
    };
  }

  if (st === 'adjacent') {
    return {
      level: 'survivable',
      reason: `There is adjacent evidence for "${signal}", but recruiters may want clearer proof.`,
    };
  }

  if (st === 'adjacent_technical') {
    return {
      level: 'low',
      reason: `Strong adjacent technical evidence supports "${signal}", though the resume may still benefit from clearer wording.`,
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
