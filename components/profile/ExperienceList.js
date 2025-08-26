// components/profile/ExperienceList.js
import React from 'react';

export default function ExperienceList({ items = [], onAddClick, onDelete }) {
  return (
    <section
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h2 style={{ color: '#FF7043', fontSize: 22, fontWeight: 700, margin: 0 }}>Experience</h2>
        <button
          type="button"
          onClick={onAddClick}
          style={{
            background: 'white',
            color: '#FF7043',
            border: '1px solid #FF7043',
            borderRadius: 10,
            padding: '8px 12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Add experience
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ color: '#607D8B' }}>
          No experience added yet. Click <strong>+ Add experience</strong> to get started.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
          {items.map((exp) => (
            <li
              key={exp.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 10,
                padding: 12,
                background: '#FAFAFA',
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontWeight: 800, color: '#263238' }}>
                  {exp.title || 'Title'} — {exp.company || 'Company'}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete?.(exp.id)}
                  style={{
                    background: 'white',
                    color: '#C62828',
                    border: '1px solid #C62828',
                    borderRadius: 8,
                    padding: '4px 8px',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
              <div style={{ color: '#607D8B', fontSize: 13 }}>
                {(exp.startDate || 'Start')}{exp.endDate ? ` — ${exp.endDate}` : ' — Present'}
              </div>
              {exp.description && (
                <div style={{ color: '#455A64', whiteSpace: 'pre-wrap' }}>{exp.description}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
