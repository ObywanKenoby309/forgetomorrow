// components/jobs/JobSearchFilters.js
// Shared job-search filter UI for the Jobs page.
// Keeps UI out of pages/jobs.js while the page owns state, search wiring, and results.

import React from 'react';

export default function JobSearchFilters({
  isMobile = false,
  filterOpen,
  setFilterOpen,
  activeFilterCount = 0,
  keyword,
  setKeyword,
  companyFilter,
  setCompanyFilter,
  locationFilter,
  setLocationFilter,
  locationTypeFilter,
  setLocationTypeFilter,
  sourceFilter,
  setSourceFilter,
  daysFilter,
  setDaysFilter,
  pageSize,
  setPageSize,
  setCurrentPage,
  filteredCount = 0,
  startIndex = 0,
  onApplyFilters,
  onApply,
  onSearch,
  onSavePreferences,
  savingPreferences = false,
  preferenceSaveStatus = '',
}) {
  const applyFilters = () => {
    const handler = onApplyFilters || onApply || onSearch;

    if (typeof handler === 'function') {
      handler();
    }

    setFilterOpen(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      keyword: '',
      company: '',
      location: '',
      locationType: '',
      source: '',
      days: '',
    };

    setKeyword('');
    setCompanyFilter('');
    setLocationFilter('');
    setLocationTypeFilter('');
    setSourceFilter('');
    setDaysFilter('');
    setCurrentPage(1);

    const handler = onApplyFilters || onApply || onSearch;

    if (typeof handler === 'function') {
      handler(clearedFilters);
    }
  };

  if (isMobile) {
    return (
      <div style={{ background: 'rgba(255,248,242,0.92)', borderRadius: '0 0 20px 20px', border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 10px 24px rgba(0,0,0,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', overflow: 'hidden' }}>
        <button type="button" onClick={() => setFilterOpen(true)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#112033' }}>Filter jobs</span>
            {activeFilterCount > 0 && <span style={{ background: '#FF7043', color: 'white', borderRadius: 999, fontSize: 11, fontWeight: 800, padding: '1px 7px' }}>{activeFilterCount}</span>}
          </div>
          <span style={{ fontSize: 18, color: '#90A4AE', lineHeight: 1 }}>{filterOpen ? '▲' : '▼'}</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <button type="button" onClick={() => setFilterOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#112033' }}>Filter jobs</span>
          {activeFilterCount > 0 && <span style={{ background: '#FF7043', color: 'white', borderRadius: 999, fontSize: 11, fontWeight: 800, padding: '2px 8px' }}>{activeFilterCount} active</span>}
        </div>
        <span style={{ fontSize: 16, color: '#90A4AE' }}>{filterOpen ? '▲' : '▼'}</span>
      </button>
      {filterOpen && (
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Keywords</label>
              <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Title, skills, tags..."
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company</label>
              <input type="text" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} placeholder="Company name..."
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</label>
              <input type="text" value={locationFilter} onChange={e => setLocationFilter(e.target.value)} placeholder="City, region, country..."
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location Type</label>
              <select value={locationTypeFilter} onChange={e => setLocationTypeFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', background: 'white' }}>
                <option value="">All</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source</label>
              <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', background: 'white' }}>
                <option value="">All sources</option>
                <option value="external">External only</option>
                <option value="internal">Forge recruiters only</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Posted within (days)</label>
              <input type="number" min="1" value={daysFilter} onChange={e => setDaysFilter(e.target.value)} placeholder="e.g. 7"
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#78909C', fontWeight: 600 }}>
              Showing {filteredCount === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredCount)} of {filteredCount} jobs
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#78909C' }}>Jobs per page:</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CFD8DC', fontSize: 12, background: 'white' }}>
                <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
              </select>
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters}
                  style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #CFD8DC', background: 'white', color: '#78909C', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  Clear
                </button>
              )}
              {typeof onSavePreferences === 'function' && (
                <button type="button" onClick={onSavePreferences} disabled={savingPreferences}
                  style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid rgba(26,75,143,0.25)', background: savingPreferences ? 'rgba(26,75,143,0.08)' : 'white', color: '#1A4B8F', fontSize: 12, cursor: savingPreferences ? 'default' : 'pointer', fontWeight: 700 }}>
                  {savingPreferences ? 'Saving...' : 'Save for dashboard'}
                </button>
              )}
              <button type="button" onClick={applyFilters}
                style={{ padding: '5px 18px', borderRadius: 8, background: '#FF7043', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Apply Filters
              </button>
            </div>
          </div>
          {preferenceSaveStatus && (
            <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: preferenceSaveStatus === 'saved' ? '#2E7D32' : '#D32F2F' }}>
              {preferenceSaveStatus === 'saved' ? 'Dashboard preferences saved.' : 'Could not save dashboard preferences.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
