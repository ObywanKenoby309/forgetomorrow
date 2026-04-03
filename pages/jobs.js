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
      <SeekerTitleCard
        greeting="Forge Jobs"
        title="Find Your Next Opportunity"
        subtitle={`${filteredJobs.length} jobs available`}
        isMobile={true}
      />
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
    <SeekerTitleCard
      greeting="Forge Jobs"
      title="Find Your Next Opportunity"
      subtitle={`${filteredJobs.length} jobs available`}
    />
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

export default function JobsPage() {
  return (
    <JobsLayout activeNav="jobs">
      <JobPipelineProvider>
        <JobsUI />
      </JobPipelineProvider>
    </JobsLayout>
  );
}