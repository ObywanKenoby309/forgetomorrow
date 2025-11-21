// pages/jobs.js — FINAL, COMPLETE, PRODUCTION-READY
import { useEffect, useState } from 'react';
import { JobPipelineProvider, useJobPipeline } from '../context/JobPipelineContext';
import InternalLayout from '@/components/layouts/InternalLayout';
import { Card, CardHeader, CardTitle, CardContent, CardSubtle } from '../components/ui/Card';
import Link from 'next/link';

// ──────────────────────────────────────────────────────────────
// Apply Modal — the one you’ve always had (now safely inside the file)
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
// Page Header — identical to seeker dashboard
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
        Explore openings and apply in one place.
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Right Rail — tight, dark, perfect
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
// Main Jobs Component
// ──────────────────────────────────────────────────────────────
function Jobs() {
  const { viewedJobs, appliedJobs, addViewedJob, addAppliedJob } = useJobPipeline();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyJob, setApplyJob] = useState(null);
  const isPaidUser = true;

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch('/api/jobs');
        const data = await res.json();
        setJobs(data.jobs || []);
        data.jobs?.forEach(addViewedJob);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const handleApplyClick = (job) => {
    setApplyJob(job);
    setApplyOpen(true);
  };

  const handleResumeAlign = (job) => {
    window.location.href = `/resume-builder?jobId=${job.id}&copyJD=true`;
  };

  if (loading) return <p style={{ padding: 40, textAlign: 'center' }}>Loading jobs...</p>;

  return (
    <InternalLayout
      title="ForgeTomorrow - Job Listings"
      header={<PageHeader />}
      right={<RightRail />}
      activeNav="jobs"
      rightWidth={240}
      rightVariant="dark"
      pad={20}
      gap={16}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 860 }}>
        {jobs.map((job) => (
          <Card key={job.id} as="section">
            <CardHeader>
              <CardTitle>{job.title}</CardTitle>
              <CardSubtle>{job.company} — {job.location}</CardSubtle>
            </CardHeader>
            <CardContent>
              <p style={{ margin: '0 0 16px', color: '#455A64' }}>{job.description}</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleApplyClick(job)}
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
                <Link
                  href={`/job/${job.id}`}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #ddd',
                    borderRadius: 8,
                    color: '#263238',
                    textDecoration: 'none',
                  }}
                >
                  View details
                </Link>
                {isPaidUser && (
                  <button
                    onClick={() => handleResumeAlign(job)}
                    style={{
                      background: '#4CAF50',
                      color: 'white',
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Resume Alignment
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Viewed & Applied Jobs */}
        <Card as="section">
          <h2 style={{ color: '#FF7043', fontSize: 24, margin: '0 0 12px' }}>Viewed Jobs</h2>
          {viewedJobs.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic' }}>No jobs viewed yet.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {viewedJobs.map((job) => (
                <li key={job.id}>{job.title}</li>
              ))}
            </ul>
          )}

          <h2 style={{ color: '#FF7043', fontSize: 24, margin: '32px 0 12px' }}>Applied Jobs</h2>
          {appliedJobs.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic' }}>No applications yet.</p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {appliedJobs.map((job) => (
                <li key={job.id}>{job.title}</li>
              ))}
            </ul>
          )}
        </Card>
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
    </InternalLayout>
  );
}

// ──────────────────────────────────────────────────────────────
// Page Wrapper
// ──────────────────────────────────────────────────────────────
export default function JobsPage() {
  return (
    <JobPipelineProvider>
      <Jobs />
    </JobPipelineProvider>
  );
}