import React, { useEffect, useMemo, useState } from 'react';

const DEFAULT_FILTERS = {
  q: '',
  specialties: [],
  availability: 'Any',
  rate: [],
  sort: 'Newest',
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
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: '20px 20px', // ✅ more breathing like Jobs
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        display: 'grid',
        gap: 16, // ✅ more breathing like Jobs
      }}
    >
      {/* TOP ROW (no collapse button) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 160px', // ✅ keeps sort compact, gives search room
          gap: 12,
          alignItems: 'center',
        }}
      >
        <input
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          placeholder="Search mentors (name, headline, summary)…"
          style={input}
        />

        <select
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
          style={input}
        >
          <option>Newest</option>
          <option>Name A–Z</option>
        </select>
      </div>

      {/* ALWAYS-OPEN FILTERS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          paddingTop: 0, // ✅ match Jobs (no weird extra push-down)
        }}
      >
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
          {['Any', 'Open to discuss', 'Limited slots', 'Waitlist'].map((a) => (
            <label key={a} style={checkLabel}>
              <input
                type="radio"
                name="availability"
                checked={filters.availability === a}
                onChange={() => setFilters((f) => ({ ...f, availability: a }))}
              />
              <span>{a}</span>
            </label>
          ))}
        </div>

        {/* Rate */}
        <div>
          <div style={label}>Rate</div>
          {['Free', 'Paid', 'Sliding'].map((r) => (
            <label key={r} style={checkLabel}>
              <input
                type="checkbox"
                checked={filters.rate.includes(r)}
                onChange={() =>
                  setFilters((f) => ({
                    ...f,
                    rate: toggleArr(f.rate, r),
                  }))
                }
              />
              <span>{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      {selectedCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={clearAll} style={btnClear}>
            Clear filters ({selectedCount})
          </button>
        </div>
      )}
    </section>
  );
}

/* ---------- styles ---------- */

const label = {
  fontSize: 12,
  color: '#607D8B',
  fontWeight: 700,
  marginBottom: 6,
};

const input = {
  border: '1px solid #ddd',
  borderRadius: 10,
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
  background: 'white',
};

const checkLabel = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  color: '#37474F',
};

const btnClear = {
  background: 'transparent',
  border: 'none',
  color: '#FF7043',
  fontWeight: 700,
  cursor: 'pointer',
};
