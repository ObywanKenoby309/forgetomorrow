// pages/jobs.js — robust filters + list/detail layout + formatting + numbered pagination
import { useEffect, useState } from 'react';
import { JobPipelineProvider, useJobPipeline } from '../context/JobPipelineContext';
import { Card, CardHeader, CardTitle, CardContent, CardSubtle } from '../components/ui/Card';
import Link from 'next/link';
import InternalLayout from '../components/layouts/InternalLayout';

// ──────────────────────────────────────────────────────────────
// Lightweight layout shell (no internal-auth logic)
// ──────────────────────────────────────────────────────────────
function PageShell({ header, right, children }) {
  return (
    <div className="px-4 md:px-8 pb-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.7fr)] gap-6">
        {/* Main column */}
        <div className="space-y-4">
          {header}
          {children}
        </div>

        {/* Right rail */}
        <aside className="hidden lg:block">
          {right}
        </aside>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Apply Modal
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
    alert(`Application submitted for: ${job.title}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      role="dialog"
    >
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow-lg">
        <h3 className="text-xl font-bold" style={{ color: '#263238' }}>
          Apply to {job.title}
        </h3>
        <p className="text-sm mt-1" style={{ color: '#607D8B' }}>
          {job.company} — {job.location}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            placeholder="Full name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

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
              className="rounded-md px-5 py-2 font-semibold text-white"
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
// Page Header
// ──────────────────────────────────────────────────────────────
function PageHeader() {
  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: '20px 24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ color: '#FF7043', fontSize: 28, fontWeight: 800, margin: 0 }}>
        Job Listings
      </h1>
      <p style={{ margin: '8px 0 0', color: '#546E7A', fontSize: 14 }}>
        Explore openings, review full details, and apply with confidence.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Right Rail
// ──────────────────────────────────────────────────────────────
function RightRail() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          background: '#2a2a2a',
          border: '1px solid #3a3a3a',
          borderRadius: 12,
          padding: 16,
          color: 'white',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Shortcuts</div>
        <Link href="/jobs" style={{ color: '#FF7043', display: 'block', marginBottom: 6 }}>
          All Jobs
        </Link>
        <Link href="/resume-builder" style={{ color: '#FF7043' }}>
          Resume Builder
        </Link>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Helper: infer location type from location string
// ──────────────────────────────────────────────────────────────
function inferLocationType(location) {
  if (!location) return '';
  const lower = location.toLowerCase();
  if (lower.includes('remote')) return 'Remote';
  if (lower.includes('hybrid')) return 'Hybrid';
  return 'On-site';
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

  // Filters
  const [keyword, setKeyword] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState(''); // '', 'Remote', 'Hybrid', 'On-site'
  const [daysFilter, setDaysFilter] = useState('');

  // Pagination for left list
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const isPaidUser = true;

  // 🔸 Track pinned jobs for the logged-in seeker
  const [pinnedIds, setPinnedIds] = useState(new Set());

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        const list = data.jobs || [];
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

  // Load pinned job IDs once so the detail panel can show Pin / Unpin
  useEffect(() => {
    let cancelled = false;

    async function loadPinned() {
      try {
        const res = await fetch('/api/seeker/pinned-jobs');
        if (!res.ok) return;
        const data = await res.json();
        const ids = new Set((data.jobs || []).map((j) => j.id)); // API returns job.id
        if (!cancelled) {
          setPinnedIds(ids);
        }
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
      // non-JSON body, keep data as {}
    }

    console.log('[togglePin] status', res.status, 'body:', data || text);

    if (!res.ok) {
      throw new Error(data.error || `Pin API failed (status ${res.status})`);
    }

    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (currentlyPinned) {
        next.delete(job.id);
      } else {
        next.add(job.id);
      }
      return next;
    });
  } catch (err) {
    console.error('[Jobs] togglePin error', err);
    alert(err.message || (currentlyPinned
      ? 'Could not unpin this job. Please try again.'
      : 'Could not pin this job. Please try again.'
    ));
  }
};


  const handleApplyClick = (job) => {
    setApplyJob(job);
    setApplyOpen(true);
  };

  const handleResumeAlign = (job) => {
    if (!job) return;
    window.location.href = `/resume-builder?jobId=${job.id}&copyJD=true`;
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    addViewedJob(job);
  };

  // ──────────────────────────────────────────────────────────
  // Robust client-side filtering
  // ──────────────────────────────────────────────────────────
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
      if (inferred !== locationTypeFilter) {
        return false;
      }
    }

    if (hasDaysFilter) {
      if (!job.publishedat) {
        return false;
      }
      const d = new Date(job.publishedat);
      if (Number.isNaN(d.getTime())) {
        return false;
      }
      if (d.getTime() < cutoffTime) {
        return false;
      }
    }

    return true;
  });

  // Reset page if filtered list shrinks
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [filteredJobs.length, pageSize, currentPage]);

  // Pagination slice for left list
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

  // Numbered pagination (First … pages … Last)
  const pageNumbers = [];
  const windowSize = 3;
  const startPage = Math.max(1, currentPage - windowSize);
  const endPage = Math.min(totalPages, currentPage + windowSize);

  for (let p = startPage; p <= endPage; p += 1) {
    pageNumbers.push(p);
  }

  // Recent viewed jobs (last 6, most recent first)
  const recentViewed = viewedJobs.slice(-6).reverse();

  if (loading) {
    return (
      <PageShell header={<PageHeader />} right={<RightRail />}>
        <p style={{ padding: 40, textAlign: 'center' }}>Loading jobs...</p>
      </PageShell>
    );
  }

  return (
    <PageShell header={<PageHeader />} right={<RightRail />}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1200 }}>
        {/* Filter bar */}
        <Card as="section">
          <CardContent>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(0, 2fr) minmax(0, 1.4fr) minmax(0, 1.4fr) minmax(0, 1.2fr) minmax(0, 1.4fr)',
                gap: 12,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              {/* Keywords */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#78909C' }}>Keywords</label>
                <input
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
                <label style={{ fontSize: 12, color: '#78909C' }}>Company Name</label>
                <input
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
                <label style={{ fontSize: 12, color: '#78909C' }}>Location</label>
                <input
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
                <label style={{ fontSize: 12, color: '#78909C' }}>Location Type</label>
                <select
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

              {/* Posted in last N days */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, color: '#78909C' }}>Posted in last (days)</label>
                <input
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
                {Math.min(startIndex + pageSize, filteredJobs.length)} of {filteredJobs.length} jobs
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Jobs per page:</span>
                <select
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

        {/* Two-column layout: LEFT list (scroll) + RIGHT full detail (sticky) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.5fr)',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          {/* LEFT: scrollable list + pagination at bottom */}
          <div
            style={{
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Scrollable cards */}
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
                  cleanDesc.length > 160 ? `${cleanDesc.slice(0, 160)}…` : cleanDesc;

                const location = job.location || '';
                const locationType = inferLocationType(location);

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

                return (
                  <Card
                    key={job.id}
                    as="section"
                    style={{
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #FF7043' : '1px solid #e0e0e0',
                    }}
                    onClick={() => handleSelectJob(job)}
                  >
                    <CardHeader>
                      {/* Title + company */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 8,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <CardTitle>{job.title}</CardTitle>
                          <CardSubtle>{job.company}</CardSubtle>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 120 }}>
                          <div style={{ fontSize: 12, color: '#78909C' }}>Posted</div>
                          <div style={{ fontSize: 13, color: '#455A64', fontWeight: 500 }}>
                            {postedLabel}
                          </div>
                        </div>
                      </div>

                      {/* Location row */}
                      <div
                        style={{
                          marginTop: 4,
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 8,
                          fontSize: 13,
                          color: '#607D8B',
                        }}
                      >
                        <span>{location || 'Location not provided'}</span>
                        {locationType && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              border: '1px solid #CFD8DC',
                              fontSize: 12,
                            }}
                          >
                            {locationType}
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent>
                      <p
                        style={{
                          margin: '0 0 10px',
                          color: '#455A64',
                          fontSize: 14,
                          lineHeight: 1.4,
                        }}
                      >
                        {snippet || 'No description provided.'}
                      </p>

                      {job.source && (
                        <div
                          style={{
                            fontSize: 12,
                            color: '#78909C',
                            marginBottom: 6,
                          }}
                        >
                          Source: {job.source}
                        </div>
                      )}
                      {/* ⬅️ "View details →" removed; clicking the card already selects it */}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination controls UNDER the cards */}
            {filteredJobs.length > pageSize && (
              <div
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
                {/* First */}
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #CFD8DC',
                    background: currentPage === 1 ? '#ECEFF1' : 'white',
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                    fontWeight: 500,
                  }}
                >
                  First
                </button>

                {/* Ellipsis before if needed */}
                {startPage > 1 && <span>…</span>}

                {/* Page numbers */}
                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: 6,
                      border: '1px solid #CFD8DC',
                      background: p === currentPage ? '#FF7043' : 'white',
                      color: p === currentPage ? 'white' : '#263238',
                      cursor: p === currentPage ? 'default' : 'pointer',
                      fontWeight: p === currentPage ? 700 : 500,
                    }}
                  >
                    {p}
                  </button>
                ))}

                {/* Ellipsis after if needed */}
                {endPage < totalPages && <span>…</span>}

                {/* Last */}
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: '1px solid #CFD8DC',
                    background: currentPage === totalPages ? '#ECEFF1' : 'white',
                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Last
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Sticky full job view, formatted */}
          <div>
            <Card
              as="section"
              style={{
                position: 'sticky',
                top: 0,
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {selectedJob ? (
                <>
                  <CardHeader>
                    <CardTitle>{selectedJob.title}</CardTitle>
                    <CardSubtle>
                      {selectedJob.company} — {selectedJob.location || 'Location not provided'}
                    </CardSubtle>

                    <div
                      style={{
                        marginTop: 6,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 10,
                        fontSize: 13,
                        color: '#607D8B',
                      }}
                    >
                      {inferLocationType(selectedJob.location || '') && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            border: '1px solid #CFD8DC',
                            fontSize: 12,
                          }}
                        >
                          {inferLocationType(selectedJob.location || '')}
                        </span>
                      )}
                      {selectedJob.source && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            border: '1px solid #CFD8DC',
                            fontSize: 12,
                          }}
                        >
                          Source: {selectedJob.source}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Full description (scrollable + formatted paragraphs) */}
                    <div
                      style={{
                        flex: 1,
                        overflowY: 'auto',
                        paddingRight: 4,
                        maxHeight: '58vh',
                      }}
                    >
                      {(() => {
                        const raw = (selectedJob.description || '').replace(/<[^>]*>/g, '');
                        const paragraphs = raw
                          .split(/\n\s*\n/)
                          .map((p) => p.trim())
                          .filter((p) => p.length > 0);

                        if (paragraphs.length === 0) {
                          return (
                            <p
                              style={{
                                margin: 0,
                                color: '#37474F',
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
                              margin: idx === 0 ? '0 0 10px' : '10px 0 0',
                              color: '#37474F',
                              fontSize: 14,
                              lineHeight: 1.6,
                            }}
                          >
                            {para}
                          </p>
                        ));
                      })()}
                    </div>

                    {/* Actions row at the bottom */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 10,
                        marginTop: 8,
                        justifyContent: 'flex-end',
                      }}
                    >
                      {/* Pin / Unpin job */}
                      <button
                        type="button"
                        onClick={() => togglePin(selectedJob)}
                        style={{
                          background: 'white',
                          color: isJobPinned(selectedJob) ? '#D32F2F' : '#FF7043',
                          padding: '10px 16px',
                          borderRadius: 8,
                          border: `1px solid ${isJobPinned(selectedJob) ? '#D32F2F' : '#FF7043'}`,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {isJobPinned(selectedJob) ? 'Unpin job' : 'Pin job'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyClick(selectedJob)}
                        style={{
                          background: '#FF7043',
                          color: 'white',
                          padding: '10px 16px',
                          borderRadius: 8,
                          border: 'none',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Apply
                      </button>

                      {isPaidUser && (
                        <button
                          type="button"
                          onClick={() => handleResumeAlign(selectedJob)}
                          style={{
                            background: 'white',
                            color: '#4CAF50',
                            padding: '10px 16px',
                            borderRadius: 8,
                            border: '1px solid #4CAF50',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Resume Alignment
                        </button>
                      )}

                      {selectedJob.url && (
                        <Link
                          href={selectedJob.url}
                          target="_blank"
                          style={{
                            padding: '10px 16px',
                            borderRadius: 8,
                            border: '1px solid #ddd',
                            color: '#263238',
                            textDecoration: 'none',
                            fontSize: 14,
                          }}
                        >
                          Open original posting
                        </Link>
                      )}
                    </div>
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
                    Choose a job from the list on the left to view full details here.
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </div>

        {/* Bottom: two compact cards side-by-side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {/* Recently Viewed */}
          <Card as="section">
            <CardHeader>
              <CardTitle style={{ color: '#FF7043', fontSize: 20 }}>Recently Viewed</CardTitle>
            </CardHeader>
            <CardContent>
              {recentViewed.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic', margin: 0 }}>
                  No jobs viewed yet.
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
                  {recentViewed.map((job) => (
                    <li key={`${job.id}-${job.title}`}>{job.title}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Applied Jobs */}
          <Card as="section">
            <CardHeader>
              <CardTitle style={{ color: '#FF7043', fontSize: 20 }}>Applied Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {appliedJobs.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic', margin: 0 }}>
                  No applications yet.
                </p>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
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
