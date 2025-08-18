// pages/seeker/jobs.js
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import { JobPipelineProvider, useJobPipeline } from '@/context/JobPipelineContext';
import { track } from '@/lib/track';

function ApplyModal({ open, onClose, job, onApplied }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setEmail('');
    }
  }, [open]);

  if (!open || !job) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const applicationId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    track('APPLY_SUBMIT', {
      jobId: String(job.id),
      applicationId,
      metadata: { applicant: { name, email } },
    });

    onApplied(job);
    onClose();
    alert(`Application submitted for: ${job.title}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow">
        <h3 className="text-xl font-bold" style={{ color: '#263238' }}>
          Apply to {job.title}
        </h3>
        <p className="text-sm mt-1" style={{ color: '#607D8B' }}>
          {job.company} — {job.location}
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm mb-1" style={{ color: '#263238' }}>Full name</label>
            <input className="w-full rounded-md border px-3 py-2" placeholder="Your name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: '#263238' }}>Email</label>
            <input type="email" className="w-full rounded-md border px-3 py-2" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-md border" style={{ background: 'white', color: '#263238' }}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-md font-semibold" style={{ background: '#FF7043', color: 'white' }}>
              Submit application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SeekerJobsInner() {
  const { viewedJobs, appliedJobs, addViewedJob, addAppliedJob } = useJobPipeline();
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyJob, setApplyJob] = useState(null);

  // Mock jobs (swap to API later)
  const jobs = [
    { id: 1, title: 'Frontend Developer', company: 'ForgeTomorrow', description: 'Build cutting-edge UIs for modern professionals.', location: 'Remote' },
    { id: 2, title: 'Mentor Coordinator', company: 'ForgeTomorrow', description: 'Help manage and scale mentorship experiences.', location: 'Hybrid (Remote/Nashville)' },
  ];

  useEffect(() => {
    jobs.forEach((job) => addViewedJob(job));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyClick = (job) => {
    setApplyJob(job);
    setApplyOpen(true);
  };

  const handleApplied = (job) => addAppliedJob(job);

  // Right rail content (Shortcuts etc.)
  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="pipeline" />
    </div>
  );

  return (
    <SeekerLayout
      title="The Pipeline — Seeker | ForgeTomorrow"
      right={RightRail}
      activeNav="jobs"
      header={
        <section
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>The Pipeline</h1>
          <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
            Explore openings and apply in one place. Your activity feeds your dashboard.
          </p>
        </section>
      }
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {jobs.map((job) => (
          <section
            key={job.id}
            style={{
              background: 'white',
              border: '1px solid #eee',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ display: 'grid', gap: 2 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: '#263238' }}>{job.title}</div>
              <div style={{ fontSize: 13, color: '#607D8B' }}>
                {job.company} — {job.location}
              </div>
            </div>

            <p style={{ marginTop: 10, marginBottom: 0, color: '#455A64' }}>{job.description}</p>

            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => handleApplyClick(job)}
                style={{
                  background: '#FF7043',
                  color: 'white',
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Apply
              </button>
              <Link
                href={`/job/${job.id}`}
                className="px-3 py-2 rounded-md border"
                style={{ color: '#263238', background: 'white' }}
              >
                View details
              </Link>
            </div>
          </section>
        ))}

        <section
          style={{
            background: 'white',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 18, color: '#FF7043', marginTop: 0 }}>Activity</div>

          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700, color: '#263238', marginBottom: 6 }}>Viewed Jobs</div>
            {viewedJobs.length === 0 ? (
              <div style={{ color: '#90A4AE', fontStyle: 'italic' }}>No jobs viewed yet.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, color: '#37474F' }}>
                {viewedJobs.map((job) => (
                  <li key={job.id}>{job.title}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: '#263238', marginBottom: 6 }}>Applied Jobs</div>
            {appliedJobs.length === 0 ? (
              <div style={{ color: '#90A4AE', fontStyle: 'italic' }}>No jobs applied yet.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, color: '#37474F' }}>
                {appliedJobs.map((job) => (
                  <li key={job.id}>{job.title}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <ApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        job={applyJob}
        onApplied={handleApplied}
      />
    </SeekerLayout>
  );
}

export default function SeekerJobsPage() {
  return (
    <JobPipelineProvider>
      <SeekerJobsInner />
    </JobPipelineProvider>
  );
}
