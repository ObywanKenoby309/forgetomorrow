// /lib/forge/riskEngine.js
//
// Universal risk classifier.
// Works for ANY role type — advisory, technical, consulting, creative, operations, etc.
// Risk level is determined by evidence quality and whether the JD makes the signal a hard requirement.
// Does NOT hardcode role-specific assumptions.

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

// Hard credential signals — only things that are universally disqualifying when missing.
// These are explicit, non-negotiable requirements that cannot be substituted with adjacent proof.
const HARD_CREDENTIAL_TERMS = [
  'security clearance',
  'top secret',
  'ts/sci',
  'public trust',
  'must be a us citizen',
  'us citizen required',
  'must be certified',
  'pmp required',
  'required certification',
  'licensed',
  'license required',
  'must have a degree',
  'degree required',
  'bachelor required',
  'master required',
  'phd required',
  'bar admission',
  'cpa required',
  'aws govcloud',
  'icam',
];

function isHardCredential(signal) {
  const s = normalize(signal);
  return HARD_CREDENTIAL_TERMS.some((term) => s.includes(term));
}

export function classifyRisk({
  signal = '',
  status = '',
  required = true,
}) {
  const st = normalize(status);

  // Not required — ignore entirely
  if (!required) {
    return {
      level: 'ignorable',
      reason: `"${signal}" is not required for this role.`,
    };
  }

  // Direct evidence — low risk regardless of signal type
  if (st === 'direct') {
    return {
      level: 'low',
      reason: `"${signal}" is directly supported by visible resume evidence.`,
    };
  }

  // Strong adjacent technical evidence — low risk, just needs clearer wording
  if (st === 'adjacent_technical') {
    return {
      level: 'low',
      reason: `Strong adjacent evidence supports "${signal}". The resume may benefit from clearer positioning but this is unlikely to cause rejection.`,
    };
  }

  // Adjacent evidence — survivable, not fatal
  if (st === 'adjacent') {
    return {
      level: 'survivable',
      reason: `Adjacent evidence exists for "${signal}" but direct proof is not visible. Recruiters may want clearer positioning.`,
    };
  }

  // Missing signal — only fatal if it's a hard credential requirement
  if (st === 'missing') {
    if (isHardCredential(signal)) {
      return {
        level: 'fatal',
        reason: `"${signal}" is a hard credential requirement with no visible proof. This is likely a disqualifier.`,
      };
    }

    // Missing but not a hard credential — survivable as default.
    // The AI layer determines actual severity in context of the full JD and resume.
    return {
      level: 'survivable',
      reason: `No direct proof for "${signal}" is visible. Screening risk depends on how central this signal is to the role.`,
    };
  }

  // Default fallback
  return {
    level: 'low',
    reason: `"${signal}" has sufficient visible support.`,
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