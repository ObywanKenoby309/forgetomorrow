import React, { useMemo, useState } from 'react';

const ORANGE = '#FF7043';

export default function ProfileProjects({
  projects = [],
  setProjects,
  editMode = false,
}) {
  const empty = {
    name: '',
    organization: '',
    notes: '',
    startYear: '',
    endYear: '',
    url: '',
  };

  const [draft, setDraft] = useState(empty);

  const normalizedProjects = useMemo(() => {
    if (!Array.isArray(projects)) return [];

    return projects
      .map((p) => {
        if (!p) return null;

        if (typeof p === 'string') {
          return {
            id: `${p}-${Math.random()}`,
            name: p,
            organization: '',
            notes: '',
            startYear: '',
            endYear: '',
            url: '',
          };
        }

        if (typeof p === 'object') {
          return {
            id: p.id || `${Date.now()}-${Math.random()}`,
            name: String(p.name || p.title || '').trim(),
            organization: String(p.organization || p.company || '').trim(),
            notes: String(p.notes || p.description || p.summary || '').trim(),
            startYear: String(p.startYear || '').trim(),
            endYear: String(p.endYear || '').trim(),
            url: String(p.url || p.link || '').trim(),
          };
        }

        return null;
      })
      .filter((p) => p && (p.name || p.organization || p.notes || p.startYear || p.endYear || p.url));
  }, [projects]);

  const canEdit = editMode && typeof setProjects === 'function';

  const addProject = () => {
    const name = draft.name.trim();
    if (!canEdit || !name) return;

    const entry = {
      id: `${Date.now()}`,
      name,
      organization: draft.organization.trim(),
      notes: draft.notes.trim(),
      startYear: draft.startYear.trim(),
      endYear: draft.endYear.trim(),
      url: draft.url.trim(),
    };

    setProjects((prev) => [entry, ...(Array.isArray(prev) ? prev : [])]);
    setDraft(empty);
  };

  const removeProject = (id) => {
    if (!canEdit) return;
    setProjects((prev) =>
      Array.isArray(prev) ? prev.filter((item) => item?.id !== id) : []
    );
  };

  if (!canEdit) {
    if (normalizedProjects.length === 0) {
      return (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(248,244,239,0.35)',
            fontStyle: 'italic',
          }}
        >
          No projects added yet.
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {normalizedProjects.map((p) => {
          const years = [p.startYear, p.endYear].filter(Boolean).join(' – ');
          return (
            <div
              key={p.id}
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
                }}
              >
                {p.name || 'Project'}
              </div>

              {(p.organization || years) && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(248,244,239,0.68)',
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  {[p.organization, years].filter(Boolean).join(' • ')}
                </div>
              )}

              {p.notes && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(248,244,239,0.65)',
                    lineHeight: 1.6,
                    marginTop: 6,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {p.notes}
                </div>
              )}

              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    marginTop: 8,
                    fontSize: 12,
                    color: ORANGE,
                    fontWeight: 700,
                    textDecoration: 'none',
                    wordBreak: 'break-word',
                  }}
                >
                  {p.url}
                </a>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section style={{ display: 'grid', gap: 10 }}>
      {normalizedProjects.length === 0 ? (
        <div
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: 13,
            fontStyle: 'italic',
          }}
        >
          No projects added yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {normalizedProjects.map((p) => {
            const years = [p.startYear, p.endYear].filter(Boolean).join(' – ');
            return (
              <div
                key={p.id}
                style={{
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 12,
                  padding: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 900,
                      color: '#F8F4EF',
                      fontSize: 14,
                    }}
                  >
                    {p.name}
                  </div>

                  {(p.organization || years) && (
                    <div
                      style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.65)',
                        marginTop: 3,
                      }}
                    >
                      {[p.organization, years].filter(Boolean).join(' • ')}
                    </div>
                  )}

                  {p.notes && (
                    <div
                      style={{
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.45)',
                        marginTop: 4,
                        whiteSpace: 'pre-line',
                        lineHeight: 1.55,
                      }}
                    >
                      {p.notes}
                    </div>
                  )}

                  {p.url && (
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
                        wordBreak: 'break-word',
                      }}
                    >
                      {p.url}
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeProject(p.id)}
                  style={{
                    border: '1px solid #C62828',
                    color: '#EF9A9A',
                    background: 'transparent',
                    borderRadius: 999,
                    padding: '6px 10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    height: 'fit-content',
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                  }}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.70)',
            }}
          >
            Name
          </label>
          <input
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Project name"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 10,
              padding: '8px 10px',
              outline: 'none',
              color: '#F8F4EF',
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.70)',
              }}
            >
              Organization
            </label>
            <input
              value={draft.organization}
              onChange={(e) => setDraft((prev) => ({ ...prev, organization: e.target.value }))}
              placeholder="Company / org / client"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 10,
                padding: '8px 10px',
                outline: 'none',
                color: '#F8F4EF',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.70)',
              }}
            >
              URL
            </label>
            <input
              value={draft.url}
              onChange={(e) => setDraft((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://..."
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 10,
                padding: '8px 10px',
                outline: 'none',
                color: '#F8F4EF',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'rgba(255,255,255,0.70)',
            }}
          >
            Notes
          </label>
          <textarea
            value={draft.notes}
            onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="What was built, delivered, improved, or achieved?"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 10,
              padding: '8px 10px',
              outline: 'none',
              color: '#F8F4EF',
              width: '100%',
              minHeight: 78,
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.70)',
              }}
            >
              Start year
            </label>
            <input
              value={draft.startYear}
              onChange={(e) => setDraft((prev) => ({ ...prev, startYear: e.target.value }))}
              placeholder="2018"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 10,
                padding: '8px 10px',
                outline: 'none',
                color: '#F8F4EF',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: 'rgba(255,255,255,0.70)',
              }}
            >
              End year
            </label>
            <input
              value={draft.endYear}
              onChange={(e) => setDraft((prev) => ({ ...prev, endYear: e.target.value }))}
              placeholder="2022"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 10,
                padding: '8px 10px',
                outline: 'none',
                color: '#F8F4EF',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            onClick={addProject}
            style={{
              background: 'transparent',
              color: ORANGE,
              border: `1px solid ${ORANGE}`,
              borderRadius: 999,
              padding: '8px 12px',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Add Project
          </button>
        </div>
      </div>
    </section>
  );
}