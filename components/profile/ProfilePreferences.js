// components/profile/ProfilePreferences.js
import React, { useState } from 'react';
import Collapsible from '@/components/ui/Collapsible';

export default function ProfilePreferences({
  // controlled values
  prefWorkType,
  prefLocations,
  prefStart,

  // setters expected by pages/profile.js
  setPrefWorkType,
  setPrefLocations,
  setPrefStart,

  // (optional legacy props for backward compatibility; safe to omit)
  onChangeWorkType,
  onAddLocation,
  onRemoveLocation,
  onChangeStart,
}) {
  // Local draft for add-location input
  const [locDraft, setLocDraft] = useState('');

  // Wire to either setters (preferred) or legacy handlers if provided
  const handleWorkType = (val) => {
    if (typeof setPrefWorkType === 'function') setPrefWorkType(val);
    else onChangeWorkType?.(val);
  };

  const handleStart = (val) => {
    if (typeof setPrefStart === 'function') setPrefStart(val);
    else onChangeStart?.(val);
  };

  const handleAddLocation = (val) => {
    const t = (val || '').trim();
    if (!t) return;

    if (typeof setPrefLocations === 'function') {
      const current = Array.isArray(prefLocations) ? prefLocations : [];
      if (!current.some((x) => x.toLowerCase() === t.toLowerCase())) {
        setPrefLocations([...current, t]);
      }
    } else {
      onAddLocation?.(t);
    }
  };

  const handleRemoveLocation = (val) => {
    if (typeof setPrefLocations === 'function') {
      const current = Array.isArray(prefLocations) ? prefLocations : [];
      setPrefLocations(current.filter((x) => x !== val));
    } else {
      onRemoveLocation?.(val);
    }
  };

  const locations = Array.isArray(prefLocations) ? prefLocations : [];

  return (
    <Collapsible title="Work Preferences" defaultOpen={false}>
      <section style={{ display: 'grid', gap: 12 }}>
        {/* Work type */}
        <label
          style={{
            display: 'grid',
            gap: 6,
            color: '#455A64',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <span>Preferred work type</span>
          <select
            value={prefWorkType ?? ''} // keep controlled
            onChange={(e) => handleWorkType(e.target.value)}
            style={{
              border: '1px solid #ddd',
              borderRadius: 10,
              padding: '10px 12px',
              outline: 'none',
              background: 'white',
              width: '100%',
            }}
          >
            <option value="">— Select —</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
            <option value="Flexible">Flexible</option>
          </select>
        </label>

        {/* Locations (chips + inline add) */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <div style={{ color: '#455A64', fontWeight: 600, fontSize: 13 }}>
              Preferred locations
            </div>

            {/* Inline add */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                value={locDraft}
                onChange={(e) => setLocDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLocation(locDraft);
                    setLocDraft('');
                  }
                }}
                placeholder="Add location (e.g., Nashville, TN)"
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 10,
                  padding: '8px 10px',
                  outline: 'none',
                  background: 'white',
                  minWidth: 220,
                }}
              />
              <button
                type="button"
                onClick={() => {
                  handleAddLocation(locDraft);
                  setLocDraft('');
                }}
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
                Add
              </button>
            </div>
          </div>

          {/* Pills list */}
          {(locations.length ?? 0) === 0 ? (
            <div style={{ color: '#607D8B' }}>No locations yet.</div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {locations.map((t) => (
                <Chip key={t} text={t} onRemove={() => handleRemoveLocation(t)} />
              ))}
            </div>
          )}
        </div>

        {/* Availability date */}
        <label
          style={{
            display: 'grid',
            gap: 6,
            color: '#455A64',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <span>Earliest start date (optional)</span>
          <input
            type="date"
            value={prefStart ?? ''} // keep controlled
            onChange={(e) => handleStart(e.target.value)}
            style={{
              border: '1px solid #ddd',   // ✅ fixed quotes
              borderRadius: 10,
              padding: '10px 12px',
              outline: 'none',
              background: 'white',
              width: '100%',
            }}
          />
        </label>
      </section>
    </Collapsible>
  );
}

function Chip({ text, onRemove }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        background: '#F7FAFC',
        color: '#455A64',
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid #e6e9ef',
      }}
    >
      {text}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${text}`}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#90A4AE',
          fontWeight: 700,
        }}
        title="Remove"
      >
        ×
      </button>
    </span>
  );
}
