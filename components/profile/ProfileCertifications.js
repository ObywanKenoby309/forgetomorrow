import React, { useState } from 'react';

const ORANGE = '#FF7043';

export default function ProfileCertifications({
  certifications = [],
  setCertifications,
  editMode = false,
}) {
  const empty = { name: '', issuer: '', year: '' };
  const [draft, setDraft] = useState(empty);

  const add = () => {
    if (!draft.name.trim()) return;
    const entry = {
      id: `${Date.now()}`,
      name: draft.name.trim(),
      issuer: draft.issuer.trim(),
      year: draft.year.trim(),
    };
    setCertifications((prev) => [entry, ...(Array.isArray(prev) ? prev : [])]);
    setDraft(empty);
  };

  const remove = (targetId, idx) => {
    setCertifications((prev) =>
      Array.isArray(prev)
        ? prev.filter((c, i) => (c?.id ? c.id !== targetId : i !== idx))
        : []
    );
  };

  if (!editMode) {
    if (!certifications.length) {
      return (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(248,244,239,0.35)',
            fontStyle: 'italic',
          }}
        >
          No certifications added yet.
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 10 }}>
        {certifications.map((c, i) => (
          <div
            key={c?.id || i}
            style={{
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 12,
              padding: 12,
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ fontWeight: 900, color: '#F8F4EF' }}>
              {c.name}
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'rgba(248,244,239,0.68)',
                marginTop: 3,
              }}
            >
              {[c.issuer, c.year].filter(Boolean).join(' • ')}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section
      style={{
        display: 'grid',
        gap: 12,
      }}
    >
      {certifications.length === 0 ? (
        <div
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: 13,
            fontStyle: 'italic',
          }}
        >
          No certifications added yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {certifications.map((c, i) => (
            <div
              key={c?.id || i}
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
                  {c.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.65)',
                    marginTop: 3,
                  }}
                >
                  {[c.issuer].filter(Boolean).join('')}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.38)',
                    marginTop: 2,
                  }}
                >
                  {c.year || ''}
                </div>
              </div>

              <button
                type="button"
                onClick={() => remove(c?.id, i)}
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
          ))}
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
            Certification Name
          </label>
          <input
            value={draft.name}
            onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
            placeholder="AWS Solutions Architect"
            onKeyDown={(e) => e.key === 'Enter' && add()}
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
              Issuer
            </label>
            <input
              value={draft.issuer}
              onChange={(e) =>
                setDraft((p) => ({ ...p, issuer: e.target.value }))
              }
              placeholder="Amazon"
              onKeyDown={(e) => e.key === 'Enter' && add()}
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
              Year
            </label>
            <input
              value={draft.year}
              onChange={(e) => setDraft((p) => ({ ...p, year: e.target.value }))}
              placeholder="2024"
              onKeyDown={(e) => e.key === 'Enter' && add()}
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

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
            + Add
          </button>
        </div>
      </div>
    </section>
  );
}