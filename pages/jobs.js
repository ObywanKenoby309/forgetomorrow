// pages/jobs.js — filters + list/detail + Apply + Resume-Role Align row

import { useEffect, useState } from 'react';
import { JobPipelineProvider, useJobPipeline } from '../context/JobPipelineContext';
import { Card, CardHeader, CardTitle, CardContent, CardSubtle } from '../components/ui/Card';
import Link from 'next/link';
import InternalLayout from '../components/layouts/InternalLayout';
import ATSInfo from '../components/seeker/ATSInfo';
import ATSResultPanel from '../components/seeker/ATSResultPanel';

// ──────────────────────────────────────────────────────────────
// Lightweight layout shell
// ──────────────────────────────────────────────────────────────
function PageShell({ header, right, children }) {
  return (
    <div className="px-4 md:px-8 pb-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.7fr)] gap-6">
        <div className="space-y-4">
          {header}
          {children}
        </div>

        <aside className="hidden lg:block" aria-label="Job tools">
          {right}
        </aside>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Apply Modal (internal jobs)
// ──────────────────────────────────────────────────────────────
function ApplyModal({ open, onClose, job, onApplied, isPaidUser, onResumeAlign }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
    }
  }, [open]);

  if (!open || !job) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onApplied(job);
    onClose();
    alert(
      `Saved to Applied Jobs: ${job.title}. You can track this role in your Applied Jobs list.`
    );
  };

  const titleId = 'apply-dialog-title';
  const descriptionId = 'apply-dialog-description';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-lg">
        <h3 id={titleId} className="text-xl font-bold" style={{ color: '#263238' }}>
          Apply to {job.title}
        </h3>
        <p
          id={descriptionId}
          className="text-sm mt-1"
          style={{ color: '#607D8B' }}
        >
          {job.company} — {job.location}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1 text-sm">
            <label htmlFor="apply-full-name" className="font-medium text-slate-800">
              Full name
            </label>
            <input
              id="apply-full-name"
              placeholder="Full name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1 text-sm">
            <label htmlFor="apply-email" className="font-medium text-slate-800">
              Email address
            </label>
            <input
              id="apply-email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          {isPaidUser && (
            <button
              type="button"
              onClick={() => onResumeAlign(job)}
              className="w-full rounded-md bg-green-500 py-2.5 font-semibold text-white hover:bg-green-600"
            >
              Check Resume Alignment
            </button>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border px-5 py-2 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md px-5 py-2 text-sm font-semibold text-white"
              style={{ background: '#FF7043' }}
            >
              Submit application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Header + right rail
// ──────────────────────────────────────────────────────────────
function PageHeader() {
  return (
    <header
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1
        style={{ color: '#FF7043', fontSize: 28, fontWeight: 800, margin: 0 }}
      >
        Job Listings
      </h1>
      <p
        style={{ margin: '8px 0 0', color: '#546E7A', fontSize: 14 }}
      >
        Explore openings, review full details, and apply with confidence.
      </p>
    </header>
  );
}

function RightRail() {
  return (
    <nav
      aria-label="Job page advertisements"
      style={{ display: 'grid', gap: 12 }}
    >
      <div
        style={{
          background: '#1f1f1f',
          border: '1px solid #333',
          borderRadius: 12,
          padding: 16,
          color: 'white',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
          Hiring for your team?
        </div>
        <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
          Your advertisement could be here.
          <br />
          Contact <span style={{ fontWeight: 700 }}>sales@forgetomorrow.com</span>.
        </p>
      </div>
    </nav>
  );
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function inferLocationType(location) {
  if (!location) return '';
  const lower = location.toLowerCase();
  if (lower.includes('remote')) return 'Remote';
  if (lower.includes('hybrid')) return 'Hybrid';
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

  const query = encodeURIComponent(parts.join(' '));
  return `https://www.google.com/search?q=${query}`;
}

// Normalize status strings coming from DB / API
function getJobStatus(job) {
  const raw = (job?.status || '').toString().trim();
  if (!raw) return 'Open';

  const upper = raw.toUpperCase();

  if (upper === 'DRAFT') return 'Draft';
  if (upper === 'OPEN') return 'Open';
  if (upper === 'REVIEWING' || upper === 'REVIEWING APPLICANTS') return 'Reviewing';
  if (upper === 'CLOSED') return 'Closed';

  // Fallback: treat unknown as Open for seekers
  return raw;
}

function canApply(job) {
  return getJobStatus(job) === 'Open';
}

// Internal vs external job detector (used for styling + filters)
function isInternalJob(job) {
  if (!job) return false;
  const origin = (job.origin || '').toLowerCase();
  const source = (job.source || '').toLowerCase();

  return (
    origin === 'internal' ||
    source === 'internal' ||
    source === 'forge' ||
    source === 'forge recruiter' ||
    source === 'forgetomorrow' ||
    source === 'forgetomorrow recruiter'
  );
}

// Tier helper: 'ft-official' | 'partner' | 'external'
function getJobTier(job) {
  if (!job) return 'external';

  const rawTier = job.tier;
  if (rawTier === 'ft-official' || rawTier === 'partner' || rawTier === 'external') {
    return rawTier;
  }

  const internal = isInternalJob(job);
  if (!internal) return 'external';

  const company = (job.company || '').trim().toLowerCase();
  if (company === 'forgetomorrow') return 'ft-official';
  return 'partner';
}

// ──────────────────────────────────────────────────────────────
// Main Jobs Component
// ──────────────────────────────────────────────────────────────
function Jobs() {
  const { viewedJobs, appliedJobs, addViewedJob, addAppliedJob } = useJobPipeline();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyJob, setApplyJob] = useState(null);

  const [selectedJob, setSelectedJob] = useState(null);

  // ATS result state
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsError, setAtsError] = useState(null);
  const [atsResult, setAtsResult] = useState(null);
  const [atsPanelOpen, setAtsPanelOpen] = useState(false);
  const [atsJob, setAtsJob] = useState(null);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Pagination
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const isPaidUser = true;

  // pinned job ids
  const [pinnedIds, setPinnedIds] = useState(new Set());

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        const list = (data && data.jobs) || [];
        setJobs(list);
        if (list.length > 0) {
          setSelectedJob(list[0]);
          addViewedJob(list[0]);
        }
        list.forEach(addViewedJob);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, [addViewedJob]);

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
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // ignore
      }

      console.log('[togglePin] status', res.status, 'body:', data || text);

      if (!res.ok) {
        throw new Error(data.error || `Pin API failed (status ${res.status})`);
      }

      setPinnedIds((prev) => {
        const next = new Set(prev);
        if (currentlyPinned) next.delete(job.id);
        else next.add(job.id);
        return next;
      });
    } catch (err) {
      console.error('[Jobs] togglePin error', err);
      alert(
        err.message ||
          (currentlyPinned
            ? 'Could not unpin this job. Please try again.'
            : 'Could not pin this job. Please try again.')
      );
    }
  };

  // Apply click behaviour
  const handleApplyClick = (job) => {
    if (!job) return;

    const origin = (job.origin || '').toLowerCase();
    const applyLink = getApplyLink(job);
    const isExternal = origin === 'external';

    if (isExternal) {
      const finalUrl = applyLink || buildFallbackSearch(job);
      addAppliedJob(job);
      if (typeof window !== 'undefined') {
        window.open(finalUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    setApplyJob(job);
    setApplyOpen(true);
  };

  const handleResumeAlign = (job) => {
    if (!job) return;
    window.location.href = `/resume-cover?jobId=${job.id}&copyJD=true`;
  };

  const handleATSAlign = async (job) => {
    if (!job) return;

    setAtsJob(job);
    setAtsPanelOpen(true);
    setAtsLoading(true);
    setAtsError(null);
    setAtsResult(null);

    try {
      const res = await fetch('/api/seeker/ats-align', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (!res.ok) throw new Error(`ATS API failed (status ${res.status})`);

      const payload = await res.json();

      setAtsResult({
        score: typeof payload.score === 'number' ? payload.score : null,
        summary: payload.summary || '',
        recommendations: Array.isArray(payload.recommendations)
          ? payload.recommendations
          : [],
      });
    } catch (err) {
      console.error('[Jobs] ATS align error', err);
      setAtsError(null);
      setAtsResult({
        score: 78,
        summary:
          'Demo result: You appear to be a strong match on core skills and background for this role.',
        recommendations: [
          'Add one or two bullets with clear metrics (%, $, time saved) for your most recent role.',
          'Mirror 2–3 of the job’s exact keywords in your resume summary.',
          'Highlight any direct experience with similar tools or platforms mentioned in the posting.',
        ],
      });
    } finally {
      setAtsLoading(false);
    }
  };

  const handleSendToResumeBuilder = () => {
    if (!atsJob || !atsResult) return;

    const pack = {
      job: {
        id: atsJob.id,
        title: atsJob.title,
        company: atsJob.company,
        location: atsJob.location,
        description: atsJob.description,
      },
      ats: atsResult,
    };

    try {
      localStorage.setItem('forge-ats-pack', JSON.stringify(pack));
    } catch (err) {
      console.error('[Jobs] failed to write ATS pack to localStorage', err);
    }

    window.location.href = '/resume-cover?from=ats';
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    addViewedJob(job);
    setAtsResult(null);
    setAtsError(null);
    setAtsPanelOpen(false);
  };

  // Filtering
  const normalizedKeyword = keyword.trim().toLowerCase();
  const normalizedCompany = companyFilter.trim().toLowerCase();
  const normalizedLocation = locationFilter.trim().toLowerCase();
  const parsedDays = parseInt(daysFilter, 10);
  const hasDaysFilter = !Number.isNaN(parsedDays) && parsedDays > 0;

  const now = new Date();
  const cutoffTime = hasDaysFilter
    ? now.getTime() - parsedDays * 24 * 60 * 60 * 1000
    : null;

  const filteredJobs = jobs.filter((job) => {
    // 1) Status-based feed behavior
    const status = getJobStatus(job);

    // Hide drafts from seeker feed entirely
    if (status === 'Draft') {
      return false;
    }

    // Hide closed jobs after 3 days (based on updatedAt or publishedat)
    if (status === 'Closed') {
      const threeDaysAgo = now.getTime() - 3 * 24 * 60 * 60 * 1000;
      const updated =
        job.updatedAt ||
        job.updatedat ||
        job.updated_at ||
        job.publishedat ||
        null;

      if (updated) {
        const closedDate = new Date(updated);
        if (!Number.isNaN(closedDate.getTime()) && closedDate.getTime() < threeDaysAgo) {
          return false;
        }
      }
    }

    // Existing filters
    const title = (job.title || '').toLowerCase();
    const company = (job.company || '').toLowerCase();
    const location = (job.location || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const tags = (job.tags || '').toString().toLowerCase();

    if (normalizedKeyword) {
      const haystack = `${title} ${company} ${location} ${description} ${tags}`;
      if (!haystack.includes(normalizedKeyword)) return false;
    }

    if (normalizedCompany && !company.includes(normalizedCompany)) {
      return false;
    }

    if (normalizedLocation && !location.includes(normalizedLocation)) {
      return false;
    }

    if (locationTypeFilter) {
      const inferred = inferLocationType(job.location || '');
      if (inferred !== locationTypeFilter) return false;
    }

    if (sourceFilter) {
      const internal = isInternalJob(job);
      if (sourceFilter === 'external' && internal) return false;
      if (sourceFilter === 'internal' && !internal) return false;
    }

    if (hasDaysFilter) {
      if (!job.publishedat) return false;
      const d = new Date(job.publishedat);
      if (Number.isNaN(d.getTime())) return false;
      if (d.getTime() < cutoffTime) return false;
    }

    return true;
  });

  useEffect(() => {
    const totalPagesLocal = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
    if (currentPage > totalPagesLocal) setCurrentPage(1);
  }, [filteredJobs.length, pageSize, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

  const pageNumbers = [];
  const windowSize = 3;
  const startPage = Math.max(1, currentPage - windowSize);
  const endPage = Math.min(totalPages, currentPage + windowSize);

  for (let p = startPage; p <= endPage; p += 1) pageNumbers.push(p);

  const recentViewed = viewedJobs.slice(-6).reverse();
  const selectedJobApplyLink = selectedJob ? getApplyLink(selectedJob) : '';

  const selectedStatus = selectedJob ? getJobStatus(selectedJob) : null;
  const canApplySelected = selectedJob ? canApply(selectedJob) : false;
  const hasAppliedToSelected =
    !!selectedJob &&
    appliedJobs.some((j) => j && j.id === selectedJob.id);

  const isSelectedInternal = isInternalJob(selectedJob);
  const selectedSourceLabel = isSelectedInternal
    ? 'Forge recruiter'
    : (selectedJob?.source || 'External');

  const selectedTier = getJobTier(selectedJob);
  const selectedIsFtOfficial = selectedTier === 'ft-official';
  const selectedIsPartner = selectedTier === 'partner';
  const selectedIsDark = selectedIsFtOfficial || selectedIsPartner;

  const selectedDetailBorder = selectedIsFtOfficial
    ? '2px solid #FF7043'
    : selectedIsPartner
    ? '1px solid rgba(17,32,51,0.35)'
    : '1px solid #E0E0E0';

  const selectedDetailBackground = selectedIsFtOfficial
    ? 'linear-gradient(135deg, #FF7043, #FF8A65)'
    : selectedIsPartner
    ? 'linear-gradient(135deg, #0B1724, #112033)'
    : '#FFFFFF';

  const detailTitleColor = selectedIsDark ? '#FFFFFF' : '#263238';
  const detailSubtleColor = selectedIsDark ? '#CFD8DC' : '#607D8B';
  const detailBodyColor = selectedIsDark ? '#ECEFF1' : '#37474F';

  const selectedChipLabel = selectedIsFtOfficial
    ? 'ForgeTomorrow official posting'
    : isSelectedInternal
    ? 'ForgeTomorrow recruiter posting'
    : null;

  if (loading) {
    return (
      <PageShell header={<PageHeader />} right={<RightRail />}>
        <p style={{ padding: 40, textAlign: 'center' }} aria-busy="true">
          Loading jobs...
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell header={<PageHeader />} right={<RightRail />}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maxWidth: 1200,
        }}
      >
        {/* Filter bar */}
        <Card as="section" aria-labelledby="jobs-filter-heading">
          <CardHeader>
            <h2
              id="jobs-filter-heading"
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: '#263238',
              }}
            >
              Filter jobs
            </h2>
          </CardHeader>
          <CardContent>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              {/* Keywords */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label
                  htmlFor="jobs-filter-keywords"
                  style={{ fontSize: 12, color: '#78909C' }}
                >
                  Keywords
                </label>
                <input
                  id="jobs-filter-keywords"
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Title, skills, tags..."
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #CFD8DC',
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Company Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label
                  htmlFor="jobs-filter-company"
                  style={{ fontSize: 12, color: '#78909C' }}
                >
                  Company Name
                </label>
                <input
                  id="jobs-filter-company"
                  type="text"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  placeholder="Company..."
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #CFD8DC',
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Location */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label
                  htmlFor="jobs-filter-location"
                  style={{ fontSize: 12, color: '#78909C' }}
                >
                  Location
                </label>
                <input
                  id="jobs-filter-location"
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="City, region, country..."
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #CFD8DC',
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Location Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label
                  htmlFor="jobs-filter-location-type"
                  style={{ fontSize: 12, color: '#78909C' }}
                >
                  Location Type
                </label>
                <select
                  id="jobs-filter-location-type"
                  value={locationTypeFilter}
                  onChange={(e) => setLocationTypeFilter(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #CFD8DC',
                    fontSize: 14,
                    backgroundColor: 'white',
                  }}
                >
                  <option value="">All</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              {/* Source */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label
                  htmlFor="jobs-filter-source"
                  style={{ fontSize: 12, color: '#78909C' }}
                >
                  Source
                </label>
                <select
                  id="jobs-filter-source"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #CFD8DC',
                    fontSize: 14,
                    backgroundColor: 'white',
                  }}
                >
                  <option value="">All sources</option>
                  <option value="external">External only</option>
                  <option value="internal">Forge recruiters only</option>
                </select>
              </div>

              {/* Posted in last N days */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label
                  htmlFor="jobs-filter-days"
                  style={{ fontSize: 12, color: '#78909C' }}
                >
                  Posted in last (days)
                </label>
                <input
                  id="jobs-filter-days"
                  type="number"
                  min="1"
                  value={daysFilter}
                  onChange={(e) => setDaysFilter(e.target.value)}
                  placeholder="e.g. 7"
                  style={{
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #CFD8DC',
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12,
                color: '#78909C',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span>
                Showing {filteredJobs.length === 0 ? 0 : startIndex + 1}–
                {Math.min(startIndex + pageSize, filteredJobs.length)} of{' '}
                {filteredJobs.length} jobs
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Jobs per page:</span>
                <select
                  aria-label="Jobs per page"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #CFD8DC',
                    fontSize: 12,
                    backgroundColor: 'white',
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two-column layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.5fr)',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          {/* LEFT: list */}
          <section
            aria-label="Job results"
            style={{
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {pagedJobs.map((job) => {
                const rawDesc = job.description || '';
                const cleanDesc = rawDesc.replace(/<[^>]*>/g, '');
                const snippet =
                  cleanDesc.length > 160
                    ? `${cleanDesc.slice(0, 160)}…`
                    : cleanDesc;

                const location = job.location || '';
                const locationType = inferLocationType(location);
                const status = getJobStatus(job);

                const internal = isInternalJob(job);
                const displaySource = internal
                  ? 'Forge recruiter'
                  : (job.source || 'External');

                let postedLabel = 'Date not provided';
                if (job.publishedat) {
                  const d = new Date(job.publishedat);
                  if (!Number.isNaN(d.getTime())) {
                    postedLabel = d.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }
                }

                const isSelected = selectedJob && selectedJob.id === job.id;

                const tier = getJobTier(job);
                const isFtOfficial = tier === 'ft-official';
                const isPartner = tier === 'partner';
                const isExternalTier = tier === 'external';
                const isDarkCard = isFtOfficial || isPartner;

                const logoUrl =
                  job.logoUrl ||
                  (isFtOfficial ? '/images/logo-color.png' : null);

                let cardBackground;
                let cardBorder;
                let cardShadow;

                if (isFtOfficial) {
                  cardBackground = 'linear-gradient(135deg, #FF7043, #FF8A65)';
                  cardBorder = isSelected
                    ? '2px solid #FFFFFF'
                    : '1px solid #FFCC80';
                  cardShadow = '0 0 20px rgba(0,0,0,0.45)';
                } else if (isPartner) {
                  cardBackground = 'linear-gradient(135deg, #0B1724, #112033)';
                  cardBorder = isSelected
                    ? '2px solid #FF7043'
                    : '1px solid rgba(255,112,67,0.7)';
                  cardShadow = '0 0 18px rgba(0,0,0,0.5)';
                } else {
                  // external
                  cardBackground = '#FFFFFF';
                  cardBorder = isSelected
                    ? '2px solid #FF7043'
                    : '1px solid #e0e0e0';
                  cardShadow = '0 2px 6px rgba(0,0,0,0.04)';
                }

                const titleColor = isDarkCard ? '#FFFFFF' : '#263238';
                const subtleColor = isDarkCard ? '#CFD8DC' : '#607D8B';
                const textColor = isDarkCard ? '#ECEFF1' : '#455A64';

                const chipLabel = isFtOfficial
                  ? 'ForgeTomorrow official posting'
                  : internal
                  ? 'ForgeTomorrow recruiter partner'
                  : null;

                // internal jobs get snippet, externals stay compact
                const showSnippet = internal;

                return (
                  <Card
                    key={job.id}
                    as="article"
                    aria-label={`${job.title} at ${job.company || 'Unknown company'}`}
                    style={{
                      cursor: 'pointer',
                      border: cardBorder,
                      background: cardBackground,
                      boxShadow: cardShadow,
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: 128,
                    }}
                    onClick={() => handleSelectJob(job)}
                  >
                    <CardHeader>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                          flexWrap: 'nowrap',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: 10,
                            alignItems: 'flex-start',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {logoUrl && (
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                overflow: 'hidden',
                                backgroundColor: isFtOfficial
                                  ? 'rgba(0,0,0,0.25)'
                                  : 'rgba(0,0,0,0.4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={logoUrl}
                                alt={`${job.company || 'Company'} logo`}
                                style={{
                                  maxWidth: '70%',
                                  maxHeight: '70%',
                                  objectFit: 'contain',
                                }}
                              />
                            </div>
                          )}

                          <div>
                            {/* TITLE: clamp to 2 lines so it only wraps under itself */}
                            <CardTitle
                              style={{
                                color: titleColor,
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.3,
                                maxHeight: '2.6em',
                              }}
                            >
                              {job.title}
                            </CardTitle>
                            <CardSubtle style={{ color: subtleColor }}>
                              {job.company}
                            </CardSubtle>

                            {chipLabel && (
                              <div
                                style={{
                                  marginTop: 4,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  border: isFtOfficial
                                    ? '1px solid rgba(255,255,255,0.4)'
                                    : '1px solid rgba(255,255,255,0.2)',
                                  background: isFtOfficial
                                    ? 'rgba(0,0,0,0.25)'
                                    : 'rgba(17,32,51,0.9)',
                                  fontSize: 11,
                                  color: '#FFCC80',
                                }}
                              >
                                <span
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '999px',
                                    backgroundColor: '#FF7043',
                                  }}
                                />
                                {chipLabel}
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            textAlign: 'right',
                            minWidth: 120,
                            flexShrink: 0,
                          }}
                          aria-label={`Posted ${postedLabel}`}
                        >
                          <div style={{ fontSize: 12, color: subtleColor }}>
                            Posted
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              color: isDarkCard ? '#FFFFFF' : '#455A64',
                              fontWeight: 500,
                            }}
                          >
                            {postedLabel}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          fontSize: 13,
                          color: subtleColor,
                        }}
                      >
                        <span>{location || 'Location not provided'}</span>
                        {locationType && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              border: '1px solid rgba(207,216,220,0.7)',
                              fontSize: 12,
                              backgroundColor: isDarkCard
                                ? 'rgba(38,50,56,0.8)'
                                : 'transparent',
                            }}
                          >
                            {locationType}
                          </span>
                        )}

                        {status && status !== 'Open' && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              border: '1px solid #FFCC80',
                              fontSize: 12,
                              backgroundColor:
                                status === 'Reviewing' ? '#FFF3E0' : '#ECEFF1',
                              color:
                                status === 'Reviewing' ? '#E65100' : '#455A64',
                            }}
                          >
                            {status === 'Reviewing'
                              ? 'Reviewing applicants'
                              : status}
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      {/* Description snippet: internal only.
                          Scraped/external cards stay clean and compact. */}
                      {showSnippet && (
                        <p
                          style={{
                            margin: '0 0 10px',
                            color: textColor,
                            fontSize: 14,
                            lineHeight: 1.4,
                          }}
                        >
                          {snippet || 'No description provided.'}
                        </p>
                      )}

                      {displaySource && (
                        <div
                          style={{
                            marginTop: showSnippet ? 4 : 0,
                            display: 'flex',
                            justifyContent: 'flex-end',
                            fontSize: 12,
                            color: isDarkCard ? subtleColor : '#455A64',
                            fontWeight: isExternalTier ? 600 : 400,
                          }}
                        >
                          <span>Source: {displaySource}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination controls */}
            {filteredJobs.length > pageSize && (
              <nav
                aria-label="Job results pagination"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: '#78909C',
                  paddingTop: 4,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #CFD8DC',
                    background:
                      currentPage === 1 ? '#ECEFF1' : 'white',
                    cursor:
                      currentPage === 1 ? 'default' : 'pointer',
                    fontWeight: 500,
                  }}
                  aria-label="Go to first page"
                >
                  First
                </button>

                {startPage > 1 && <span aria-hidden="true">…</span>}

                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid #CFD8DC',
                      background:
                        p === currentPage ? '#FF7043' : 'white',
                      color:
                        p === currentPage ? 'white' : '#263238',
                      cursor: p === currentPage ? 'default' : 'pointer',
                      fontWeight: p === currentPage ? 700 : 500,
                    }}
                    aria-current={p === currentPage ? 'page' : undefined}
                    aria-label={`Go to page ${p}`}
                  >
                    {p}
                  </button>
                ))}

                {endPage < totalPages && (
                  <span aria-hidden="true">…</span>
                )}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #CFD8DC',
                    background:
                      currentPage === totalPages
                        ? '#ECEFF1'
                        : 'white',
                    cursor:
                      currentPage === totalPages
                        ? 'default' : 'pointer',
                    fontWeight: 500,
                  }}
                  aria-label="Go to last page"
                >
                  Last
                </button>
              </nav>
            )}
          </section>

          {/* RIGHT: sticky full job view */}
          <section aria-label="Selected job details">
            <Card
              as="article"
              style={{
                position: 'sticky',
                top: 0,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                border: selectedDetailBorder,
                boxShadow: selectedIsDark
                  ? '0 0 14px rgba(0,0,0,0.25)'
                  : '0 2px 8px rgba(0,0,0,0.06)',
                background: selectedDetailBackground,
              }}
            >
              {selectedJob ? (
                <>
                  <CardHeader>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      {selectedChipLabel && (
                        <div
                          style={{
                            alignSelf: 'flex-start',
                            padding: '3px 10px',
                            borderRadius: 999,
                            border: '1px solid rgba(17,32,51,0.16)',
                            background:
                              'linear-gradient(135deg, #0B1724, #112033)',
                            fontSize: 11,
                            color: '#FFCC80',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '999px',
                              backgroundColor: '#FF7043',
                            }}
                          />
                          {selectedChipLabel}
                        </div>
                      )}

                      <div>
                        <CardTitle style={{ color: detailTitleColor }}>
                          {selectedJob.title}
                        </CardTitle>
                        <CardSubtle style={{ color: detailSubtleColor }}>
                          {selectedJob.company} —{' '}
                          {selectedJob.location || 'Location not provided'}
                        </CardSubtle>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 6,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 10,
                        fontSize: 13,
                        color: detailSubtleColor,
                      }}
                    >
                      {inferLocationType(selectedJob.location || '') && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            border: '1px solid #CFD8DC',
                            fontSize: 12,
                            backgroundColor: selectedIsDark
                              ? 'rgba(38,50,56,0.8)'
                              : 'transparent',
                            color: selectedIsDark ? '#ECEFF1' : '#455A64',
                          }}
                        >
                          {inferLocationType(selectedJob.location || '')}
                        </span>
                      )}
                      {selectedSourceLabel && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            border: '1px solid #CFD8DC',
                            fontSize: 12,
                            backgroundColor: selectedIsDark
                              ? 'rgba(38,50,56,0.8)'
                              : 'transparent',
                            color: selectedIsDark ? '#ECEFF1' : '#455A64',
                          }}
                        >
                          Source: {selectedSourceLabel}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {/* Description */}
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        paddingRight: 4,
                        maxHeight: '58vh',
                      }}
                    >
                      {(() => {
                        const raw = (selectedJob.description || '').replace(
                          /<[^>]*>/g,
                          ''
                        );
                        const paragraphs = raw
                          .split(/\n\s*\n/)
                          .map((p) => p.trim())
                          .filter((p) => p.length > 0);

                        if (paragraphs.length === 0) {
                          return (
                            <p
                              style={{
                                margin: 0,
                                color: detailBodyColor,
                                fontSize: 14,
                                lineHeight: 1.6,
                              }}
                            >
                              No description provided.
                            </p>
                          );
                        }

                        return paragraphs.map((para, idx) => (
                          <p
                            key={idx}
                            style={{
                              margin:
                                idx === 0 ? '0 0 10px' : '10px 0 0',
                              color: detailBodyColor,
                              fontSize: 14,
                              lineHeight: 1.6,
                            }}
                          >
                            {para}
                          </p>
                        ));
                      })()}
                    </div>

                    {/* ACTION ROW */}
                    {selectedStatus === 'Open' && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                          flexWrap: 'nowrap',
                          gap: 6,
                          marginTop: -4,
                          overflowX: 'auto',
                          padding: '0 0 4px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => togglePin(selectedJob)}
                          style={{
                            background: 'white',
                            color: isJobPinned(selectedJob) ? '#D32F2F' : '#FF7043',
                            padding: '4px 10px',
                            borderRadius: 999,
                            border: `1px solid ${
                              isJobPinned(selectedJob) ? '#D32F2F' : '#FF7043'
                            }`,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: 'pointer',
                            minWidth: 70,
                            whiteSpace: 'nowrap',
                          }}
                          aria-pressed={isJobPinned(selectedJob)}
                        >
                          {isJobPinned(selectedJob) ? 'Unpin job' : 'Pin job'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (canApplySelected) handleApplyClick(selectedJob);
                          }}
                          disabled={!canApplySelected}
                          style={{
                            background: canApplySelected ? '#FF7043' : '#CFD8DC',
                            color: canApplySelected ? 'white' : '#607D8B',
                            padding: '4px 14px',
                            borderRadius: 999,
                            border: 'none',
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: canApplySelected ? 'pointer' : 'default',
                            minWidth: 70,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {selectedStatus === 'Reviewing'
                            ? 'Applications paused'
                            : selectedStatus === 'Closed'
                            ? 'Closed'
                            : 'Apply'}
                        </button>

                        {isPaidUser && (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleATSAlign(selectedJob)}
                              style={{
                                background: 'white',
                                color: '#FF7043',
                                padding: '4px 10px',
                                borderRadius: 999,
                                border: '1px solid #FF7043',
                                fontWeight: 600,
                                fontSize: 12,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Resume-Role Align
                            </button>
                            <ATSInfo />
                          </div>
                        )}

                        {selectedJobApplyLink && (
                          <Link
                            href={selectedJobApplyLink}
                            target="_blank"
                            style={{
                              padding: '4px 10px',
                              borderRadius: 8,
                              border: '1px solid #ddd',
                              color: '#263238',
                              textDecoration: 'none',
                              fontSize: 12,
                              whiteSpace: 'nowrap',
                              backgroundColor: 'white',
                            }}
                          >
                            Open original posting
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Status-aware thank-you / info banner */}
                    {selectedStatus === 'Reviewing' && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: '1px solid #FFCC80',
                          backgroundColor: '#FFF3E0',
                          fontSize: 12,
                          color: '#E65100',
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          {hasAppliedToSelected
                            ? 'Thank you for applying.'
                            : 'This employer is now reviewing applicants.'}
                        </p>
                        <p style={{ margin: '4px 0 0' }}>
                          {hasAppliedToSelected
                            ? 'This employer is now reviewing applicants for this role. You’ll see updates here as they take action.'
                            : 'New applications are paused. Thank you to everyone who applied.'}
                        </p>
                      </div>
                    )}

                    {selectedStatus === 'Closed' && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: '1px solid #CFD8DC',
                          backgroundColor: '#ECEFF1',
                          fontSize: 12,
                          color: '#455A64',
                        }}
                      >
                        <p style={{ margin: 0, fontWeight: 600 }}>
                          {hasAppliedToSelected
                            ? 'Thank you for applying.'
                            : 'This posting is now closed.'}
                        </p>
                        <p style={{ margin: '4px 0 0' }}>
                          {hasAppliedToSelected
                            ? 'If you are selected for next steps, the employer will reach out directly.'
                            : 'Stay tuned for future opportunities from this employer.'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </>
              ) : (
                <CardContent>
                  <h3
                    style={{
                      margin: '0 0 8px',
                      fontSize: 18,
                      fontWeight: 600,
                      color: '#263238',
                    }}
                  >
                    Select a job
                  </h3>
                  <p style={{ color: '#78909C', fontSize: 14 }}>
                    Choose a job from the list on the left to view full details
                    here.
                  </p>
                </CardContent>
              )}
            </Card>
          </section>
        </div>

        {/* Bottom row: Recently viewed + Applied Jobs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          <Card as="section" aria-labelledby="jobs-recent-heading">
            <CardHeader>
              <CardTitle
                id="jobs-recent-heading"
                style={{ color: '#FF7043', fontSize: 20 }}
              >
                Recently Viewed
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentViewed.length === 0 ? (
                <p
                  style={{
                    color: '#999',
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  No jobs viewed yet.
                </p>
              ) : (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 14,
                  }}
                >
                  {recentViewed.map((job) => (
                    <li key={`${job.id}-${job.title}`}>{job.title}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card as="section" aria-labelledby="jobs-applied-heading">
            <CardHeader>
              <CardTitle
                id="jobs-applied-heading"
                style={{ color: '#FF7043', fontSize: 20 }}
              >
                Applied Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appliedJobs.length === 0 ? (
                <p
                  style={{
                    color: '#999',
                    fontStyle: 'italic',
                    margin: 0,
                  }}
                >
                  No applications yet.
                </p>
              ) : (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 14,
                  }}
                >
                  {appliedJobs.map((job) => (
                    <li key={`${job.id}-${job.title}`}>{job.title}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Apply Modal */}
      <ApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        job={applyJob}
        onApplied={addAppliedJob}
        isPaidUser={isPaidUser}
        onResumeAlign={handleResumeAlign}
      />

      {/* ATS Result Panel */}
      <ATSResultPanel
        open={atsPanelOpen}
        onClose={() => setAtsPanelOpen(false)}
        loading={atsLoading}
        error={atsError}
        result={atsResult}
        onImproveResume={handleSendToResumeBuilder}
      />
    </PageShell>
  );
}

// ──────────────────────────────────────────────────────────────
// Page Wrapper
// ──────────────────────────────────────────────────────────────
export default function JobsPage() {
  return (
    <InternalLayout activeNav="jobs">
      <JobPipelineProvider>
        <Jobs />
      </JobPipelineProvider>
    </InternalLayout>
  );
}
