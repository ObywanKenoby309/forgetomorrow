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
          Paid subscriptions: 15 explanations monthly
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
  const [totalJobCount, setTotalJobCount] = useState(0);
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const [selectedJob, setSelectedJob] = useState(null);
  const [userHasSelected, setUserHasSelected] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [profileSignal, setProfileSignal] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    keyword: '',
    company: '',
    location: '',
    locationType: '',
    source: '',
    days: '',
  });

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
    let cancelled = false;

    async function fetchJobs() {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(pageSize),
        });

        if (appliedFilters.keyword.trim()) {
          params.set('keyword', appliedFilters.keyword.trim());
        }

        if (appliedFilters.company.trim()) {
          params.set('company', appliedFilters.company.trim());
        }

        if (appliedFilters.location.trim()) {
          params.set('location', appliedFilters.location.trim());
        }

        if (appliedFilters.locationType) {
          params.set('locationType', appliedFilters.locationType);
        }

        if (appliedFilters.source) {
          params.set('source', appliedFilters.source);
        }

        if (appliedFilters.days) {
          params.set('days', appliedFilters.days);
        }

        const res = await fetch(`/api/jobs?${params.toString()}`);
        const data = await res.json();

        if (cancelled) return;

        const loadedJobs = Array.isArray(data?.jobs) ? data.jobs : [];

        setJobs(loadedJobs);
        setTotalJobCount(Number(data?.totalCount || loadedJobs.length || 0));
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [currentPage, pageSize, appliedFilters]);

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
      whyScore: atsResult?.score ?? null,
      whySummary: atsResult?.summary ?? null,
      largestStrength: atsResult?.largestStrength ?? null,
      largestGap: atsResult?.largestGap ?? null,
      source: 'jobs-check-fit',
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
      window.location.href = withChrome(`/resume/create?from=ats&jobId=${job.id}&copyJD=true`);
    }
  };

  const handleApplyFilters = (nextFilters) => {
    setCurrentPage(1);
    setAppliedFilters(
      nextFilters || {
        keyword,
        company: companyFilter,
        location: locationFilter,
        locationType: locationTypeFilter,
        source: sourceFilter,
        days: daysFilter,
      }
    );
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

  const filteredJobs = jobs;

  useEffect(() => {
    if (!router.isReady) return;

    const selectedJobId = router.query.selectedJobId;
    if (!selectedJobId) return;

    const matchedJob = jobs.find(
      (job) => String(job.id) === String(selectedJobId)
    );

    if (matchedJob) {
      setSelectedJob(matchedJob);
      setUserHasSelected(true);
      addViewedJob(matchedJob);

      if (isMobile) {
        setMobileDetailOpen(true);
      }

      return;
    }

    let cancelled = false;

    async function fetchSelectedJob() {
      try {
        const res = await fetch(`/api/jobs?jobId=${encodeURIComponent(selectedJobId)}`);
        if (!res.ok) return;

        const data = await res.json();
        const job = data?.job;

        if (cancelled || !job) return;

        setSelectedJob(job);

setJobs((prevJobs) => {
  const exists = prevJobs.some((j) => String(j.id) === String(job.id));
  if (exists) return prevJobs;

  return [job, ...prevJobs];
});

setUserHasSelected(true);
addViewedJob(job);

        if (isMobile) {
          setMobileDetailOpen(true);
        }
      } catch (err) {
        console.error('[Jobs] failed to fetch selected job', err);
      }
    }

    fetchSelectedJob();

    return () => {
      cancelled = true;
    };
  }, [
    router.isReady,
    router.query.selectedJobId,
    jobs,
    isMobile,
    addViewedJob,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalJobCount / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedJobs = filteredJobs;
useEffect(() => {
  let cancelled = false;

  async function alignSelectedJob() {
    if (!selectedJob || loading) return;

    try {
      const alignRes = await fetch('/api/jobs/alignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs: [selectedJob],
        }),
      });

      if (!alignRes.ok) return;

      const alignData = await alignRes.json();
      const alignedJob = Array.isArray(alignData?.jobs)
        ? alignData.jobs[0]
        : null;

      if (cancelled || !alignedJob) return;

      const nextProfileSignal =
  alignedJob?.jdProfileSignal ||
  alignData?.profileSignal ||
  null;

      setProfileSignal(nextProfileSignal);

      setSelectedJob((prev) => {
        if (!prev || String(prev.id) !== String(alignedJob.id)) return prev;
        return {
  ...prev,
  ...alignedJob,
  match: prev?.match ?? alignedJob?.match,  // preserve original search relevance
  jdProfileSignal: nextProfileSignal,
};
      });
    } catch (err) {
      console.error('[Jobs] selected alignment load failed', err);
    }
  }

  alignSelectedJob();

  return () => {
    cancelled = true;
  };
}, [selectedJob?.id, loading]);
useEffect(() => {
  if (!selectedJob?.id) return;
  const refreshedSelectedJob = jobs.find(
    (job) => String(job.id) === String(selectedJob.id)
  );
  if (!refreshedSelectedJob) return;
  // Merge to preserve alignment data already loaded (jdProfileSignal etc)
  setSelectedJob((prev) => ({
    ...refreshedSelectedJob,
    jdProfileSignal: prev?.jdProfileSignal ?? refreshedSelectedJob?.jdProfileSignal,
    match: prev?.match ?? refreshedSelectedJob?.match,
  }));
}, [jobs, selectedJob?.id]);

useEffect(() => {
  if (!selectedJob?.id) return;

  const node = selectedJobCardRef.current;

  if (!node || typeof node.scrollIntoView !== 'function') return;

  requestAnimationFrame(() => {
    node.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
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

  const hasAppliedSearch = Object.values(appliedFilters || {}).some((value) =>
    String(value || '').trim()
  );

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
    filteredCount: totalJobCount,
    totalCount: totalJobCount,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    startIndex,
    filterOpen,
    setFilterOpen,
    activeFilterCount,
    onApplyFilters: handleApplyFilters,
    onApply: handleApplyFilters,
    onSearch: handleApplyFilters,
    onSavePreferences: handleSaveDashboardPreferences,
    savingPreferences,
    preferenceSaveStatus,
  };

  if (isMobile === null) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: '#78909C' }} aria-busy="true">
      Loading jobs…
    </div>
  );
}

  const greeting = getTimeGreeting();

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 100 }}>

<SeekerTitleCard
  greeting={greeting}
  title={`${totalJobCount.toLocaleString()} Opportunities`}
  subtitle="Ranked against your profile and preferences."
/>

{/* ── Filter bar ── */}
<div
  style={{
    padding: '0 12px 12px',
    marginTop: -18,
  }}
>
  <div
    style={{
      background: 'rgba(255,255,255,0.58)',
      borderRadius: '0 0 24px 24px',
      boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.22)',
      borderTop: '1px solid rgba(255,255,255,0.18)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }}
  >
    <JobSearchFilters isMobile={true} {...filterProps} />
  </div>
</div>

        {/* ── Result count ── */}
        {totalJobCount > 0 && (
          <div style={{
            padding: '0 14px 8px',
            fontSize: 11,
            color: 'rgba(255,255,255,0.40)',
            fontWeight: 600,
          }}>
            {startIndex + 1}–{Math.min(startIndex + pageSize, totalJobCount)} of {totalJobCount} jobs
          </div>
        )}

        {/* ── Job feed ── */}
        <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && pagedJobs.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {[1,2,3,4].map(n => (
                <div key={n} style={{
                  height: 108,
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  animation: 'mobilePulse 1.4s ease-in-out infinite',
                  animationDelay: `${n * 0.1}s`,
                }} />
              ))}
              <style>{`@keyframes mobilePulse { 0%,100%{opacity:0.5} 50%{opacity:1} }`}</style>
            </div>
          )}

          {!loading && pagedJobs.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.45)',
              fontSize: 14,
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💼</div>
              No jobs match your filters.
            </div>
          )}

          {pagedJobs.map((job) => (
            <div key={job.id} ref={selectedJob?.id === job.id ? selectedJobCardRef : null}>
              <JobListCard
                job={job}
                isSelected={selectedJob?.id === job.id}
                onClick={() => handleSelectJob(job)}
                getJobStatus={getJobStatus}
                isInternalJob={isInternalJob}
                getJobTier={getJobTier}
                showSearchRelevance={hasAppliedSearch}
                isMobile={true}
              />
            </div>
          ))}
        </div>

        {/* ── Pagination ── */}
        <div style={{ padding: '12px 12px 0' }}>
          <JobPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>

        {/* ── Recently viewed / applied ── */}
        <div style={{ padding: '16px 12px 0' }}>
          <JobsBottomRow viewedJobs={viewedJobs} appliedJobs={appliedJobs} onSelectJob={handleSelectJob} />
        </div>

        {/* ── Full-screen job detail ── */}
        {mobileDetailOpen && selectedJob && (
          <MobileJobDetail
            job={selectedJob}
            onBack={() => setMobileDetailOpen(false)}
            profileSignal={selectedJob?.jdProfileSignal || profileSignal}
            showSearchRelevance={hasAppliedSearch}
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
  title={`${totalJobCount.toLocaleString()} Opportunities`}
  subtitle="Ranked against your profile and preferences."
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
            {totalJobCount === 0
              ? 'No jobs found'
              : `${startIndex + 1}–${Math.min(startIndex + pageSize, totalJobCount)} of ${totalJobCount}`}
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
                  showSearchRelevance={hasAppliedSearch}
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
			profileSignal={selectedJob?.jdProfileSignal || profileSignal}
			showSearchRelevance={hasAppliedSearch}
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