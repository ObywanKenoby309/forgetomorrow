// components/profile/ProfileCertifications.js
import React, { useState } from 'react';

const ORANGE = '#FF7043';

export default function ProfileCertifications({ certifications, setCertifications }) {
  const empty = { name: '', issuer: '', year: '' };
  const [draft, setDraft] = useState(empty);

  const add = () => {
    if (!draft.name.trim()) return;
    setCertifications((prev) => [...prev, { ...draft }]);
    setDraft(empty);
  };

  const remove = (idx) => {
    setCertifications((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {certifications.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {certifications.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                background: 'rgba(255,112,67,0.08)',
                border: '1px solid rgba(255,112,67,0.25)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1F2A33' }}>{c.name}</span>
              {c.issuer && <span style={{ fontSize: 11, color: '#546E7A' }}>· {c.issuer}</span>}
              {c.year && <span style={{ fontSize: 11, color: '#546E7A' }}>· {c.year}</span>}
              <button
                type="button"
                onClick={() => remove(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#D32F2F',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: '0 2px',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 80px auto',
          gap: 8,
          alignItems: 'end',
        }}
      >
        <div className="pe-field">
          <label className="pe-label">Certification name</label>
          <input
            className="pe-input"
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            placeholder="AWS Solutions Architect"
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
        </div>

        <div className="pe-field">
          <label className="pe-label">Issuer</label>
          <input
            className="pe-input"
            value={draft.issuer}
            onChange={(e) => setDraft((p) => ({ ...p, issuer: e.target.value }))}
            placeholder="Amazon"
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
        </div>

        <div className="pe-field">
          <label className="pe-label">Year</label>
          <input
            className="pe-input"
            value={draft.year}
            onChange={(e) => setDraft((p) => ({ ...p, year: e.target.value }))}
            placeholder="2024"
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
        </div>

        <button
          type="button"
          onClick={add}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            background: ORANGE,
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          + Add
        </button>
      </div>

      <div style={{ fontSize: 11, color: '#546E7A', fontWeight: 600 }}>
        Press Enter or click Add. Name, issuer, and year all optional except the name.
      </div>
    </div>
  );
}
