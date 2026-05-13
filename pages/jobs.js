// pages/jobs.js
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { JobPipelineProvider, useJobPipeline } from '../context/JobPipelineContext';
import JobsLayout from '../components/layouts/JobsLayout';
import SeekerTitleCard from '@/components/seeker/SeekerTitleCard';
import { normalizeJobText } from '../lib/jd/ingest';
import { isInternalJob, getJobTier } from '../lib/jobs/jobSource';
import { getTimeGreeting } from '@/lib/dashboardGreeting';
import JobListCard from '../components/jobs/JobListCard';
import JobPagination from '../components/jobs/JobPagination';
import JobDetailPanel from '../components/jobs/JobDetailPanel';
import MobileJobDetail from '../components/jobs/MobileJobDetail';
import JobsBottomRow from '../components/jobs/JobsBottomRow';
import JobSearchFilters from '../components/jobs/JobSearchFilters';
import { normalizeLocationQuery } from '../lib/intelligence/forgeJobMatchEngine';
import { rankJobsBySearchRelevance } from '../lib/intelligence/forgeSearchEngine';

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
  if (job.title) parts.push(job.title);
  if (job.company) parts.push(job.company);
  parts.push('careers');
  return `https://www.google.com/search?q=${encodeURIComponent(parts.join(' '))}`;
}

function getJobStatus(job) {
  const raw = (job?.status || '').toString().trim();
  if (!raw) return 'Open';

  const upper = raw.toUpperCase();

  if (upper === 'DRAFT') return 'Draft';
  if (upper === 'OPEN' || upper === 'PUBLISHED') return 'Open';
  if (upper === 'REVIEWING' || upper === 'REVIEWING APPLICANTS') return 'Reviewing';
  if (upper === 'CLOSED' || upper === 'EXPIRED') return 'Closed';

  return 'Open';
}

function ForgeAlignmentExplainer() {
  return (
    <div
      style={{
        ...GLASS,
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'rgba(255,255,255,0.72)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: 'rgba(255,112,67,0.14)',
            color: '#FF7043',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            fontWeight: 900,
            flexShrink: 0,
          }}
        >
          ⚡
        </div>

        <div style={{ fontSize: 15, fontWeight: 800, color: '#112033' }}>
          Forge Alignment
        </div>
      </div>

      <div style={{ fontSize: 13, lineHeight: 1.6, color: '#455A64' }}>
        Search using keywords and filters. ForgeTomorrow then evaluates your
        primary resume, profile, portfolio, and preferences to determine how
        strongly you align with each opportunity.
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
        <div
          style={{
            padding: '5px 10px',
            borderRadius: 999,
            background: 'rgba(255,112,67,0.10)',
            border: '1px solid rgba(255,112,67,0.20)',
            fontSize: 11,
            fontWeight: 700,
            color: '#FF7043',
          }}
        >
          Alignment scores visible to all users
        </div>

        <div
          style={{
            padding: '5px 10px',
            borderRadius: 999,
            background: 'rgba(26,75,143,0.08)',
            border: '1px solid rgba(26,75,143,0.18)',
            fontSize: 11,
            fontWeight: 700,
            color: '#1A4B8F',
          }}
        >
          Free users: 3 detailed explanations monthly
        </div>

        <div
          style={{
            padding: '5px 10px',
            borderRadius: 999,
            background: 'rgba(67,160,71,0.08)',
            border: '1px solid rgba(67,160,71,0.18)',
            fontSize: 11,
            fontWeight: 700,
            color: '#2E7D32',
          }}
        >
          Pro users: unlimited explanations
        </div>
      </div>
    </div>
  );
}

function JobsUI() {
  const router = useRouter();
  const isMobile = useIsMobile(768);

  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const { viewedJobs, appliedJobs, addViewedJob, addAppliedJob } = useJobPipeline();
  const selectedJobCardRef = useRef(null);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [userHasSelected, setUserHasSelected] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferenceSaveStatus, setPreferenceSaveStatus] = useState('');

  const isPaidUser = true;

  const saveDraft = async (key, content) => {
    try {
      const res = await fetch('/api/drafts/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, content }),
      });
      return res.ok;
    } catch (err) {
      console.error('[Jobs] saveDraft failed', key, err);
      return false;
    }
  };

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        const loadedJobs = (data && data.jobs) || [];

        try {
          const alignRes = await fetch('/api/jobs/alignment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobs: loadedJobs }),
          });

          if (alignRes.ok) {
            const alignData = await alignRes.json();
            setJobs((alignData && alignData.jobs) || loadedJobs);
            return;
          }
        } catch (alignErr) {
          console.error('[Jobs] alignment load failed', alignErr);
        }

        setJobs(loadedJobs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchJobs();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPinned() {
      try {
        const res = await fetch('/api/seeker/pinned-jobs');
        if (!res.ok) return;

        const data = await res.json();
        const ids = new Set((data.jobs || []).map((j) => j.id));

        if (!cancelled) setPinnedIds(ids);
      } catch (err) {
        console.error('[Jobs] failed to load pinned jobs', err);
      }
    }

    loadPinned();

    return () => {
      cancelled = true;
    };
  }, []);

  const isJobPinned = (job) => !!job && pinnedIds.has(job.id);

  const handleApplyClick = (job) => {
    if (!job) return;

    const internal = isInternalJob(job);
    const applyLink = getApplyLink(job);

    if (!internal) {
      const finalUrl = applyLink || buildFallbackSearch(job);
      addAppliedJob(job);

      if (typeof window !== 'undefined') {
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      }

      return;
    }

    if (typeof window !== 'undefined') {
      window.location.href = withChrome(`/job/${encodeURIComponent(job.id)}/apply`);
    }
  };

  const handleResumeAlign = async (job) => {
    if (!job) return;

    try {
      const raw = job.description || '';
      const clean = normalizeJobText(raw);

      if (clean?.trim()) await saveDraft('ft_last_job_text', clean);

      await saveDraft('forge-ats-pack', {
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          description: raw,
        },
        ats: {
          score: null,
          summary: '',
          recommendations: [],
        },
      });
    } catch (err) {
      console.error('[Jobs] Failed to store job context', err);
    }

    if (typeof window !== 'undefined') {
      window.location.href = withChrome(`/resume/create?from=match&jobId=${job.id}&copyJD=true`);
    }
  };

  const handleImproveResume = async (job, atsResult) => {
    if (!job || !atsResult) return;

    const pack = {
      job: {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
      },
      ats: atsResult,
    };

    try {
      const res = await fetch('/api/drafts/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'forge-ats-pack', content: pack }),
      });

      if (!res.ok) console.warn('[Jobs] failed to write match pack', res.status);
    } catch (err) {
      console.error('[Jobs] failed to write match pack', err);
    }

    if (typeof window !== 'undefined') {
      window.location.href = withChrome(`/resume/create?from=match&jobId=${job.id}&copyJD=true`);
    }
  };


  const handleSaveDashboardPreferences = async () => {
    setSavingPreferences(true);
    setPreferenceSaveStatus('');

    try {
      const res = await fetch('/api/seeker/job-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          company: companyFilter,
          location: locationFilter,
          locationType: locationTypeFilter,
          source: sourceFilter,
          days: daysFilter,
        }),
      });

      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      setPreferenceSaveStatus('saved');
    } catch (err) {
      console.error('[Jobs] failed to save dashboard job preferences', err);
      setPreferenceSaveStatus('error');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSelectJob = (job) => {
    setUserHasSelected(true);
    setSelectedJob(job);
    addViewedJob(job);

    if (isMobile) setMobileDetailOpen(true);
  };

  const normalizedCompany = companyFilter.trim().toLowerCase();
  const parsedDays = parseInt(daysFilter, 10);
  const hasDaysFilter = !Number.isNaN(parsedDays) && parsedDays > 0;
  const now = new Date();
  const cutoffTime = hasDaysFilter ? now.getTime() - parsedDays * 24 * 60 * 60 * 1000 : null;

  const rawFilteredJobs = jobs.filter((job) => {
    const status = getJobStatus(job);

    if (status === 'Draft') return false;

    if (status === 'Closed') {
      const threeDaysAgo = now.getTime() - 3 * 24 * 60 * 60 * 1000;
      const updated = job.updatedAt || job.updatedat || job.updated_at || job.publishedat || null;

      if (updated) {
        const d = new Date(updated);
        if (!Number.isNaN(d.getTime()) && d.getTime() < threeDaysAgo) return false;
      }
    }

    const company = (job.company || '').toLowerCase();

    if (normalizedCompany && !company.includes(normalizedCompany)) return false;
    if (locationTypeFilter && inferLocationType(job.location || '') !== locationTypeFilter) return false;

    if (sourceFilter) {
      const internal = isInternalJob(job);

      if (sourceFilter === 'external' && internal) return false;
      if (sourceFilter === 'internal' && !internal) return false;
    }

    if (hasDaysFilter) {
      if (!job.publishedat) return false;

      const d = new Date(job.publishedat);
      if (Number.isNaN(d.getTime()) || d.getTime() < cutoffTime) return false;
    }

    return true;
  });

  const rankedJobs = rankJobsBySearchRelevance(rawFilteredJobs, {
    keyword,
    company: companyFilter,
    location: normalizeLocationQuery(locationFilter),
    locationType: locationTypeFilter,
    source: sourceFilter,
  });

  const hasSearchIntent =
    keyword.trim() ||
    companyFilter.trim() ||
    locationFilter.trim() ||
    locationTypeFilter ||
    sourceFilter;

  const filteredJobs = hasSearchIntent
    ? rankedJobs.filter((job) => (job.searchScore || 0) > 24)
    : rankedJobs;
	
	  useEffect(() => {
    if (!router.isReady) return;
    if (!jobs.length) return;

    const selectedJobId = router.query.selectedJobId;
    if (!selectedJobId) return;

    const matchedJob = jobs.find(
      (job) => String(job.id) === String(selectedJobId)
    );

    if (!matchedJob) return;

    const filteredIndex = filteredJobs.findIndex(
      (job) => String(job.id) === String(selectedJobId)
    );

    if (filteredIndex >= 0) {
      const targetPage = Math.floor(filteredIndex / pageSize) + 1;
      setCurrentPage(targetPage);
    }

    setSelectedJob(matchedJob);
    setUserHasSelected(true);
    addViewedJob(matchedJob);

    if (isMobile) {
      setMobileDetailOpen(true);
    }
  }, [
    router.isReady,
    router.query.selectedJobId,
    jobs,
    filteredJobs,
    pageSize,
    isMobile,
    addViewedJob,
  ]);

  useEffect(() => {
    const total = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
    if (currentPage > total) setCurrentPage(1);
  }, [filteredJobs.length, pageSize, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

useEffect(() => {
  if (!selectedJob?.id) return;
  if (!selectedJobCardRef.current) return;

  selectedJobCardRef.current.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });
}, [selectedJob?.id, currentPage]);

  useEffect(() => {
    if (userHasSelected) return;

    if (!selectedJob && pagedJobs.length > 0) {
      setSelectedJob(pagedJobs[0]);
      return;
    }

    if (selectedJob) {
      const stillVisible = pagedJobs.some((j) => j && j.id === selectedJob.id);
      if (!stillVisible) setSelectedJob(pagedJobs.length > 0 ? pagedJobs[0] : null);
    }
  }, [pagedJobs]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasAppliedToSelected =
    !!selectedJob && appliedJobs.some((j) => j && j.id === selectedJob.id);

  const activeFilterCount = [
    keyword,
    companyFilter,
    locationFilter,
    locationTypeFilter,
    sourceFilter,
    daysFilter,
  ].filter(Boolean).length;

  const filterProps = {
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
    filteredCount: filteredJobs.length,
    totalCount: jobs.length,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    startIndex,
    filterOpen,
    setFilterOpen,
    activeFilterCount,
    onSavePreferences: handleSaveDashboardPreferences,
    savingPreferences,
    preferenceSaveStatus,
  };

  if (isMobile === null || loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#78909C' }} aria-busy="true">
        Loading jobs…
      </div>
    );
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

        <ForgeAlignmentExplainer />

        <JobSearchFilters isMobile={true} {...filterProps} />

        <div style={{ fontSize: 12, color: '#78909C', fontWeight: 600, paddingLeft: 2 }}>
          Showing {filteredJobs.length === 0 ? 0 : startIndex + 1}–
          {Math.min(startIndex + pageSize, filteredJobs.length)} of {filteredJobs.length} jobs
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pagedJobs.map((job) => (
            <div key={job.id} ref={selectedJob?.id === job.id ? selectedJobCardRef : null}>
  <JobListCard
    job={job}
    isSelected={selectedJob?.id === job.id}
    onClick={() => handleSelectJob(job)}
    getJobStatus={getJobStatus}
    isInternalJob={isInternalJob}
    getJobTier={getJobTier}
  />
</div>
          ))}

          {pagedJobs.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'rgba(255,255,255,0.70)',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.30)',
                color: '#78909C',
                fontSize: 14,
              }}
            >
              No jobs match your filters.
            </div>
          )}
        </div>

        <JobPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

        <JobsBottomRow viewedJobs={viewedJobs} appliedJobs={appliedJobs} onSelectJob={handleSelectJob} />

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
            onImproveResume={handleImproveResume}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SeekerTitleCard
        greeting={greeting}
        title="Job Listings"
        subtitle="Explore openings, review full details, and apply with confidence."
      />

      <ForgeAlignmentExplainer />

      <JobSearchFilters isMobile={false} {...filterProps} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)',
          gap: 16,
          alignItems: 'flex-start',
        }}
      >
        <section aria-label="Job results" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: '#78909C', fontWeight: 600, padding: '0 2px' }}>
            {filteredJobs.length === 0
              ? 'No jobs found'
              : `${startIndex + 1}–${Math.min(startIndex + pageSize, filteredJobs.length)} of ${filteredJobs.length}`}
          </div>

          <div
            style={{
              maxHeight: 'calc(100vh - 220px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              paddingRight: 4,
            }}
          >
            {pagedJobs.map((job) => (
              <div key={job.id} ref={selectedJob?.id === job.id ? selectedJobCardRef : null}>
  <JobListCard
    job={job}
    isSelected={selectedJob?.id === job.id}
    onClick={() => handleSelectJob(job)}
    getJobStatus={getJobStatus}
    isInternalJob={isInternalJob}
    getJobTier={getJobTier}
  />
</div>
            ))}

            {pagedJobs.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  background: 'rgba(255,255,255,0.70)',
                  borderRadius: 14,
                  color: '#78909C',
                  fontSize: 14,
                }}
              >
                No jobs match your filters.
              </div>
            )}
          </div>

          <JobPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </section>

        <section
          aria-label="Selected job details"
          style={{
            position: 'sticky',
            top: 16,
            height: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <JobDetailPanel
            job={selectedJob}
            getJobStatus={getJobStatus}
            isInternalJob={isInternalJob}
            getJobTier={getJobTier}
            isJobPinned={isJobPinned}
            hasApplied={hasAppliedToSelected}
            isPaidUser={isPaidUser}
            onApply={handleApplyClick}
            onResumeAlign={handleResumeAlign}
            onImproveResume={handleImproveResume}
          />
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
