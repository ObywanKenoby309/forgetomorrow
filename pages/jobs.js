// pages/jobs.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { JobPipelineProvider, useJobPipeline } from '../context/JobPipelineContext';
import JobsLayout from '../components/layouts/JobsLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import ATSResultPanel from '../components/seeker/ATSResultPanel';
import JobActions from '../components/jobs/JobActions';
import { normalizeJobText } from '../lib/jd/ingest';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { isInternalJob, getJobTier, getDisplaySource } from '../lib/jobs/jobSource';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
import JobListCard        from '../components/jobs/JobListCard';
import JobPagination      from '../components/jobs/JobPagination';
import JobDetailPanel     from '../components/jobs/JobDetailPanel';
import MobileJobDetail    from '../components/jobs/MobileJobDetail';
import JobsBottomRow      from '../components/jobs/JobsBottomRow';

// ── SSR-safe mobile hook ──────────────────────────────────────
function useIsMobile(bp = 768) {
  const [val, setVal] = useState(null);
  useEffect(() => {
    const check = () => setVal(window.innerWidth < bp);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [bp]);
  return val;
}

// ── Shared helpers ────────────────────────────────────────────
const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const KPI_GLASS = {
  ...GLASS,
  background: 'rgba(255,255,255,0.68)',
  boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
};

const ORANGE_HEADING_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

function inferLocationType(location) {
  if (!location) return '';
  const l = location.toLowerCase();
  if (l.includes('remote')) return 'Remote';
  if (l.includes('hybrid')) return 'Hybrid';
  return 'On-site';
}

function getApplyLink(job) {
  if (!job) return '';
  return job.url || job.externalUrl || job.link || job.applyUrl || '';
}

function buildFallbackSearch(job) {
  if (!job) return 'https://www.google.com/search?q=careers';
  const parts = [];
  if (job.title)   parts.push(job.title);
  if (job.company) parts.push(job.company);
  parts.push('careers');
  return `https://www.google.com/search?q=${encodeURIComponent(parts.join(' '))}`;
}

function getJobStatus(job) {
  const raw = (job?.status || '').toString().trim();
  if (!raw) return 'Open';
  const upper = raw.toUpperCase();
  if (upper === 'DRAFT')                                         return 'Draft';
  if (upper === 'OPEN' || upper === 'PUBLISHED')                 return 'Open';
  if (upper === 'REVIEWING' || upper === 'REVIEWING APPLICANTS') return 'Reviewing';
  if (upper === 'CLOSED' || upper === 'EXPIRED')                 return 'Closed';
  return 'Open';
}

function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
    .trim();
}

function JobsUI() {
  const router   = useRouter();
  const isMobile = useIsMobile(768);

  const chrome     = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const { viewedJobs, appliedJobs, addViewedJob, addAppliedJob } = useJobPipeline();

  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const [selectedJob, setSelectedJob]           = useState(null);
  const [userHasSelected, setUserHasSelected]   = useState(false); // FIX #3
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [keyword, setKeyword]                       = useState('');
  const [companyFilter, setCompanyFilter]           = useState('');
  const [locationFilter, setLocationFilter]         = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('');
  const [daysFilter, setDaysFilter]                 = useState('');
  const [sourceFilter, setSourceFilter]             = useState('');
  const [pageSize, setPageSize]                     = useState(20);
  const [currentPage, setCurrentPage]               = useState(1);

  const isPaidUser = true;

  const saveDraft = async (key, content) => {
    try {
      const res = await fetch('/api/drafts/set', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, content }),
      });
      return res.ok;
    } catch (err) { console.error('[Jobs] saveDraft failed', key, err); return false; }
  };

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res  = await fetch('/api/jobs');
        const data = await res.json();
        setJobs((data && data.jobs) || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchJobs();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadPinned() {
      try {
        const res  = await fetch('/api/seeker/pinned-jobs');
        if (!res.ok) return;
        const data = await res.json();
        const ids  = new Set((data.jobs || []).map(j => j.id));
        if (!cancelled) setPinnedIds(ids);
      } catch (err) { console.error('[Jobs] failed to load pinned jobs', err); }
    }
    loadPinned();
    return () => { cancelled = true; };
  }, []);

  const [filterOpen, setFilterOpen] = useState(false);

  const isJobPinned = (job) => !!job && pinnedIds.has(job.id);

  const handleApplyClick = (job) => {
    if (!job) return;
    const internal  = isInternalJob(job);
    const applyLink = getApplyLink(job);
    if (!internal) {
      const finalUrl = applyLink || buildFallbackSearch(job);
      addAppliedJob(job);
      if (typeof window !== 'undefined') window.open(finalUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (typeof window !== 'undefined') window.location.href = withChrome(`/job/${encodeURIComponent(job.id)}/apply`);
  };

  const handleResumeAlign = async (job) => {
    if (!job) return;
    try {
      const raw   = job.description || '';
      const clean = normalizeJobText(raw);
      if (clean?.trim()) await saveDraft('ft_last_job_text', clean);
      await saveDraft('forge-ats-pack', {
        job: { id: job.id, title: job.title, company: job.company, location: job.location, description: raw },
        ats: { score: null, summary: '', recommendations: [] },
      });
    } catch (err) { console.error('[Jobs] Failed to store job context', err); }
    if (typeof window !== 'undefined')
      window.location.href = withChrome(`/resume/create?from=match&jobId=${job.id}&copyJD=true`);
  };

  const handleImproveResume = async (job, atsResult) => {
    if (!job || !atsResult) return;
    const pack = {
      job: { id: job.id, title: job.title, company: job.company, location: job.location, description: job.description },
      ats: atsResult,
    };
    try {
      const res = await fetch('/api/drafts/set', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'forge-ats-pack', content: pack }),
      });
      if (!res.ok) console.warn('[Jobs] failed to write match pack', res.status);
    } catch (err) { console.error('[Jobs] failed to write match pack', err); }
    if (typeof window !== 'undefined')
      window.location.href = withChrome(`/resume/create?from=match&jobId=${job.id}&copyJD=true`);
  };

  const handleSelectJob = (job) => {
    setUserHasSelected(true);
    setSelectedJob(job);
    addViewedJob(job);
    if (isMobile) setMobileDetailOpen(true);
  };

  const normalizedKeyword  = keyword.trim().toLowerCase();
  const normalizedCompany  = companyFilter.trim().toLowerCase();
  const normalizedLocation = locationFilter.trim().toLowerCase();
  const parsedDays         = parseInt(daysFilter, 10);
  const hasDaysFilter      = !Number.isNaN(parsedDays) && parsedDays > 0;
  const now                = new Date();
  const cutoffTime         = hasDaysFilter ? now.getTime() - parsedDays * 24 * 60 * 60 * 1000 : null;

  const filteredJobs = jobs.filter(job => {
    const status = getJobStatus(job);
    if (status === 'Draft') return false;
    if (status === 'Closed') {
      const threeDaysAgo = now.getTime() - 3 * 24 * 60 * 60 * 1000;
      const updated = job.updatedAt || job.updatedat || job.updated_at || job.publishedat || null;
      if (updated) { const d = new Date(updated); if (!Number.isNaN(d.getTime()) && d.getTime() < threeDaysAgo) return false; }
    }
    const title       = (job.title || '').toLowerCase();
    const company     = (job.company || '').toLowerCase();
    const location    = (job.location || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const tags        = (job.tags || '').toString().toLowerCase();
    if (normalizedKeyword && !`${title} ${company} ${location} ${description} ${tags}`.includes(normalizedKeyword)) return false;
    if (normalizedCompany  && !company.includes(normalizedCompany))   return false;
    if (normalizedLocation && !location.includes(normalizedLocation)) return false;
    if (locationTypeFilter && inferLocationType(job.location || '') !== locationTypeFilter) return false;
    if (sourceFilter) {
      const internal = isInternalJob(job);
      if (sourceFilter === 'external' && internal)  return false;
      if (sourceFilter === 'internal' && !internal) return false;
    }
    if (hasDaysFilter) {
      if (!job.publishedat) return false;
      const d = new Date(job.publishedat);
      if (Number.isNaN(d.getTime()) || d.getTime() < cutoffTime) return false;
    }
    return true;
  });

  useEffect(() => {
    const total = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
    if (currentPage > total) setCurrentPage(1);
  }, [filteredJobs.length, pageSize, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedJobs  = filteredJobs.slice(startIndex, startIndex + pageSize);

  // FIX #3
  useEffect(() => {
    if (userHasSelected) return;
    if (!selectedJob && pagedJobs.length > 0) { setSelectedJob(pagedJobs[0]); return; }
    if (selectedJob) {
      const stillVisible = pagedJobs.some(j => j && j.id === selectedJob.id);
      if (!stillVisible) setSelectedJob(pagedJobs.length > 0 ? pagedJobs[0] : null);
    }
  }, [pagedJobs]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasAppliedToSelected = !!selectedJob && appliedJobs.some(j => j && j.id === selectedJob.id);
  const activeFilterCount    = [keyword, companyFilter, locationFilter, locationTypeFilter, sourceFilter, daysFilter].filter(Boolean).length;

  const filterProps = {
    keyword, setKeyword, companyFilter, setCompanyFilter,
    locationFilter, setLocationFilter, locationTypeFilter, setLocationTypeFilter,
    sourceFilter, setSourceFilter, daysFilter, setDaysFilter,
    filteredCount: filteredJobs.length, totalCount: jobs.length,
    pageSize, setPageSize, currentPage, startIndex,
  };

  if (isMobile === null || loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#78909C' }} aria-busy="true">Loading jobs…</div>;
  }

  const greeting = getTimeGreeting();

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 4px 100px' }}>
        <SeekerTitleCard
          greeting={greeting}
          title="Job Listings"
          subtitle="Explore openings, review full details, and apply with confidence."
          isMobile={true}
        />

        {/* Collapsible filter card */}
        <div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <button type="button" onClick={() => setFilterOpen(o => !o)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#112033' }}>Filter jobs</span>
              {activeFilterCount > 0 && <span style={{ background: '#FF7043', color: 'white', borderRadius: 999, fontSize: 11, fontWeight: 800, padding: '1px 7px' }}>{activeFilterCount}</span>}
            </div>
            <span style={{ fontSize: 18, color: '#90A4AE', lineHeight: 1 }}>{filterOpen ? '▲' : '▼'}</span>
          </button>
          {filterOpen && (
            <div style={{ padding: '0 16px 16px', display: 'grid', gap: 10 }}>
              <input type="text" value={keyword} onChange={e => { setKeyword(e.target.value); setCurrentPage(1); }} placeholder="Keywords — title, skills, tags..."
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              <input type="text" value={companyFilter} onChange={e => { setCompanyFilter(e.target.value); setCurrentPage(1); }} placeholder="Company name..."
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              <input type="text" value={locationFilter} onChange={e => { setLocationFilter(e.target.value); setCurrentPage(1); }} placeholder="City, region, country..."
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <select value={locationTypeFilter} onChange={e => { setLocationTypeFilter(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', background: 'white' }}>
                  <option value="">All types</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
                <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', background: 'white' }}>
                  <option value="">All sources</option>
                  <option value="external">External</option>
                  <option value="internal">Forge recruiters</option>
                </select>
              </div>
              <input type="number" min="1" value={daysFilter} onChange={e => { setDaysFilter(e.target.value); setCurrentPage(1); }} placeholder="Posted within (days) e.g. 7"
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#78909C' }}>Per page:</span>
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CFD8DC', fontSize: 12, background: 'white' }}>
                    <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {activeFilterCount > 0 && (
                    <button type="button" onClick={() => { setKeyword(''); setCompanyFilter(''); setLocationFilter(''); setLocationTypeFilter(''); setSourceFilter(''); setDaysFilter(''); setCurrentPage(1); }}
                      style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CFD8DC', background: 'white', color: '#78909C', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                      Clear
                    </button>
                  )}
                  <button type="button" onClick={() => setFilterOpen(false)}
                    style={{ padding: '8px 18px', borderRadius: 8, background: '#FF7043', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, color: '#78909C', fontWeight: 600, paddingLeft: 2 }}>
          Showing {filteredJobs.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredJobs.length)} of {filteredJobs.length} jobs
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pagedJobs.map(job => (
            <JobListCard key={job.id} job={job} isSelected={selectedJob?.id === job.id} onClick={() => handleSelectJob(job)} getJobStatus={getJobStatus} isInternalJob={isInternalJob} getJobTier={getJobTier} />
          ))}
          {pagedJobs.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.70)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.30)', color: '#78909C', fontSize: 14 }}>No jobs match your filters.</div>}
        </div>
        <JobPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        <JobsBottomRow viewedJobs={viewedJobs} appliedJobs={appliedJobs} onSelectJob={handleSelectJob} />
        {mobileDetailOpen && selectedJob && (
          <MobileJobDetail job={selectedJob} onBack={() => setMobileDetailOpen(false)} getJobStatus={getJobStatus} isInternalJob={isInternalJob} getJobTier={getJobTier} isJobPinned={isJobPinned} hasApplied={hasAppliedToSelected} isPaidUser={isPaidUser} onApply={handleApplyClick} onResumeAlign={handleResumeAlign} onImproveResume={handleImproveResume} />
        )}
      </div>
    );
  }

  // ── DESKTOP ──────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SeekerTitleCard
        greeting={greeting}
        title="Job Listings"
        subtitle="Explore openings, review full details, and apply with confidence."
      />

      {/* Collapsible filter card — solid white, no backdrop over wallpaper */}
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
                <input type="text" value={keyword} onChange={e => { setKeyword(e.target.value); setCurrentPage(1); }} placeholder="Title, skills, tags..."
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company</label>
                <input type="text" value={companyFilter} onChange={e => { setCompanyFilter(e.target.value); setCurrentPage(1); }} placeholder="Company name..."
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</label>
                <input type="text" value={locationFilter} onChange={e => { setLocationFilter(e.target.value); setCurrentPage(1); }} placeholder="City, region, country..."
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location Type</label>
                <select value={locationTypeFilter} onChange={e => { setLocationTypeFilter(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', background: 'white' }}>
                  <option value="">All</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source</label>
                <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setCurrentPage(1); }}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', background: 'white' }}>
                  <option value="">All sources</option>
                  <option value="external">External only</option>
                  <option value="internal">Forge recruiters only</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#78909C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Posted within (days)</label>
                <input type="number" min="1" value={daysFilter} onChange={e => { setDaysFilter(e.target.value); setCurrentPage(1); }} placeholder="e.g. 7"
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 13, color: '#263238', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#78909C', fontWeight: 600 }}>
                Showing {filteredJobs.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredJobs.length)} of {filteredJobs.length} jobs
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#78909C' }}>Jobs per page:</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CFD8DC', fontSize: 12, background: 'white' }}>
                  <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                </select>
                {activeFilterCount > 0 && (
                  <button type="button" onClick={() => { setKeyword(''); setCompanyFilter(''); setLocationFilter(''); setLocationTypeFilter(''); setSourceFilter(''); setDaysFilter(''); setCurrentPage(1); }}
                    style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #CFD8DC', background: 'white', color: '#78909C', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    Clear
                  </button>
                )}
                <button type="button" onClick={() => setFilterOpen(false)}
                  style={{ padding: '5px 18px', borderRadius: 8, background: '#FF7043', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2-column: job list left, job detail right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 16, alignItems: 'flex-start' }}>
        <section aria-label="Job results" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: '#78909C', fontWeight: 600, padding: '0 2px' }}>
            {filteredJobs.length === 0 ? 'No jobs found' : `${startIndex + 1}–${Math.min(startIndex + pageSize, filteredJobs.length)} of ${filteredJobs.length}`}
          </div>
          <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
            {pagedJobs.map(job => (
              <JobListCard key={job.id} job={job} isSelected={selectedJob?.id === job.id} onClick={() => handleSelectJob(job)} getJobStatus={getJobStatus} isInternalJob={isInternalJob} getJobTier={getJobTier} />
            ))}
            {pagedJobs.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.70)', borderRadius: 14, color: '#78909C', fontSize: 14 }}>No jobs match your filters.</div>}
          </div>
          <JobPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </section>
        <section aria-label="Selected job details" style={{ position: 'sticky', top: 16, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <JobDetailPanel job={selectedJob} getJobStatus={getJobStatus} isInternalJob={isInternalJob} getJobTier={getJobTier} isJobPinned={isJobPinned} hasApplied={hasAppliedToSelected} isPaidUser={isPaidUser} onApply={handleApplyClick} onResumeAlign={handleResumeAlign} onImproveResume={handleImproveResume} />
        </section>
      </div>

      <JobsBottomRow viewedJobs={viewedJobs} appliedJobs={appliedJobs} onSelectJob={handleSelectJob} />
    </div>
  );
}

export default function JobsPage() {
  return (
    <JobsLayout activeNav="jobs">
      <JobPipelineProvider>
        <JobsUI />
      </JobPipelineProvider>
    </JobsLayout>
  );
}