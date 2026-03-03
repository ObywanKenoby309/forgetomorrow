// components/jobs/JobFilterPanel.js
import React from 'react';

const inputStyle = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #CFD8DC',
  fontSize: 13,
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.90)',
  color: '#263238',
  outline: 'none',
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: '#78909C',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 4,
  display: 'block',
};

const fieldWrap = {
  display: 'flex',
  flexDirection: 'column',
};

export default function JobFilterPanel({
  keyword, setKeyword,
  companyFilter, setCompanyFilter,
  locationFilter, setLocationFilter,
  locationTypeFilter, setLocationTypeFilter,
  sourceFilter, setSourceFilter,
  daysFilter, setDaysFilter,
  filteredCount,
  totalCount,
  pageSize, setPageSize,
  currentPage,
  startIndex,
  // optional: called when Apply Filters button is clicked (mobile drawer usage)
  onApply,
  // layout mode: 'sidebar' (desktop) | 'drawer' (mobile)
  mode = 'sidebar',
}) {
  const activeFilterCount = [
    keyword, companyFilter, locationFilter,
    locationTypeFilter, sourceFilter, daysFilter,
  ].filter(Boolean).length;

  const clearAll = () => {
    setKeyword('');
    setCompanyFilter('');
    setLocationFilter('');
    setLocationTypeFilter('');
    setSourceFilter('');
    setDaysFilter('');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      padding: mode === 'drawer' ? '0 0 24px' : 0,
    }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#112033' }}>
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              marginLeft: 8,
              background: '#FF7043',
              color: 'white',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 800,
              padding: '1px 7px',
            }}>
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            style={{
              background: 'none',
              border: 'none',
              color: '#FF7043',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Keywords */}
      <div style={fieldWrap}>
        <label htmlFor="filter-keywords" style={labelStyle}>Keywords</label>
        <input
          id="filter-keywords"
          type="text"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="Title, skills, tags…"
          style={inputStyle}
        />
      </div>

      {/* Company */}
      <div style={fieldWrap}>
        <label htmlFor="filter-company" style={labelStyle}>Company</label>
        <input
          id="filter-company"
          type="text"
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          placeholder="Company name…"
          style={inputStyle}
        />
      </div>

      {/* Location */}
      <div style={fieldWrap}>
        <label htmlFor="filter-location" style={labelStyle}>Location</label>
        <input
          id="filter-location"
          type="text"
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
          placeholder="City, region, country…"
          style={inputStyle}
        />
      </div>

      {/* Location Type */}
      <div style={fieldWrap}>
        <label htmlFor="filter-location-type" style={labelStyle}>Location Type</label>
        <select
          id="filter-location-type"
          value={locationTypeFilter}
          onChange={e => setLocationTypeFilter(e.target.value)}
          style={{ ...inputStyle, backgroundColor: 'white' }}
        >
          <option value="">All types</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="On-site">On-site</option>
        </select>
      </div>

      {/* Source */}
      <div style={fieldWrap}>
        <label htmlFor="filter-source" style={labelStyle}>Source</label>
        <select
          id="filter-source"
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          style={{ ...inputStyle, backgroundColor: 'white' }}
        >
          <option value="">All sources</option>
          <option value="external">External only</option>
          <option value="internal">Forge recruiters only</option>
        </select>
      </div>

      {/* Days */}
      <div style={fieldWrap}>
        <label htmlFor="filter-days" style={labelStyle}>Posted within (days)</label>
        <input
          id="filter-days"
          type="number"
          min="1"
          value={daysFilter}
          onChange={e => setDaysFilter(e.target.value)}
          placeholder="e.g. 7"
          style={inputStyle}
        />
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.07)', margin: '0 0 4px' }} />

      {/* Results count */}
      <div style={{ fontSize: 12, color: '#78909C', lineHeight: 1.5 }}>
        <span style={{ fontWeight: 700, color: '#112033' }}>{filteredCount}</span> jobs found
        {typeof totalCount === 'number' && (
          <span style={{ color: '#B0BEC5' }}> of {totalCount}</span>
        )}
      </div>

      {/* Per page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
        <span style={{ color: '#78909C', fontWeight: 600 }}>Per page:</span>
        <select
          aria-label="Jobs per page"
          value={pageSize}
          onChange={e => { setPageSize(Number(e.target.value)); }}
          style={{
            padding: '4px 8px', borderRadius: 6, border: '1px solid #CFD8DC',
            fontSize: 12, backgroundColor: 'white', color: '#263238',
          }}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      {/* Mobile apply button */}
      {mode === 'drawer' && onApply && (
        <button
          type="button"
          onClick={onApply}
          style={{
            marginTop: 8,
            background: '#FF7043',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: '12px 24px',
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(255,112,67,0.35)',
          }}
        >
          Show {filteredCount} jobs
        </button>
      )}
    </div>
  );
}