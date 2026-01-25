// pages/job/[id].js
import { useRouter } from 'next/router';
import { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { track } from '@/lib/track';
import JobApplyModal from '@/components/JobApplyModal';

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

function getJobStatus(job) {
  const raw = (job?.status || '').toString().trim();
  if (!raw) return 'Open';

  const upper = raw.toUpperCase();

  if (upper === 'DRAFT') return 'Draft';
  if (upper === 'OPEN') return 'Open';
  if (upper === 'REVIEWING' || upper === 'REVIEWING APPLICANTS') return 'Reviewing';
  if (upper === 'CLOSED') return 'Closed';

  return raw;
}

// ──────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────
export default function PublicJobView() {
  const router = useRouter();
  const { id: jobId } = router.query;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Fire a JOB_VIEW when the page knows the jobId
  useEffect(() => {
    if (!jobId) return;
    track('JOB_VIEW', { jobId });
  }, [jobId]);

  // Load job details
  useEffect(() => {
    let active = true;
    async function run() {
      if (!jobId) return;
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) throw new Error('not ok');
        const json = await res.json();
        if (active) setJob(json);
      } catch {
        // Swallow errors quietly; page still renders with the ID
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [jobId]);

  const status = getJobStatus(job);
  const locationType = inferLocationType(job?.location || '');
  const origin = (job?.origin || '').toLowerCase();
  const isInternal = origin === 'internal';
  const applyLink = getApplyLink(job);

  const postedLabel = useMemo(() => {
    if (!job?.publishedat) return 'Date not provided';
    const d = new Date(job.publishedat);
    if (Number.isNaN(d.getTime())) return 'Date not provided';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [job?.publishedat]);

  const pageTitle = job?.title
    ? `${job.title} — ${job.company || 'Job'}`
    : 'Job';

  const canApply =
    !loading &&
    !!job &&
    status !== 'Draft' &&
    status !== 'Closed';

  const handleApplyClick = () => {
    if (!job) return;

    // ✅ Internal jobs: go straight to the real ForgeTomorrow apply wizard page
    if (isInternal) {
      router.push(`/job/${jobId}/apply`);
      return;
    }

    // ✅ External jobs: show modal that explains what happens, then opens employer site
    setShowApplyModal(true);
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>

      <main
        className="min-h-screen"
        style={{
          padding: '32px 16px 48px',
          background: isInternal
            ? 'radial-gradient(circle at top, #112033 0, #050910 55%, #020308 100%)'
            : '#F5F7FA',
        }}
      >
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Back link */}
          <div className="flex items-center justify-between gap-4 text-sm">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-1"
              style={{ color: '#FF7043' }}
            >
              <span aria-hidden="true">←</span>
              <span>Back to jobs</span>
            </Link>

            {job?.source && (
              <span
                className="text-xs px-2 py-1 rounded-full border"
                style={{
                  borderColor: isInternal ? 'rgba(255,255,255,0.2)' : '#CFD8DC',
                  color: isInternal ? '#CFD8DC' : '#607D8B',
                  backgroundColor: isInternal ? 'rgba(0,0,0,0.2)' : '#FFFFFF',
                }}
              >
                Source: {job.source}
              </span>
            )}
          </div>

          {/* Hero card */}
          <section
            className="relative overflow-hidden rounded-2xl border shadow-lg"
            style={{
              borderColor: isInternal ? 'rgba(255,112,67,0.75)' : '#E0E0E0',
              background: isInternal ? 'linear-gradient(145deg, #0B1724, #112033)' : '#FFFFFF',
            }}
          >
            {/* Watermark for internal */}
            {isInternal && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: -40,
                  bottom: -10,
                  fontSize: 80,
                  fontWeight: 800,
                  letterSpacing: 6,
                  color: 'rgba(255,255,255,0.03)',
                  textTransform: 'uppercase',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                Forge
              </div>
            )}

            <div className="relative p-6 sm:p-8 space-y-5">
              {/* Internal badge + status row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  {isInternal && (
                    <div
                      className="inline-flex items-center gap-6 px-3 py-1 rounded-full border text-xs"
                      style={{
                        borderColor: 'rgba(255,255,255,0.2)',
                        background: 'rgba(17,32,51,0.9)',
                        color: '#FFCC80',
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '999px',
                          backgroundColor: '#FF7043',
                        }}
                      />
                      ForgeTomorrow recruiter posting
                    </div>
                  )}

                  <div>
                    <h1
                      className="text-2xl sm:text-3xl font-extrabold leading-tight"
                      style={{
                        color: isInternal ? '#FFFFFF' : '#263238',
                        marginBottom: 4,
                      }}
                    >
                      {job?.title || (loading ? 'Loading…' : `Job ${jobId}`)}
                    </h1>
                    {job?.company && (
                      <div
                        className="text-sm sm:text-base"
                        style={{ color: isInternal ? '#CFD8DC' : '#607D8B' }}
                      >
                        {job.company}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status + primary apply */}
                <div className="flex flex-col items-end gap-2 min-w-[150px]">
                  {/* Status chip */}
                  {status && status !== 'Open' && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        border: '1px solid #FFCC80',
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

                  {/* Apply button */}
                  {!loading && job && (
                    <button
                      type="button"
                      onClick={handleApplyClick}
                      disabled={!canApply}
                      className="px-4 py-2 rounded-full text-sm font-semibold shadow-md"
                      style={{
                        backgroundColor: canApply ? '#FF7043' : '#CFD8DC',
                        color: canApply ? '#FFFFFF' : '#607D8B',
                        cursor: canApply ? 'pointer' : 'default',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {status === 'Closed'
                        ? 'Closed'
                        : status === 'Reviewing'
                        ? 'Applications paused'
                        : isInternal
                        ? 'Apply on ForgeTomorrow'
                        : 'Apply on employer site'}
                    </button>
                  )}
                </div>
              </div>

              {/* Meta row: location, location type, posted date */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                {job?.location && (
                  <span
                    style={{
                      color: isInternal ? '#ECEFF1' : '#455A64',
                    }}
                  >
                    📍 {job.location}
                  </span>
                )}

                {locationType && (
                  <span
                    className="px-2 py-1 rounded-full border"
                    style={{
                      borderColor: isInternal ? 'rgba(207,216,220,0.6)' : '#CFD8DC',
                      color: isInternal ? '#CFD8DC' : '#607D8B',
                      backgroundColor: isInternal ? 'rgba(7,12,20,0.9)' : '#FFFFFF',
                    }}
                  >
                    {locationType}
                  </span>
                )}

                <span
                  className="text-xs"
                  style={{
                    color: isInternal ? '#B0BEC5' : '#78909C',
                  }}
                >
                  Posted {postedLabel}
                </span>
              </div>

              {/* Secondary links for external jobs */}
              {!loading && job && !isInternal && (
                <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
                  {applyLink && (
                    <a
                      href={applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                      style={{ color: isInternal ? '#FFCC80' : '#FF7043' }}
                    >
                      Open original posting
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Description card */}
          <section
            className="rounded-2xl border bg-white p-5 sm:p-6"
            style={{
              borderColor: '#E0E0E0',
            }}
          >
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#263238' }}>
              About the role
            </h2>

            {job?.description ? (
              <div
                className="prose prose-sm max-w-none"
                style={{
                  color: '#37474F',
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            ) : (
              <p style={{ color: '#607D8B' }}>
                {loading ? 'Loading details…' : 'No job details available.'}
              </p>
            )}
          </section>

          {/* Status-aware info banner (public view) */}
          {!loading && job && (
            <section>
              {status === 'Reviewing' && (
                <div
                  className="rounded-xl border px-4 py-3 text-xs sm:text-sm"
                  style={{
                    borderColor: '#FFCC80',
                    backgroundColor: '#FFF8E1',
                    color: '#E65100',
                  }}
                >
                  <p className="font-semibold mb-1">
                    This employer is now reviewing applicants.
                  </p>
                  <p className="m-0">
                    New applications may be paused or limited. If you already applied,
                    watch your email for any updates.
                  </p>
                </div>
              )}

              {status === 'Closed' && (
                <div
                  className="rounded-xl border px-4 py-3 text-xs sm:text-sm"
                  style={{
                    borderColor: '#CFD8DC',
                    backgroundColor: '#ECEFF1',
                    color: '#455A64',
                  }}
                >
                  <p className="font-semibold mb-1">
                    This posting is now closed.
                  </p>
                  <p className="m-0">
                    The employer is no longer accepting applications for this role.
                    You can explore active opportunities on the jobs page.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* APPLY MODAL – external jobs only */}
        {showApplyModal && job && !isInternal && (
          <JobApplyModal
            job={job}
            onClose={() => setShowApplyModal(false)}
          />
        )}
      </main>
    </>
  );
}
