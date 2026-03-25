// pages/jobs.js
// ────────────────────────────────────────────────────────────────────
// FEATURE FLAG: append ?newui=1 to any jobs URL to preview the new UI
// Everyone else sees the original layout untouched.
// When you're happy: delete OldJobsUI and remove the router.query check.
// ────────────────────────────────────────────────────────────────────
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { JobPipelineProvider, useJobPipeline } from '../context/JobPipelineContext';
import { Card, CardHeader, CardTitle, CardContent, CardSubtle } from '../components/ui/Card';
import InternalLayout from '../components/layouts/InternalLayout';
import ATSResultPanel from '../components/seeker/ATSResultPanel';
import JobActions from '../components/jobs/JobActions';
import { normalizeJobText } from '../lib/jd/ingest';
import RightRailPlacementManager from '@/components/ads/RightRailPlacementManager';
import { isInternalJob, getJobTier, getDisplaySource } from '../lib/jobs/jobSource';

// ── New UI components ─────────────────────────────────────────
import JobsPageHeader     from '../components/jobs/JobsPageHeader';
import JobFilterPanel     from '../components/jobs/JobFilterPanel';
import MobileFilterDrawer from '../components/jobs/MobileFilterDrawer';
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

// ──────────────────────────────────────────────────────────────
// OLD UI — with mobile support + all 3 bug fixes
// ──────────────────────────────────────────────────────────────
function OldJobsUI() {
  const router   = useRouter();
  const isMobile = useIsMobile(768);
  const chrome   = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const { viewedJobs, appliedJobs, addViewedJob, addAppliedJob } = useJobPipeline();

  const [jobs, setJobs]                         = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [searchKeywordJobs, setSearchKeywordJobs] = useState(null);
  const [searchLoading, setSearchLoading]         = useState(false);
  const [selectedJob, setSelectedJob]           = useState(null);
  const [userHasSelected, setUserHasSelected]   = useState(false); // FIX #3
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [atsLoading, setAtsLoading]     = useState(false);
  const [atsError, setAtsError]         = useState(null);
  const [atsResult, setAtsResult]       = useState(null);
  const [atsPanelOpen, setAtsPanelOpen] = useState(false);
  const [atsJob, setAtsJob]             = useState(null);

  // FIX #1: draft state (what user types) vs applied state (what filters jobs)
  const [draftKeyword, setDraftKeyword]           = useState('');
  const [draftCompany, setDraftCompany]           = useState('');
  const [draftLocation, setDraftLocation]         = useState('');
  const [draftLocationType, setDraftLocationType] = useState('');
  const [draftDays, setDraftDays]                 = useState('');
  const [draftSource, setDraftSource]             = useState('');

  const [keyword, setKeyword]                       = useState('');
  const [companyFilter, setCompanyFilter]           = useState('');
  const [locationFilter, setLocationFilter]         = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('');
  const [daysFilter, setDaysFilter]                 = useState('');
  const [sourceFilter, setSourceFilter]             = useState('');

  const [pageSize, setPageSize]       = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [pinnedIds, setPinnedIds]     = useState(new Set());
  const isPaidUser = true;

  const applyFilters = useCallback(() => {
    setKeyword(draftKeyword);
    setCompanyFilter(draftCompany);
    setLocationFilter(draftLocation);
    setLocationTypeFilter(draftLocationType);
    setDaysFilter(draftDays);
    setSourceFilter(draftSource);
    setCurrentPage(1);
  }, [draftKeyword, draftCompany, draftLocation, draftLocationType, draftDays, draftSource]);

  const clearFilters = useCallback(() => {
    setDraftKeyword(''); setDraftCompany(''); setDraftLocation('');
    setDraftLocationType(''); setDraftDays(''); setDraftSource('');
    setKeyword(''); setCompanyFilter(''); setLocationFilter('');
    setLocationTypeFilter(''); setDaysFilter(''); setSourceFilter('');
    setCurrentPage(1);
  }, []);

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

    async function runKeywordSearch() {
      const q = keyword.trim();

      if (!q) {
        setSearchKeywordJobs(null);
        return;
      }

      setSearchLoading(true);

      try {
        const res = await fetch('/api/search/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: q,
            pageSize: 200,
            currentPage: 1,
          }),
        });

        const data = await res.json();

        if (!cancelled) {
          setSearchKeywordJobs(Array.isArray(data.jobs) ? data.jobs : []);
        }
      } catch (err) {
        console.error('[Jobs] keyword search failed', err);
        if (!cancelled) setSearchKeywordJobs([]);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }

    runKeywordSearch();

    return () => {
      cancelled = true;
    };
  }, [keyword]);

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

  const isJobPinned = (job) => !!job && pinnedIds.has(job.id);

  const togglePin = async (job) => {
    if (!job) return;
    const currentlyPinned = isJobPinned(job);
    try {
      const res = await fetch('/api/seeker/pinned-jobs', {
        method: currentlyPinned ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!res.ok) throw new Error(data.error || `Pin API failed (status ${res.status})`);
      setPinnedIds(prev => {
        const next = new Set(prev);
        if (currentlyPinned) next.delete(job.id); else next.add(job.id);
        return next;
      });
    } catch (err) {
      console.error('[Jobs] togglePin error', err);
      alert(err.message || (currentlyPinned ? 'Could not unpin this job.' : 'Could not pin this job.'));
    }
  };

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
      if (clean && clean.trim()) await saveDraft('ft_last_job_text', clean);
      await saveDraft('forge-ats-pack', {
        job: { id: job.id, title: job.title, company: job.company, location: job.location, description: raw },
        ats: { score: null, summary: '', recommendations: [] },
      });
    } catch (err) { console.error('[Jobs] Failed to store job context', err); }
    if (typeof window !== 'undefined')
      window.location.href = withChrome(`/resume/create?from=match&jobId=${job.id}&copyJD=true`);
  };

  const handleATSAlign = async (job) => {
    if (!job) return;
    setAtsJob(job); setAtsPanelOpen(true); setAtsLoading(true); setAtsError(null); setAtsResult(null);
    try {
      const res = await fetch('/api/seeker/ats-align', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      if (!res.ok) throw new Error(`Alignment API failed (status ${res.status})`);
      const payload = await res.json();
      setAtsResult({
        score: typeof payload.score === 'number' ? payload.score : null,
        summary: payload.summary || '',
        recommendations: Array.isArray(payload.recommendations) ? payload.recommendations : [],
      });
    } catch (err) {
      console.error('[Jobs] Alignment error', err);
      setAtsResult({
        score: 78,
        summary: 'Demo result: You appear to be a strong match on core skills and background for this role.',
        recommendations: [
          'Add one or two bullets with clear metrics (%, $, time saved) for your most recent role.',
          "Mirror 2-3 of the job's exact keywords in your resume summary.",
          'Highlight any direct experience with similar tools or platforms mentioned in the posting.',
        ],
      });
    } finally { setAtsLoading(false); }
  };

  const handleSendToResumeBuilder = async () => {
    if (!atsJob || !atsResult) return;
    const pack = {
      job: { id: atsJob.id, title: atsJob.title, company: atsJob.company, location: atsJob.location, description: atsJob.description },
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
      window.location.href = withChrome(`/resume/create?from=match&jobId=${atsJob.id}&copyJD=true`);
  };

  // FIX #3: set userHasSelected on explicit click
  const handleSelectJob = (job) => {
    setUserHasSelected(true);
    setSelectedJob(job);
    addViewedJob(job);
    setAtsResult(null); setAtsError(null); setAtsPanelOpen(false);
    if (isMobile) setMobileDetailOpen(true);
  };

  const normalizedKeyword  = keyword.trim().toLowerCase();
  const normalizedCompany  = companyFilter.trim().toLowerCase();
  const normalizedLocation = locationFilter.trim().toLowerCase();
  const parsedDays         = parseInt(daysFilter, 10);
  const hasDaysFilter      = !Number.isNaN(parsedDays) && parsedDays > 0;
  const now                = new Date();
  const cutoffTime         = hasDaysFilter ? now.getTime() - parsedDays * 24 * 60 * 60 * 1000 : null;

  const baseJobs = keyword.trim()
  ? (searchKeywordJobs ?? []).map((hit) => {
      const fullJob = jobs.find((j) => String(j.id) === String(hit.id));
      return fullJob ? { ...fullJob, ...hit } : hit;
    })
  : jobs;

  const filteredJobs = baseJobs.filter(job => {
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
    if (!keyword.trim() && normalizedKeyword && !`${title} ${company} ${location} ${description} ${tags}`.includes(normalizedKeyword)) return false;
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
    const totalPagesLocal = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
    if (currentPage > totalPagesLocal) setCurrentPage(1);
  }, [filteredJobs.length, pageSize, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedJobs  = filteredJobs.slice(startIndex, startIndex + pageSize);

  // FIX #3: only auto-select first job if user hasn't manually chosen one
  useEffect(() => {
    if (userHasSelected) return;
    if (!selectedJob && pagedJobs.length > 0) { setSelectedJob(pagedJobs[0]); return; }
    if (selectedJob) {
      const stillVisible = pagedJobs.some(j => j && j.id === selectedJob.id);
      if (!stillVisible) setSelectedJob(pagedJobs.length > 0 ? pagedJobs[0] : null);
    }
  }, [pagedJobs]); // eslint-disable-line react-hooks/exhaustive-deps

  const pageNumbers = [];
  const windowSize  = 3;
  const startPage   = Math.max(1, currentPage - windowSize);
  const endPage     = Math.min(totalPages, currentPage + windowSize);
  for (let p = startPage; p <= endPage; p++) pageNumbers.push(p);

  const recentViewed         = viewedJobs.slice(-6).reverse();
  const selectedStatus       = selectedJob ? getJobStatus(selectedJob) : null;
  const hasAppliedToSelected = !!selectedJob && appliedJobs.some(j => j && j.id === selectedJob.id);
  const isSelectedInternal   = isInternalJob(selectedJob);
  const selectedSourceLabel  = getDisplaySource(selectedJob);
  const selectedTier         = getJobTier(selectedJob);
  const selectedIsFtOfficial = selectedTier === 'ft-official';
  const selectedIsPartner    = selectedTier === 'partner';
  const selectedIsDark       = selectedIsFtOfficial || selectedIsPartner;
  const selectedDetailBorder     = selectedIsFtOfficial ? '2px solid #FF7043' : selectedIsPartner ? '1px solid rgba(17,32,51,0.35)' : '1px solid #E0E0E0';
  const selectedDetailBackground = selectedIsFtOfficial ? 'linear-gradient(135deg, #FF7043, #FF8A65)' : selectedIsPartner ? 'linear-gradient(135deg, #0B1724, #112033)' : '#FFFFFF';
  const detailTitleColor         = selectedIsDark ? '#FFFFFF' : '#263238';
  const detailSubtleColor        = selectedIsDark ? '#CFD8DC' : '#607D8B';
  const detailBodyColor          = selectedIsDark ? '#ECEFF1' : '#37474F';
  const selectedChipLabel        = selectedIsFtOfficial ? 'ForgeTomorrow official posting' : isSelectedInternal ? 'ForgeTomorrow recruiter posting' : null;

  const activeFilterCount = [draftKeyword, draftCompany, draftLocation, draftLocationType, draftDays, draftSource].filter(Boolean).length;

  if (loading || isMobile === null) {
    return (
      <div className="px-4 md:px-8 pb-10">
        <p style={{ padding: 40, textAlign: 'center' }} aria-busy="true">Loading jobs...</p>
      </div>
    );
  }

  // ── MOBILE LAYOUT ──────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 4px 100px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <header style={{ ...GLASS, padding: '16px 18px', textAlign: 'center' }}>
          <h1 style={{ color: '#FF7043', fontSize: 22, fontWeight: 800, margin: 0 }}>Job Listings</h1>
          <p style={{ margin: '6px 0 0', color: '#546E7A', fontSize: 13 }}>{filteredJobs.length} open roles</p>
        </header>

        {/* Search + Filter + Search button */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text" value={draftKeyword}
            onChange={e => setDraftKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Search jobs…"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.30)', background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', fontSize: 14, color: '#263238', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
          />
          <button
  type="button"
  onClick={() => setFilterDrawerOpen(true)}
  aria-label="Filter jobs"
  style={{
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 12,
    background: activeFilterCount > 0 ? '#FF7043' : 'rgba(255,255,255,0.80)',
    border: '1px solid rgba(255,255,255,0.30)',
    color: activeFilterCount > 0 ? 'white' : '#546E7A',
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  }}
>
  ⚲
  {activeFilterCount > 0 && (
    <span
      style={{
        position: 'absolute',
        top: -6,
        right: -6,
        background: 'white',
        color: '#FF7043',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 900,
        padding: '1px 5px',
        border: '1.5px solid #FF7043',
        lineHeight: 1.4,
      }}
    >
      {activeFilterCount}
    </span>
  )}
</button>
          <button type="button" onClick={applyFilters}
            style={{ padding: '10px 16px', borderRadius: 12, background: '#FF7043', color: 'white', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(255,112,67,0.35)' }}>
            Search
          </button>
        </div>

        <div style={{ fontSize: 12, color: '#78909C', fontWeight: 600, paddingLeft: 2 }}>
          Showing {filteredJobs.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredJobs.length)} of {filteredJobs.length} jobs
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pagedJobs.map(job => (
            <JobListCard key={job.id} job={job} isSelected={selectedJob?.id === job.id} onClick={() => handleSelectJob(job)} getJobStatus={getJobStatus} isInternalJob={isInternalJob} getJobTier={getJobTier} />
          ))}
          {pagedJobs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(255,255,255,0.70)', borderRadius: 14, color: '#78909C', fontSize: 14 }}>No jobs match your filters.</div>
          )}
        </div>

        {filteredJobs.length > pageSize && (
          <nav style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 12, flexWrap: 'wrap', paddingTop: 4 }}>
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CFD8DC', background: currentPage === 1 ? '#ECEFF1' : 'white', cursor: currentPage === 1 ? 'default' : 'pointer', fontWeight: 500 }}>First</button>
            {pageNumbers.map(p => <button key={p} type="button" onClick={() => setCurrentPage(p)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CFD8DC', background: p === currentPage ? '#FF7043' : 'white', color: p === currentPage ? 'white' : '#263238', cursor: p === currentPage ? 'default' : 'pointer', fontWeight: p === currentPage ? 700 : 500 }}>{p}</button>)}
            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CFD8DC', background: currentPage === totalPages ? '#ECEFF1' : 'white', cursor: currentPage === totalPages ? 'default' : 'pointer', fontWeight: 500 }}>Last</button>
          </nav>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
          <Card as="section">
            <CardHeader><CardTitle style={{ color: '#FF7043', fontSize: 16 }}>Recently Viewed</CardTitle></CardHeader>
            <CardContent>{recentViewed.length === 0 ? <p style={{ color: '#999', fontStyle: 'italic', margin: 0, fontSize: 13 }}>None yet.</p> : <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>{recentViewed.map(job => <li key={`${job.id}-${job.title}`}>{job.title}</li>)}</ul>}</CardContent>
          </Card>
          <Card as="section">
            <CardHeader><CardTitle style={{ color: '#FF7043', fontSize: 16 }}>Applied</CardTitle></CardHeader>
            <CardContent>{appliedJobs.length === 0 ? <p style={{ color: '#999', fontStyle: 'italic', margin: 0, fontSize: 13 }}>None yet.</p> : <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>{appliedJobs.map(job => <li key={`${job.id}-${job.title}`}>{job.title}</li>)}</ul>}</CardContent>
          </Card>
        </div>

        <MobileFilterDrawer
          open={filterDrawerOpen}
          onClose={() => { applyFilters(); setFilterDrawerOpen(false); }}
          filterProps={{
            keyword: draftKeyword, setKeyword: setDraftKeyword,
            companyFilter: draftCompany, setCompanyFilter: setDraftCompany,
            locationFilter: draftLocation, setLocationFilter: setDraftLocation,
            locationTypeFilter: draftLocationType, setLocationTypeFilter: setDraftLocationType,
            sourceFilter: draftSource, setSourceFilter: setDraftSource,
            daysFilter: draftDays, setDaysFilter: setDraftDays,
            filteredCount: filteredJobs.length, totalCount: jobs.length,
            pageSize, setPageSize, currentPage, startIndex,
          }}
        />

        {mobileDetailOpen && selectedJob && (
          <MobileJobDetail
            job={selectedJob}
            onBack={() => setMobileDetailOpen(false)}
            getJobStatus={getJobStatus}
            isInternalJob={isInternalJob}
            getJobTier={getJobTier}
            isJobPinned={isJobPinned}
            hasApplied={hasAppliedToSelected}
            isPaidUser={isPaidUser}
            onApply={handleApplyClick}
            onResumeAlign={handleResumeAlign}
            onImproveResume={handleSendToResumeBuilder}
          />
        )}

        <ATSResultPanel open={atsPanelOpen} onClose={() => setAtsPanelOpen(false)} loading={atsLoading} error={atsError} result={atsResult} onImproveResume={handleSendToResumeBuilder} />
      </div>
    );
  }

  // ── DESKTOP LAYOUT ────────────────────────────────────────
  return (
    <div className="px-4 md:px-8 pb-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.7fr)] gap-6">
        <div className="space-y-4">
          <header style={{ ...GLASS, padding: '20px 24px', textAlign: 'center' }}>
            <h1 style={{ color: '#FF7043', fontSize: 28, fontWeight: 800, margin: 0 }}>Job Listings</h1>
            <p style={{ margin: '8px 0 0', color: '#546E7A', fontSize: 14 }}>Explore openings, review full details, and apply with confidence.</p>
          </header>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200 }}>
            {/* FIX #1: Filter panel with draft state + Apply Filters button */}
            <Card as="section" aria-labelledby="jobs-filter-heading">
              <CardHeader>
                <h2 id="jobs-filter-heading" style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#263238' }}>Filter jobs</h2>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label htmlFor="jobs-filter-keywords" style={{ fontSize: 12, color: '#78909C' }}>Keywords</label>
                    <input id="jobs-filter-keywords" type="text" value={draftKeyword} onChange={e => setDraftKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} placeholder="Title, skills, tags..." style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label htmlFor="jobs-filter-company" style={{ fontSize: 12, color: '#78909C' }}>Company Name</label>
                    <input id="jobs-filter-company" type="text" value={draftCompany} onChange={e => setDraftCompany(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} placeholder="Company..." style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label htmlFor="jobs-filter-location" style={{ fontSize: 12, color: '#78909C' }}>Location</label>
                    <input id="jobs-filter-location" type="text" value={draftLocation} onChange={e => setDraftLocation(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} placeholder="City, region, country..." style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label htmlFor="jobs-filter-location-type" style={{ fontSize: 12, color: '#78909C' }}>Location Type</label>
                    <select id="jobs-filter-location-type" value={draftLocationType} onChange={e => setDraftLocationType(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14, backgroundColor: 'white' }}>
                      <option value="">All</option><option value="Remote">Remote</option><option value="Hybrid">Hybrid</option><option value="On-site">On-site</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label htmlFor="jobs-filter-source" style={{ fontSize: 12, color: '#78909C' }}>Source</label>
                    <select id="jobs-filter-source" value={draftSource} onChange={e => setDraftSource(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14, backgroundColor: 'white' }}>
                      <option value="">All sources</option><option value="external">External only</option><option value="internal">Forge recruiters only</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label htmlFor="jobs-filter-days" style={{ fontSize: 12, color: '#78909C' }}>Posted in last (days)</label>
                    <input id="jobs-filter-days" type="number" min="1" value={draftDays} onChange={e => setDraftDays(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters()} placeholder="e.g. 7" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #CFD8DC', fontSize: 14 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#78909C' }}>
                    Showing {filteredJobs.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredJobs.length)} of {filteredJobs.length} jobs
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#78909C' }}>Jobs per page:</span>
                    <select aria-label="Jobs per page" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CFD8DC', fontSize: 12, backgroundColor: 'white' }}>
                      <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                    </select>
                    {activeFilterCount > 0 && (
                      <button type="button" onClick={clearFilters} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #CFD8DC', background: 'white', color: '#78909C', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                        Clear
                      </button>
                    )}
                    <button type="button" onClick={applyFilters}
                      style={{ padding: '7px 20px', borderRadius: 8, background: '#FF7043', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(255,112,67,0.30)' }}>
                      Apply Filters
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.5fr)', gap: 16, alignItems: 'flex-start' }}>
              <section aria-label="Job results" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pagedJobs.map(job => {
                    const rawDesc      = job.description || '';
                    const cleanDesc    = stripMarkdown(rawDesc.replace(/<[^>]*>/g, ''));
                    const snippet      = cleanDesc.length > 160 ? `${cleanDesc.slice(0, 160)}…` : cleanDesc;
                    const location     = job.location || '';
                    const locationType = inferLocationType(location);
                    const status       = getJobStatus(job);
                    const internal     = isInternalJob(job);
                    const displaySource = getDisplaySource(job);
                    let postedLabel = 'Date not provided';
                    if (job.publishedat) { const d = new Date(job.publishedat); if (!Number.isNaN(d.getTime())) postedLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
                    const isSelected   = selectedJob && selectedJob.id === job.id;
                    const tier         = getJobTier(job);
                    const isFtOfficial = tier === 'ft-official';
                    const isPartner    = tier === 'partner';
                    const isDarkCard   = isFtOfficial || isPartner;
                    const logoUrl      = job.logoUrl || (isFtOfficial ? '/images/logo-color.png' : null);
                    let cardBackground, cardBorder, cardShadow;
                    if (isFtOfficial)   { cardBackground = 'linear-gradient(135deg, #FF7043, #FF8A65)'; cardBorder = isSelected ? '2px solid #FFFFFF' : '1px solid #FFCC80'; cardShadow = '0 0 20px rgba(0,0,0,0.45)'; }
                    else if (isPartner) { cardBackground = 'linear-gradient(135deg, #0B1724, #112033)'; cardBorder = isSelected ? '2px solid #FF7043' : '1px solid rgba(255,112,67,0.7)'; cardShadow = '0 0 18px rgba(0,0,0,0.5)'; }
                    else                { cardBackground = '#FFFFFF'; cardBorder = isSelected ? '2px solid #FF7043' : '1px solid #e0e0e0'; cardShadow = '0 2px 6px rgba(0,0,0,0.04)'; }
                    const titleColor  = isDarkCard ? '#FFFFFF' : '#263238';
                    const subtleColor = isDarkCard ? '#CFD8DC' : '#607D8B';
                    const textColor   = isDarkCard ? '#ECEFF1' : '#455A64';
                    const chipLabel   = isFtOfficial ? 'ForgeTomorrow official posting' : internal ? 'ForgeTomorrow recruiter partner' : null;
                    const showSnippet = internal;
                    return (
                      <Card key={job.id} as="article" aria-label={`${job.title} at ${job.company || 'Unknown company'}`}
                        style={{ cursor: 'pointer', border: cardBorder, background: cardBackground, boxShadow: cardShadow, position: 'relative', overflow: 'hidden', minHeight: 128 }}
                        onClick={() => handleSelectJob(job)}>
                        <CardHeader>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                              {logoUrl && (
                                <div style={{ width: 40, height: 40, borderRadius: 12, overflow: 'hidden', backgroundColor: isFtOfficial ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <img src={logoUrl} alt={`${job.company || 'Company'} logo`} style={{ maxWidth: '70%', maxHeight: '70%', objectFit: 'contain' }} />
                                </div>
                              )}
                              <div>
                                <CardTitle style={{ color: titleColor, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3, maxHeight: '2.6em' }}>{job.title}</CardTitle>
                                <CardSubtle style={{ color: subtleColor }}>{job.company}</CardSubtle>
                                {chipLabel && (
                                  <div style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 8px', borderRadius: 999, border: isFtOfficial ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.2)', background: isFtOfficial ? 'rgba(0,0,0,0.25)' : 'rgba(17,32,51,0.9)', fontSize: 11, color: '#FFCC80' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '999px', backgroundColor: '#FF7043' }} />{chipLabel}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: 120, flexShrink: 0 }}>
                              <div style={{ fontSize: 12, color: subtleColor }}>Posted</div>
                              <div style={{ fontSize: 13, color: isDarkCard ? '#FFFFFF' : '#455A64', fontWeight: 500 }}>{postedLabel}</div>
                            </div>
                          </div>
                          <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13, color: subtleColor }}>
                            <span>{location || 'Location not provided'}</span>
                            {locationType && <span style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(207,216,220,0.7)', fontSize: 12, backgroundColor: isDarkCard ? 'rgba(38,50,56,0.8)' : 'transparent' }}>{locationType}</span>}
                            {internal && displaySource && <span style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(207,216,220,0.7)', fontSize: 12, backgroundColor: isDarkCard ? 'rgba(38,50,56,0.8)' : 'transparent' }}>Source: {displaySource}</span>}
                            {(status === 'Reviewing' || status === 'Closed') && <span style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid #FFCC80', fontSize: 12, backgroundColor: status === 'Reviewing' ? '#FFF3E0' : '#ECEFF1', color: status === 'Reviewing' ? '#E65100' : '#455A64' }}>{status === 'Reviewing' ? 'Reviewing applicants' : 'Closed'}</span>}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {showSnippet && <p style={{ margin: '0 0 10px', color: textColor, fontSize: 14, lineHeight: 1.4 }}>{snippet || 'No description provided.'}</p>}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                {filteredJobs.length > pageSize && (
                  <nav aria-label="Job results pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 12, color: '#78909C', paddingTop: 4, flexWrap: 'wrap' }}>
                    <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CFD8DC', background: currentPage === 1 ? '#ECEFF1' : 'white', cursor: currentPage === 1 ? 'default' : 'pointer', fontWeight: 500 }}>First</button>
                    {startPage > 1 && <span>…</span>}
                    {pageNumbers.map(p => <button key={p} type="button" onClick={() => setCurrentPage(p)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CFD8DC', background: p === currentPage ? '#FF7043' : 'white', color: p === currentPage ? 'white' : '#263238', cursor: p === currentPage ? 'default' : 'pointer', fontWeight: p === currentPage ? 700 : 500 }}>{p}</button>)}
                    {endPage < totalPages && <span>…</span>}
                    <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #CFD8DC', background: currentPage === totalPages ? '#ECEFF1' : 'white', cursor: currentPage === totalPages ? 'default' : 'pointer', fontWeight: 500 }}>Last</button>
                  </nav>
                )}
              </section>

              <section aria-label="Selected job details">
                <Card as="article" style={{ position: 'sticky', top: 0, maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: selectedDetailBorder, boxShadow: selectedIsDark ? '0 0 14px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.06)', background: selectedDetailBackground }}>
                  {selectedJob ? (
                    <>
                      <CardHeader>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {selectedChipLabel && (
                            <div style={{ alignSelf: 'flex-start', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(17,32,51,0.16)', background: 'linear-gradient(135deg, #0B1724, #112033)', fontSize: 11, color: '#FFCC80', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '999px', backgroundColor: '#FF7043' }} />{selectedChipLabel}
                            </div>
                          )}
                          <div>
                            <CardTitle style={{ color: detailTitleColor }}>{selectedJob.title}</CardTitle>
                            <CardSubtle style={{ color: detailSubtleColor }}>{selectedJob.company} — {selectedJob.location || 'Location not provided'}</CardSubtle>
                          </div>
                        </div>
                        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 13, color: detailSubtleColor }}>
                          {inferLocationType(selectedJob.location || '') && <span style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid #CFD8DC', fontSize: 12, backgroundColor: selectedIsDark ? 'rgba(38,50,56,0.8)' : 'transparent', color: selectedIsDark ? '#ECEFF1' : '#455A64' }}>{inferLocationType(selectedJob.location || '')}</span>}
                          {selectedSourceLabel && <span style={{ padding: '2px 8px', borderRadius: 999, border: '1px solid #CFD8DC', fontSize: 12, backgroundColor: selectedIsDark ? 'rgba(38,50,56,0.8)' : 'transparent', color: selectedIsDark ? '#ECEFF1' : '#455A64' }}>Source: {selectedSourceLabel}</span>}
                        </div>
                      </CardHeader>
                      <CardContent style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden', minHeight: 0 }}>
						<div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, minHeight: 0 }}>
                          {(() => {
                            const raw = stripMarkdown((selectedJob.description || '').replace(/<[^>]*>/g, ''));
                            const paragraphs = raw.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
                            if (paragraphs.length === 0) return <p style={{ margin: 0, color: detailBodyColor, fontSize: 14, lineHeight: 1.6 }}>No description provided.</p>;
                            return paragraphs.map((para, idx) => <p key={idx} style={{ margin: idx === 0 ? '0 0 10px' : '10px 0 0', color: detailBodyColor, fontSize: 14, lineHeight: 1.6 }}>{para}</p>);
                          })()}
                        </div>
                        {selectedStatus === 'Open' && <JobActions job={selectedJob} isPinned={isJobPinned(selectedJob)} onApply={handleApplyClick} onResumeAlign={handleResumeAlign} isPaidUser={isPaidUser} showViewPost={false} />}
                        {selectedStatus === 'Reviewing' && (
                          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid #FFCC80', backgroundColor: '#FFF3E0', fontSize: 12, color: '#E65100' }}>
                            <p style={{ margin: 0, fontWeight: 600 }}>{hasAppliedToSelected ? 'Thank you for applying.' : 'This employer is now reviewing applicants.'}</p>
                            <p style={{ margin: '4px 0 0' }}>{hasAppliedToSelected ? "This employer is reviewing applicants for this role." : 'New applications are paused.'}</p>
                          </div>
                        )}
                        {selectedStatus === 'Closed' && (
                          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, border: '1px solid #CFD8DC', backgroundColor: '#ECEFF1', fontSize: 12, color: '#455A64' }}>
                            <p style={{ margin: 0, fontWeight: 600 }}>{hasAppliedToSelected ? 'Thank you for applying.' : 'This posting is now closed.'}</p>
                            <p style={{ margin: '4px 0 0' }}>{hasAppliedToSelected ? 'If selected, the employer will reach out directly.' : 'Stay tuned for future opportunities.'}</p>
                          </div>
                        )}
                      </CardContent>
                    </>
                  ) : (
                    <CardContent>
                      <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#263238' }}>Select a job</h3>
                      <p style={{ color: '#78909C', fontSize: 14 }}>Choose a job from the list on the left to view full details here.</p>
                    </CardContent>
                  )}
                </Card>
              </section>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <Card as="section" aria-labelledby="jobs-recent-heading">
                <CardHeader><CardTitle id="jobs-recent-heading" style={{ color: '#FF7043', fontSize: 20 }}>Recently Viewed</CardTitle></CardHeader>
                <CardContent>{recentViewed.length === 0 ? <p style={{ color: '#999', fontStyle: 'italic', margin: 0 }}>No jobs viewed yet.</p> : <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>{recentViewed.map(job => <li key={`${job.id}-${job.title}`}>{job.title}</li>)}</ul>}</CardContent>
              </Card>
              <Card as="section" aria-labelledby="jobs-applied-heading">
                <CardHeader><CardTitle id="jobs-applied-heading" style={{ color: '#FF7043', fontSize: 20 }}>Applied Jobs</CardTitle></CardHeader>
                <CardContent>{appliedJobs.length === 0 ? <p style={{ color: '#999', fontStyle: 'italic', margin: 0 }}>No applications yet.</p> : <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>{appliedJobs.map(job => <li key={`${job.id}-${job.title}`}>{job.title}</li>)}</ul>}</CardContent>
              </Card>
            </div>
          </div>
        </div>

        <aside className="hidden lg:block" aria-label="Job tools">
          <nav style={{ display: 'grid', gap: 12, minWidth: 0 }}>
            <div style={{ ...GLASS, padding: 14, minWidth: 0, boxSizing: 'border-box' }}>
              <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 14, color: '#112033' }}>Sponsored</div>
              <RightRailPlacementManager slot="right_rail_1" />
            </div>
          </nav>
        </aside>
      </div>

      <div className="lg:hidden mt-6">
        <div style={{ ...GLASS, padding: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 14, color: '#112033' }}>Sponsored</div>
          <RightRailPlacementManager slot="right_rail_1" />
        </div>
      </div>

      <ATSResultPanel open={atsPanelOpen} onClose={() => setAtsPanelOpen(false)} loading={atsLoading} error={atsError} result={atsResult} onImproveResume={handleSendToResumeBuilder} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// NEW UI — unchanged, with FIX #3 applied
// ──────────────────────────────────────────────────────────────
function NewJobsUI() {
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

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 4px 100px' }}>
        <JobsPageHeader totalCount={filteredJobs.length} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Search jobs…"
            style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.30)', background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', fontSize: 14, color: '#263238', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
          <button type="button" onClick={() => setFilterDrawerOpen(true)}
            style={{ position: 'relative', padding: '10px 14px', borderRadius: 12, background: activeFilterCount > 0 ? '#FF7043' : 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.30)', color: activeFilterCount > 0 ? 'white' : '#546E7A', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}>
            Filters
            {activeFilterCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: 'white', color: '#FF7043', borderRadius: 999, fontSize: 10, fontWeight: 900, padding: '1px 5px', border: '1.5px solid #FF7043', lineHeight: 1.4 }}>{activeFilterCount}</span>}
          </button>
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
        <MobileFilterDrawer open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)} filterProps={filterProps} />
        {mobileDetailOpen && selectedJob && (
          <MobileJobDetail job={selectedJob} onBack={() => setMobileDetailOpen(false)} getJobStatus={getJobStatus} isInternalJob={isInternalJob} getJobTier={getJobTier} isJobPinned={isJobPinned} hasApplied={hasAppliedToSelected} isPaidUser={isPaidUser} onApply={handleApplyClick} onResumeAlign={handleResumeAlign} onImproveResume={handleImproveResume} />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <JobsPageHeader totalCount={filteredJobs.length} />
      <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0,1.6fr) minmax(0,1.5fr)', gap: 16, alignItems: 'flex-start' }}>
        <aside style={{ position: 'sticky', top: 16, ...GLASS, padding: '18px 16px', borderRadius: 14 }}>
          <JobFilterPanel {...filterProps} mode="sidebar" />
        </aside>
        <section aria-label="Job results" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: '#78909C', fontWeight: 600, padding: '0 2px' }}>
            {filteredJobs.length === 0 ? 'No jobs found' : `${startIndex + 1}–${Math.min(startIndex + pageSize, filteredJobs.length)} of ${filteredJobs.length}`}
          </div>
          <div style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
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
      <div style={{ ...GLASS, padding: 14 }}>
        <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 14, color: '#112033' }}>Sponsored</div>
        <RightRailPlacementManager slot="right_rail_1" />
      </div>
      <JobsBottomRow viewedJobs={viewedJobs} appliedJobs={appliedJobs} onSelectJob={handleSelectJob} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ROUTER
// ──────────────────────────────────────────────────────────────
function Jobs() {
  const router = useRouter();
  if (router.query.newui === '1') return <NewJobsUI />;
  return <OldJobsUI />;
}

export default function JobsPage() {
  return (
    <InternalLayout activeNav="jobs">
      <JobPipelineProvider>
        <Jobs />
      </JobPipelineProvider>
    </InternalLayout>
  );
}