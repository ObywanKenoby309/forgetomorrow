// components/spotlights/SpotlightFilters.js
import React, { useEffect, useMemo, useState } from 'react';

const DEFAULT_FILTERS = {
  q: '',
  specialties: [],
  availability: 'Any',
  rate: [], // Free, Paid, Sliding
  sort: 'Newest', // Newest | Name A–Z
};

const SPECIALTY_OPTIONS = [
  'Resume Review',
  'Interview Prep',
  'Career Strategy',
  'Portfolio Review',
  'Networking',
  'Salary/Negotiation',
  'Career Pivot',
];

const RATE_OPTIONS = ['Free', 'Paid', 'Sliding'];

export default function SpotlightFilters({ onChange, initial }) {
  const [filters, setFilters] = useState(initial || DEFAULT_FILTERS);

  useEffect(() => {
    onChange?.(filters);
  }, [filters, onChange]);

  const toggleArr = (arr, val) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const clearAll = () => setFilters(DEFAULT_FILTERS);

  const selectedCount = useMemo(() => {
    let n = 0;
    if (filters.q.trim()) n++;
    n += filters.specialties.length;
    if (filters.availability !== 'Any') n++;
    n += filters.rate.length;
    if (filters.sort !== 'Newest') n++;
    return n;
  }, [filters]);

  return (
    <aside
      style={{
        position: 'sticky',
        top: 100,
        alignSelf: 'start',
        width: '100%',
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        display: 'grid',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800, color: '#263238' }}>Filters</div>
        <button
          type="button"
          onClick={clearAll}
          title="Clear all filters"
          style={{
            background: 'white',
            color: '#FF7043',
            border: '1px solid #FF7043',
            borderRadius: 8,
            padding: '6px 8px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          Clear {selectedCount ? `(${selectedCount})` : ''}
        </button>
      </div>

      {/* Search / Name */}
      <div>
        <div style={label}>Search (name, headline, summary)</div>
        <input
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          placeholder="e.g., resume, interview, etc."
          style={input}
        />
      </div>

      {/* Specialties */}
      <div>
        <div style={label}>Specialties</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {SPECIALTY_OPTIONS.map((s) => (
            <label key={s} style={checkLabel}>
              <input
                type="checkbox"
                checked={filters.specialties.includes(s)}
                onChange={() =>
                  setFilters((f) => ({
                    ...f,
                    specialties: toggleArr(f.specialties, s),
                  }))
                }
              />
              <span>{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <div style={label}>Availability</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {['Any', 'Open to discuss', 'Limited slots', 'Waitlist'].map((a) => (
            <label key={a} style={checkLabel}>
              <input
                type="radio"
                name="avail"
                checked={filters.availability === a}
                onChange={() => setFilters((f) => ({ ...f, availability: a }))}
              />
              <span>{a}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rate */}
      <div>
        <div style={label}>Rate</div>
        <div style={{ display: 'grid', gap: 6 }}>
          {['Free', 'Paid', 'Sliding'].map((r) => (
            <label key={r} style={checkLabel}>
              <input
                type="checkbox"
                checked={filters.rate.includes(r)}
                onChange={() =>
                  setFilters((f) => ({ ...f, rate: toggleArr(f.rate, r) }))
                }
              />
              <span>{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <div style={label}>Sort</div>
        <select
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
          style={input}
        >
          <option>Newest</option>
          <option>Name A–Z</option>
        </select>
      </div>
    </aside>
  );
}

const label = { fontSize: 12, color: '#607D8B', fontWeight: 700, marginBottom: 6 };
const input = { border: '1px solid #ddd', borderRadius: 10, padding: '10px 12px', outline: 'none', width: '100%', background: 'white' };
const checkLabel = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#37474F' };
