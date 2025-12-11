// components/applications/ApplicationsBoard.js
import React from 'react';
import ApplicationCard from './ApplicationCard';
import { colorFor } from '@/components/seeker/dashboard/seekerColors';

const STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Closed Out'];

const stageKey = (stage) =>
  ({
    Pinned: 'neutral',
    Applied: 'applied',
    Interviewing: 'interviewing',
    Offers: 'offers',
    'Closed Out': 'info',
  }[stage] || 'neutral');

export default function ApplicationsBoard({
  stagesData = {
    Pinned: [],
    Applied: [],
    Interviewing: [],
    Offers: [],
    'Closed Out': [],
  },
  onAdd,
  onMove,
  onEdit,
  onDelete,
  onView,
  compact = false,
  columns = 5,
  title = 'Job Application Tracker',
  actions = null,
  leftActions = null,
}) {
  const wrapStyle = {
    background: 'white',
    border: '1px solid #eee',
    borderRadius: 12,
    padding: compact ? 12 : 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    width: '100%',
    boxSizing: 'border-box',
  };

  const columnStyle = {
    background: 'white',
    borderRadius: 12,
    padding: compact ? 8 : 10,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  };

  const gridTemplateColumns =
    columns === 'auto'
      ? 'repeat(auto-fit, minmax(220px, 1fr))'
      : `repeat(${columns}, minmax(0, 1fr))`;

  return (
    <section style={wrapStyle}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: compact ? 8 : 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: '1 1 auto',
            minWidth: 240,
          }}
        >
          <h2
            style={{
              color: '#FF7043',
              margin: 0,
              fontSize: compact ? '1.05rem' : '1.25rem',
            }}
          >
            {title}
          </h2>
          {leftActions}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {actions}
        </div>
      </div>

      {/* Board */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns,
          gap: compact ? 12 : 20,
          width: '100%',
        }}
      >
        {STAGES.map((stage) => {
          const c = colorFor(stageKey(stage));
          const items = stagesData[stage] || [];
          return (
            <div key={stage} style={columnStyle}>
              {/* Color-coded header pill with live count */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: c.bg,
                  color: c.text,
                  border: `1px solid ${c.solid}`,
                  marginBottom: compact ? 6 : 8,
                  fontWeight: 700,
                }}
              >
                <span>{stage}</span>
                <span style={{ fontWeight: 900 }}>{items.length}</span>
              </div>

              {items.length > 0 ? (
                items.map((job) => (
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
                <div
                  style={{
                    color: '#90A4AE',
                    fontSize: compact ? 12 : 14,
                  }}
                >
                  No items.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
