import React, { useMemo, useState } from 'react';

const ORANGE = '#FF7043';

const inputStyle = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 10,
  padding: '8px 10px',
  outline: 'none',
  color: '#F8F4EF',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: 'rgba(255,255,255,0.70)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

function normalizeCertification(certification, index) {
  if (!certification) return null;

  if (typeof certification === 'string') {
    return {
      id: `cert-${index}`,
      name: certification,
      issuer: '',
      notes: '',
      year: '',
    };
  }

  if (typeof certification === 'object') {
    return {
      id: certification.id || `cert-${index}`,
      name: String(certification.name || '').trim(),
      issuer: String(certification.issuer || '').trim(),
      notes: String(certification.notes || '').trim(),
      year: String(certification.year || '').trim(),
    };
  }

  return null;
}

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
      .map((certification, index) => normalizeCertification(certification, index))
      .filter(
        (certification) =>
          certification &&
          (certification.name ||
            certification.issuer ||
            certification.notes ||
            certification.year)
      );
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

    setCertifications((prev) => [...(Array.isArray(prev) ? prev : []), entry]);
    setDraft(empty);
  };

  const removeCertificationAtIndex = (indexToRemove) => {
    if (!canEdit) return;
    setCertifications((prev) =>
      Array.isArray(prev) ? prev.filter((_, index) => index !== indexToRemove) : []
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
        {normalizedCertifications.map((certification) => (
          <div
            key={certification.id}
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
              {certification.name}
            </div>

            {(certification.issuer || certification.year) && (
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(248,244,239,0.68)',
                  marginTop: 4,
                  fontWeight: 500,
                }}
              >
                {[certification.issuer, certification.year].filter(Boolean).join(' • ')}
              </div>
            )}

            {certification.notes && (
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(248,244,239,0.65)',
                  lineHeight: 1.6,
                  marginTop: 6,
                  whiteSpace: 'pre-line',
                }}
              >
                {certification.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <section style={{ display: 'grid', gap: 12 }}>
      {normalizedCertifications.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {normalizedCertifications.map((certification, index) => (
            <div
              key={certification.id}
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
                  {certification.name}
                </div>

                {(certification.issuer || certification.year) && (
                  <div
                    style={{
                      fontSize: 13,
                      color: 'rgba(255,255,255,0.65)',
                      marginTop: 3,
                    }}
                  >
                    {[certification.issuer, certification.year]
                      .filter(Boolean)
                      .join(' • ')}
                  </div>
                )}

                {certification.notes && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'rgba(255,255,255,0.45)',
                      marginTop: 4,
                      whiteSpace: 'pre-line',
                      lineHeight: 1.55,
                    }}
                  >
                    {certification.notes}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => removeCertificationAtIndex(index)}
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
            <label style={labelStyle}>Name</label>
            <input
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Certification name"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label style={labelStyle}>Issued By</label>
            <input
              value={draft.issuer}
              onChange={(e) => setDraft((prev) => ({ ...prev, issuer: e.target.value }))}
              placeholder="Issuer"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 110px', gap: 10 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes"
              style={{
                ...inputStyle,
                minHeight: 56,
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <label style={labelStyle}>Year</label>
            <input
              value={draft.year}
              onChange={(e) => setDraft((prev) => ({ ...prev, year: e.target.value }))}
              placeholder="2018"
              style={inputStyle}
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
              padding: '8px 14px',
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
