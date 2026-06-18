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
  <div
    style={{
      display: 'grid',
      gap: 0,
    }}
  >
    {/* Header */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 1fr',
        alignItems: 'center',
        padding: '0 8px 8px 8px',
        borderBottom: '1px solid rgba(15,23,42,0.08)',
        marginBottom: 2,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#64748B',
          textTransform: 'uppercase',
        }}
      >
        Week
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: cApplied.text,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        Applied
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: cInterv.text,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        Interviews
      </div>
    </div>

    {weeks.map((w) => (
      <a
        key={w.label}
        href={withChrome('/seeker/applications')}
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 1fr',
          alignItems: 'center',
          padding: '10px 8px',
          textDecoration: 'none',
          borderBottom: '1px solid rgba(15,23,42,0.06)',
          transition: 'background 150ms ease',
        }}
      >
        <div
          style={{
            fontWeight: 800,
            color: '#334155',
          }}
        >
          {w.label}
        </div>

        <div
          style={{
            textAlign: 'center',
            fontWeight: 800,
            color: cApplied.text,
          }}
        >
          {w.applied}
        </div>

        <div
          style={{
            textAlign: 'center',
            fontWeight: 800,
            color: cInterv.text,
          }}
        >
          {w.interviews}
        </div>
      </a>
    ))}
  </div>
);
}