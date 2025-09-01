import React from 'react';
import { colorFor } from '@/components/seeker/dashboard/seekerColors';

const STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Rejected'];

const stageKey = (stage) => ({
  Pinned: 'neutral',          // or 'brand' if you prefer orange accent
  Applied: 'applied',
  Interviewing: 'interviewing',
  Offers: 'offers',
  Rejected: 'rejected',
}[stage] || 'info');

export default function ResumeTrackerSummary({ trackerData = {} }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        gap: 12,
        background: 'white',
        borderRadius: 12,
        padding: '10px 12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
    >
      {STAGES.map((stage) => {
        const c = colorFor(stageKey(stage));
        const count = Array.isArray(trackerData[stage]) ? trackerData[stage].length : 0;
        return (
          <div
            key={stage}
            style={{
              textAlign: 'center',
              borderRadius: 10,
              padding: '10px 12px',
              background: c.bg,
              color: c.text,
              border: `1px solid ${c.solid}`,
              display: 'grid',
              gap: 4,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 20, lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: 12, opacity: 0.95 }}>{stage}</div>
          </div>
        );
      })}
    </div>
  );
}
