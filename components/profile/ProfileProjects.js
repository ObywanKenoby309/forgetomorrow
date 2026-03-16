import React, { useState } from 'react';

const ORANGE = '#FF7043';

export default function ProfileProjects({
  projects = [],
  setProjects,
  editMode = false,
}) {
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

  if (!editMode) {
    if (!projects.length) {
      return (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(248,244,239,0.35)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}
        >
          No projects added yet.
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {projects.map((p, i) => (
          <div
            key={i}
            style={{
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 12,
              padding: 12,
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <div
              style={{
                fontWeight: 900,
                fontSize: 14,
                color: '#F8F4EF',
                marginBottom: p.description || p.url ? 4 : 0,
              }}
            >
              {p.title}
            </div>

            {p.description ? (
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(248,244,239,0.72)',
                  lineHeight: 1.55,
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
                  wordBreak: 'break-all',
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
      {projects.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {projects.map((p, i) => (
            <div
              key={i}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10,
                padding: 14,
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
                  background: 'rgba(211,47,47,0.15)',
                  border: '1px solid rgba(211,47,47,0.30)',
                  color: '#EF9A9A',
                  borderRadius: 6,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Remove
              </button>

              <div
                style={{
                  color: '#F8F4EF',
                  fontWeight: 700,
                  fontSize: 14,
                  paddingRight: 72,
                }}
              >
                {p.title}
              </div>

              {p.description ? (
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.60)',
                    marginTop: 4,
                    lineHeight: 1.55,
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
                    display: 'inline-block',
                    marginTop: 6,
                    fontSize: 12,
                    color: ORANGE,
                    fontWeight: 700,
                    textDecoration: 'none',
                    wordBreak: 'break-all',
                  }}
                >
                  {p.url}
                </a>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 10,
            padding: 14,
            display: 'grid',
            gap: 10,
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              Project title
            </label>
            <input
              value={draft.title}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder="My awesome project"
              autoFocus
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 8,
                color: '#F8F4EF',
                fontFamily: 'inherit',
                fontSize: 14,
                outline: 'none',
                padding: '9px 12px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              Description
            </label>
            <textarea
              value={draft.description}
              onChange={(e) =>
                setDraft((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="What did you build? What was the impact?"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 8,
                color: '#F8F4EF',
                fontFamily: 'inherit',
                fontSize: 14,
                lineHeight: 1.6,
                outline: 'none',
                padding: '10px 12px',
                width: '100%',
                minHeight: 84,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              URL
            </label>
            <input
              type="url"
              value={draft.url}
              onChange={(e) => setDraft((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://..."
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 8,
                color: '#F8F4EF',
                fontFamily: 'inherit',
                fontSize: 14,
                outline: 'none',
                padding: '9px 12px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
            <button
              type="button"
              onClick={add}
              style={{
                background: 'white',
                color: ORANGE,
                border: `1px solid ${ORANGE}`,
                borderRadius: 10,
                padding: '8px 12px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              + Add Project
            </button>

            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft(empty);
              }}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.60)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 10,
                padding: '8px 12px',
                fontWeight: 800,
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
            background: 'white',
            color: ORANGE,
            border: `1px solid ${ORANGE}`,
            borderRadius: 10,
            padding: '8px 12px',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
            justifySelf: 'start',
          }}
        >
          + Add Project
        </button>
      )}

      {projects.length === 0 && !adding && (
        <div
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.35)',
            lineHeight: 1.6,
            fontWeight: 600,
          }}
        >
          Projects show recruiters what you&apos;ve shipped. Add side projects,
          work samples, open source, or anything you&apos;re proud of.
        </div>
      )}
    </div>
  );
}