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
    if (
      s.includes('project management') ||
      s.includes('ai') ||
      s.includes('automation') ||
      s.includes('technical leadership')
    ) {
      return {
        level: 'fatal',
        reason: `The role explicitly requires "${signal}" but no direct evidence exists.`,
      };
    }

    return {
      level: 'moderate',
      reason: `The signal "${signal}" is missing and may weaken screening confidence.`,
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
