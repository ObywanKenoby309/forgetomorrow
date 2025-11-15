// lib/bulk/match-score.js
'use client';

export function generateMatchReport(results) {
  const headers = ['Job', 'Match Score (%)', 'Notes'];
  const rows = results.map(r => [
    r.base,
    r.score,
    r.score >= 90 ? 'Strong Match' : r.score >= 70 ? 'Good Fit' : 'Needs Work'
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csv;
}