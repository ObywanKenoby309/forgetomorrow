// components/applications/ApplicationsBoard.js
import React from 'react';
import ApplicationCard from './ApplicationCard';

const STAGES = ["Pinned", "Applied", "Interviewing", "Offers", "Rejected"];

export default function ApplicationsBoard({
  stagesData = { Pinned: [], Applied: [], Interviewing: [], Offers: [], Rejected: [] },
  onAdd, onMove, onEdit, onDelete, onView,
  compact = false,
  columns = 5,
  title = 'Job Application Tracker',
  actions = null, // optional React node (e.g., "+ Add Application" button)
}) {
  const wrapStyle = {
    background: 'white',
    border: '1px solid #eee',
    borderRadius: 12,
    padding: compact ? 12 : 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  };

  const columnStyle = {
    background: 'white',
    borderRadius: 12,
    padding: compact ? 8 : 10,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  };

  return (
    <section style={wrapStyle}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: compact ? 8 : 12,
        }}
      >
        <h2 style={{ color: '#FF7043', margin: 0, fontSize: compact ? '1.05rem' : '1.25rem' }}>
          {title}
        </h2>
        {actions}
      </div>

      {/* Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: compact ? 12 : 20,
        }}
      >
        {STAGES.map((stage) => (
          <div key={stage} style={columnStyle}>
            <div
              style={{
                color: '#FF7043',
                marginTop: 0,
                marginBottom: compact ? 6 : 8,
                fontWeight: 700,
              }}
            >
              {stage}
            </div>

            {(stagesData[stage] || []).length > 0 ? (
              stagesData[stage].map((job) => (
                <ApplicationCard
                  key={job.id}
                  job={job}
                  stage={stage}
                  stages={STAGES}
                  onMove={onMove}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onView={onView}
                  compact={compact}
                />
              ))
            ) : (
              <div style={{ color: '#90A4AE', fontSize: compact ? 12 : 14 }}>No items.</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
