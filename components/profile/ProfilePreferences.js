import React from 'react';
import Collapsible from '@/components/ui/Collapsible';

export default function ProfilePreferences({
  prefWorkType,
  prefLocations,
  prefStart,
  onChangeWorkType,
  onAddLocation,
  onRemoveLocation,
  onChangeStart,
}) {
  return (
    <Collapsible title="Work Preferences" defaultOpen>
      <section style={{ display: 'grid', gap: 12 }}>
        {/* Work type */}
        <label style={{ display: 'grid', gap: 6, color: '#455A64', fontWeight: 600, fontSize: 13 }}>
          <span>Preferred work type</span>
          <select
            value={prefWorkType}
            onChange={(e) => onChangeWorkType?.(e.target.value)}
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
            <div style={{ color: '#455A64', fontWeight: 600, fontSize: 13 }}>Preferred locations</div>
            <AddChipInline
              placeholder="Add location (e.g., Nashville, TN)"
              onAdd={(val) => onAddLocation?.(val)}
            />
          </div>
          {prefLocations.length === 0 ? (
            <div style={{ color: '#607D8B' }}>No locations yet.</div>
          ) : (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {prefLocations.map((t) => (
                <Chip key={t} text={t} onRemove={() => onRemoveLocation?.(t)} />
              ))}
            </div>
          )}
        </div>

        {/* Availability date */}
        <label style={{ display: 'grid', gap: 6, color: '#455A64', fontWeight: 600, fontSize: 13 }}>
          <span>Earliest start date (optional)</span>
          <input
            type="date"
            value={prefStart}
            onChange={(e) => onChangeStart?.(e.target.value)}
            style={{
              border: '1px solid #ddd',
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

function AddChipInline({ placeholder, onAdd }) {
  const [val, setVal] = React.useState('');
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
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
          const t = (val || '').trim();
          if (t) onAdd?.(t);
          setVal('');
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
