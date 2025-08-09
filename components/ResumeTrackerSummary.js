// components/ResumeTrackerSummary.js
import React from 'react';

const STAGES = ["Pinned", "Applied", "Interviewing", "Offers", "Rejected"];

export default function ResumeTrackerSummary({ trackerData }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '20px',
        background: 'white',
        borderRadius: '12px',
        padding: '10px 20px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      }}
    >
      {STAGES.map((stage) => (
        <div key={stage} style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.2em', color: '#FF7043' }}>
            {trackerData[stage] ? trackerData[stage].length : 0}
          </div>
          <div style={{ fontSize: '0.9em', color: '#455A64' }}>{stage}</div>
        </div>
      ))}
    </div>
  );
}
