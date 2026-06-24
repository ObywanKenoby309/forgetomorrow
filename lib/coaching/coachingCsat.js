lib/coaching/coachingCsat.js

export const COACHING_CSAT_FIELDS = [
  {
    key: 'satisfaction',
    label: 'Overall satisfaction with your coaching',
    shortLabel: 'Satisfaction',
    hint: 'How satisfied were you overall?',
  },
  {
    key: 'communication',
    label: 'Coach communication and responsiveness',
    shortLabel: 'Communication',
    hint: 'Were they easy to reach and responsive?',
  },
  {
    key: 'quality',
    label: 'Quality of guidance provided',
    shortLabel: 'Quality',
    hint: 'Was the coaching advice clear and actionable?',
  },
  {
    key: 'helpfulness',
    label: 'Helpfulness of resources or action steps',
    shortLabel: 'Helpfulness',
    hint: 'Did the resources or exercises help you move forward?',
  },
  {
    key: 'progress',
    label: 'Progress made toward your career goal',
    shortLabel: 'Progress',
    hint: 'How much progress did you feel you made?',
  },
  {
    key: 'recommendation',
    label: 'Likelihood you would recommend this coach',
    shortLabel: 'Recommendation',
    hint: 'Would you refer this coach to someone you care about?',
  },
];

export const COACHING_CSAT_SCORE_KEYS = COACHING_CSAT_FIELDS.map((field) => field.key);

export function getCoachingCsatScore(response) {
  const values = COACHING_CSAT_SCORE_KEYS
    .map((key) => Number(response?.[key]))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

  if (!values.length) return null;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getAverageCoachingCsatScore(responses = []) {
  const scores = responses
    .map((response) => getCoachingCsatScore(response))
    .filter((score) => Number.isFinite(score));

  if (!scores.length) return null;

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}