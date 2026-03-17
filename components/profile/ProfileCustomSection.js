import React, { useState } from 'react';

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

export default function ProfileCustomSection({
  value,
  setValue,
  editMode = false,
}) {
  const fallback = {
    name: '',
    organization: '',
    notes: '',
    startYear: '',
    endYear: '',
  };

  const data = value || fallback;
  const canEdit = editMode && typeof setValue === 'function';

  const updateField = (field, fieldValue) => {
    if (!canEdit) return;
    setValue((prev) => ({
      ...(prev || fallback),
      [field]: fieldValue,
    }));
  };

  const hasContent = Boolean(
    data.name || data.organization || data.notes || data.startYear || data.endYear
  );

  if (!canEdit) {
    if (!hasContent) {
      return (
        <div
          style={{
            fontSize: 13,
            color: 'rgba(248,244,239,0.35)',
            fontStyle: 'italic',
            lineHeight: 1.6,
          }}
        >
          No custom section content added yet.
        </div>
      );
    }

    const years = [data.startYear, data.endYear].filter(Boolean).join(' – ');

    return (
      <div
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
          {data.name || 'Custom'}
        </div>

        {(data.organization || years) && (
          <div
            style={{
              fontSize: 12,
              color: 'rgba(248,244,239,0.68)',
              marginTop: 4,
              fontWeight: 500,
            }}
          >
            {[data.organization, years].filter(Boolean).join(' • ')}
          </div>
        )}

        {data.notes && (
          <div
            style={{
              fontSize: 12,
              color: 'rgba(248,244,239,0.65)',
              lineHeight: 1.6,
              marginTop: 6,
              whiteSpace: 'pre-line',
            }}
          >
            {data.notes}
          </div>
        )}
      </div>
    );
  }

  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={labelStyle}>Name</label>
          <input
            value={data.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Name"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label style={labelStyle}>Group/Org/Company</label>
          <input
            value={data.organization || ''}
            onChange={(e) => updateField('organization', e.target.value)}
            placeholder="Group/Org/Company"
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={data.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Notes"
            style={{
              ...inputStyle,
              minHeight: 56,
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label style={labelStyle}>Years</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              value={data.startYear || ''}
              onChange={(e) => updateField('startYear', e.target.value)}
              placeholder="2018"
              style={inputStyle}
            />
            <input
              value={data.endYear || ''}
              onChange={(e) => updateField('endYear', e.target.value)}
              placeholder="2022"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.35)',
          lineHeight: 1.6,
        }}
      >
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          onClick={() => setValue(fallback)}
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
          Reset Custom
        </button>
      </div>
    </section>
  );
}
