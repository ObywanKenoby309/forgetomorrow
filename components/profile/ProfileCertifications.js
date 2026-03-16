import React, { useMemo, useState } from 'react';

const ORANGE = '#FF7043';

export default function ProfileCertifications({
  certifications = [],
  setCertifications,
  editMode = false,
}) {
  const empty = {
    name: '',
    issuer: '',
    notes: '',
    year: '',
  };

  const [draft, setDraft] = useState(empty);

  const normalizedCertifications = useMemo(() => {
    if (!Array.isArray(certifications)) return [];

    return certifications
      .map((c) => {
        if (!c) return null;

        if (typeof c === 'string') {
          return {
            id: `${c}-${Math.random()}`,
            name: c,
            issuer: '',
            notes: '',
            year: '',
          };
        }

        if (typeof c === 'object') {
          return {
            id: c.id || `${Date.now()}-${Math.random()}`,
            name: String(c.name || '').trim(),
            issuer: String(c.issuer || '').trim(),
            notes: String(c.notes || '').trim(),
            year: String(c.year || '').trim(),
          };
        }

        return null;
      })
      .filter((c) => c && (c.name || c.issuer || c.notes || c.year));
  }, [certifications]);

  const canEdit = editMode && typeof setCertifications === 'function';

  const addCertification = () => {
    const name = draft.name.trim();
    if (!canEdit || !name) return;

    const entry = {
      id: `${Date.now()}`,
      name,
      issuer: draft.issuer.trim(),
      notes: draft.notes.trim(),
      year: draft.year.trim(),
    };

    setCertifications((prev) => [entry, ...(Array.isArray(prev) ? prev : [])]);
    setDraft(empty);
  };

  const removeCertification = (id) => {
    if (!canEdit) return;
    setCertifications((prev) =>
      Array.isArray(prev) ? prev.filter((item) => item?.id !== id) : []
    );
  };

  if (!canEdit) {
    if (normalizedCertifications.length === 0) {
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
        {normalizedCertifications.map((c) => (
          <div
            key={c.id}
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
              {c.name}
            </div>

            {(c.issuer || c.year) && (
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(248,244,239,0.68)',
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                {[c.issuer, c.year].filter(Boolean).join(' • ')}
              </div>
            )}

            {c.notes && (
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(248,244,239,0.65)',
                  lineHeight: 1.6,
                  marginTop: 6,
                  whiteSpace: 'pre-line',
                }}
              >
                {c.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <section style={{ display: 'grid', gap: 10 }}>
      {normalizedCertifications.length === 0 ? (
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
          {normalizedCertifications.map((c) => (
            <div
              key={c.id}
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

                {(c.issuer || c.year) && (
                  <div
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.65)',
                      marginTop: 3,
                    }}
                  >
                    {[c.issuer, c.year].filter(Boolean).join(' • ')}
                  </div>
                )}

                {c.notes && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.45)',
                      marginTop: 4,
                      whiteSpace: 'pre-line',
                      lineHeight: 1.55,
                    }}
                  >
                    {c.notes}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeCertification(c.id)}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
              placeholder="AWS Solutions Architect"
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
              Issued By
            </label>
            <input
              value={draft.issuer}
              onChange={(e) => setDraft((prev) => ({ ...prev, issuer: e.target.value }))}
              placeholder="Amazon"
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 10 }}>
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
              placeholder="Optional details"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.16)',
                borderRadius: 10,
                padding: '8px 10px',
                outline: 'none',
                color: '#F8F4EF',
                width: '100%',
                minHeight: 56,
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical',
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
              onChange={(e) => setDraft((prev) => ({ ...prev, year: e.target.value }))}
              placeholder="2024"
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
            onClick={addCertification}
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
            + Add Certification
          </button>
        </div>
      </div>
    </section>
  );
}