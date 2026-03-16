// components/profile/ProfileProjects.js
import React, { useMemo, useState } from 'react';

const ORANGE = '#FF7043';

export default function ProfileProjects({
  projects = [],
  setProjects,
  readOnly = false,
}) {
  const empty = { title: '', description: '', url: '' };
  const [draft, setDraft] = useState(empty);
  const [adding, setAdding] = useState(false);

  const normalizedProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];

    return projects
      .map((p) => {
        if (!p) return null;

        if (typeof p === 'string') {
          return {
            title: p,
            description: '',
            url: '',
          };
        }

        if (typeof p === 'object') {
          return {
            title: String(p.title || p.name || '').trim(),
            description: String(p.description || p.summary || '').trim(),
            url: String(p.url || p.link || '').trim(),
          };
        }

        return null;
      })
      .filter((p) => p && (p.title || p.description || p.url));
  }, [projects]);

  const canEdit = !readOnly && typeof setProjects === 'function';

  const add = () => {
    if (!canEdit) return;
    if (!draft.title.trim()) return;

    setProjects((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        title: draft.title.trim(),
        description: draft.description.trim(),
        url: draft.url.trim(),
      },
    ]);

    setDraft(empty);
    setAdding(false);
  };

  const remove = (idx) => {
    if (!canEdit) return;
    setProjects((prev) => (Array.isArray(prev) ? prev.filter((_, i) => i !== idx) : []));
  };

  if (!canEdit) {
    if (normalizedProjects.length === 0) {
      return (
        <div style={{ fontSize: 13, color: 'rgba(248,244,239,0.35)', fontStyle: 'italic' }}>
          No projects added yet.
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {normalizedProjects.map((p, i) => (
          <div
            key={`${p.title}-${i}`}
            style={{
              position: 'relative',
              padding: '16px 14px 16px 18px',
              borderRadius: 14,
              background: 'rgba(13,27,42,0.66)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 14,
                bottom: 14,
                width: 3,
                background: 'linear-gradient(to bottom, #FF7043, #FF5722)',
                borderRadius: '0 2px 2px 0',
              }}
            />
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 14,
                fontWeight: 700,
                color: '#F8F4EF',
                marginBottom: p.description || p.url ? 4 : 0,
              }}
            >
              {p.title || 'Project'}
            </div>

            {p.description ? (
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(248,244,239,0.65)',
                  lineHeight: 1.6,
                  marginBottom: p.url ? 6 : 0,
                }}
              >
                {p.description}
              </div>
            ) : null}

            {p.url ? (
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: ORANGE,
                  fontWeight: 700,
                  textDecoration: 'none',
                  wordBreak: 'break-word',
                }}
              >
                {p.url}
              </a>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {normalizedProjects.map((p, i) => (
        <div
          key={`${p.title}-${i}`}
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

          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#1F2A33',
              marginBottom: p.description || p.url ? 4 : 0,
              paddingRight: 20,
            }}
          >
            {p.title}
          </div>

          {p.description ? (
            <div
              style={{
                fontSize: 13,
                color: '#37474F',
                lineHeight: 1.5,
                marginBottom: p.url ? 4 : 0,
              }}
            >
              {p.description}
            </div>
          ) : null}

          {p.url ? (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                color: ORANGE,
                fontWeight: 700,
                textDecoration: 'none',
                wordBreak: 'break-word',
              }}
            >
              {p.url}
            </a>
          ) : null}
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
              onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="My awesome project"
              autoFocus
            />
          </div>

          <div className="pe-field">
            <label className="pe-label">Description</label>
            <textarea
              className="pe-textarea"
              value={draft.description}
              onChange={(e) => setDraft((prev) => ({ ...prev, description: e.target.value }))}
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
              onChange={(e) => setDraft((prev) => ({ ...prev, url: e.target.value }))}
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

      {normalizedProjects.length === 0 && !adding && (
        <div style={{ fontSize: 12, color: '#546E7A', lineHeight: 1.6, fontWeight: 600 }}>
          Projects show recruiters what you&apos;ve shipped. Add anything you&apos;re proud of —
          side projects, open source contributions, work samples.
        </div>
      )}
    </div>
  );
}