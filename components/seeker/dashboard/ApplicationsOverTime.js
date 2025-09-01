import React from 'react';
import { seekerStageColors } from '@/components/seeker/dashboard/seekerColors';

/**
 * weeks: [{ label:'W8', applied:number, interviews:number }, ... 'W1']
 * withChrome: (path)=>string to preserve ?chrome=...
 */
export default function ApplicationsOverTime({ weeks = [], withChrome = (p) => p }) {
  const cApplied = seekerStageColors.applied;
  const cInterv  = seekerStageColors.interviewing;

  if (!Array.isArray(weeks) || weeks.length === 0) {
    return (
      <div
        style={{
          border: '1px solid #e6e9ef',
          borderRadius: 10,
          padding: 12,
          color: '#607D8B',
          background: '#FAFBFC',
        }}
      >
        No activity in the last few weeks yet. When you add applications or get interviews,
        they’ll show up here.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {weeks.map((w) => (
        <div
          key={w.label}
          style={{
            border: '1px solid #e6e9ef',
            borderRadius: 10,
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'white',
          }}
        >
          <strong style={{ color: '#263238' }}>{w.label}</strong>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <a
              href={withChrome('/seeker/applications')}
              style={{
                textDecoration: 'none',
                background: cApplied.bg,
                color: cApplied.text,
                border: `1px solid ${cApplied.solid}`,
                padding: '4px 10px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 12,
              }}
              title="View applied roles"
            >
              Applied: {w.applied}
            </a>

            <a
              href={withChrome('/seeker/applications')}
              style={{
                textDecoration: 'none',
                background: cInterv.bg,
                color: cInterv.text,
                border: `1px solid ${cInterv.solid}`,
                padding: '4px 10px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 12,
              }}
              title="View interviews"
            >
              Interviews: {w.interviews}
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
