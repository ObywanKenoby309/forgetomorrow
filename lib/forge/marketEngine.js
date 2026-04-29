// /lib/forge/marketEngine.js

function normalize(value) {
  return String(value || '').toLowerCase();
}

export function compareAgainstMarket({
  targetRole = '',
  signals = [],
}) {
  const role = normalize(targetRole);

  const insights = [];

  const directSignals = signals.filter((s) => s.status === 'direct');
  const missingSignals = signals.filter((s) => s.status === 'missing');

  if (role.includes('project')) {
    if (missingSignals.some((s) => normalize(s.signal).includes('project'))) {
      insights.push({
        severity: 'high',
        insight:
          'Competing candidates will likely have direct project delivery evidence and tooling visibility.',
      });
    }

    if (directSignals.length >= 3) {
      insights.push({
        severity: 'medium',
        insight:
          'The resume demonstrates enough direct alignment to remain competitive in recruiter screening.',
      });
    }
  }

  if (!insights.length) {
    insights.push({
      severity: 'low',
      insight:
        'No major competitive market risks detected from the current signal set.',
    });
  }

  return insights;
}

export default {
  compareAgainstMarket,
};
