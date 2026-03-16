// components/profile/ProfileProjects.js
import React, { useState } from 'react';

const ORANGE = '#FF7043';

export default function ProfileProjects({ projects, setProjects }) {
  const empty = { title: '', description: '', url: '' };
  const [draft, setDraft] = useState(empty);
  const [adding, setAdding] = useState(false);

  const add = () => {
    if (!draft.title.trim()) return;
    setProjects((prev) => [...prev, { ...draft }]);
    setDraft(empty);
    setAdding(false);
  };

  const remove = (idx) => {
    setProjects((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {projects.map((p, i) => (
        <div
          key={i}
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(0,0,0,0.09)',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={() => remove(i)}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#D32F2F',
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2A33', marginBottom: 4 }}>
            {p.title}
          </div>

          {p.description && (
            <div style={{ fontSize: 13, color: '#37474F', lineHeight: 1.5, marginBottom: 4 }}>
              {p.description}
            </div>
          )}

          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: ORANGE,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              {p.url}
            </a>
          )}
        </div>
      ))}

      {adding ? (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(255,112,67,0.30)',
            display: 'grid',
            gap: 10,
          }}
        >
          <div className="pe-field">
            <label className="pe-label">Project title</label>
            <input
              className="pe-input"
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder="My awesome project"
              autoFocus
            />
          </div>

          <div className="pe-field">
            <label className="pe-label">Description</label>
            <textarea
              className="pe-textarea"
              value={draft.description}
              onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))}
              placeholder="What did you build? What was the impact?"
              style={{ minHeight: 70 }}
            />
          </div>

          <div className="pe-field">
            <label className="pe-label">URL (optional)</label>
            <input
              className="pe-input"
              type="url"
              value={draft.url}
              onChange={(e) => setDraft((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://..."
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={add}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                background: ORANGE,
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Save project
            </button>

            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft(empty);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: 'transparent',
                color: '#546E7A',
                border: '1px solid rgba(0,0,0,0.12)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          style={{
            padding: '10px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.60)',
            border: '2px dashed rgba(255,112,67,0.30)',
            color: ORANGE,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'center',
            transition: 'all 0.15s',
          }}
        >
          + Add project
        </button>
      )}

      {projects.length === 0 && !adding && (
        <div style={{ fontSize: 12, color: '#546E7A', lineHeight: 1.6, fontWeight: 600 }}>
          Projects show recruiters what you've shipped. Add anything you're proud of —
          side projects, open source contributions, work samples.
        </div>
      )}
    </div>
  );
}
