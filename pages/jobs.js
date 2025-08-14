// pages/jobs.js
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import GenericSidebar from '../components/GenericSidebar';
import { useJobPipeline, JobPipelineProvider } from '../context/JobPipelineContext';
import { Card, CardHeader, CardTitle, CardContent, CardSubtle } from '../components/ui/Card';
import { track } from '@/lib/track';

// Lightweight Apply modal (inline so this file is self-contained)
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
    // Simulate application creation (since backend isn’t wired yet)
    const applicationId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Fire analytics event (non-blocking)
    track('APPLY_SUBMIT', {
      jobId: String(job.id),
      applicationId,
      metadata: { applicant: { name, email } },
    });

    // Update local pipeline summary
    onApplied(job);

    // Close modal
    onClose();

    // Lightweight confirmation for now
    alert(`Application submitted for: ${job.title}`);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl border bg-white p-6 shadow">
        <h3 className="text-xl font-bold" style={{ color: '#263238' }}>
          Apply to {job.title}
        </h3>
        <p className="text-sm mt-1" style={{ color: '#607D8B' }}>
          {job.company} — {job.location}
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm mb-1" style={{ color: '#263238' }}>
              Full name
            </label>
            <input
              className="w-full rounded-md border px-3 py-2"
              placeholder="Your name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

            <div>
            <label className="block text-sm mb-1" style={{ color: '#263238' }}>
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-md border px-3 py-2"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-md border"
              style={{ background: 'white', color: '#263238' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md font-semibold"
              style={{ background: '#FF7043', color: 'white' }}
            >
              Submit application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Jobs() {
  const { viewedJobs, appliedJobs, addViewedJob, addAppliedJob } = useJobPipeline();
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyJob, setApplyJob] = useState(null);

  // Mock job data (in a real app, fetch from API)
  const jobs = [
    {
      id: 1,
      title: 'Frontend Developer',
      company: 'ForgeTomorrow',
      description: 'Build cutting-edge UIs for modern professionals.',
      location: 'Remote',
    },
    {
      id: 2,
      title: 'Mentor Coordinator',
      company: 'ForgeTomorrow',
      description: 'Help manage and scale mentorship experiences.',
      location: 'Hybrid (Remote/Nashville)',
    },
  ];

  const handleJobView = (job) => {
    addViewedJob(job);
  };

  // open modal and remember which job
  const handleApplyClick = (job) => {
    setApplyJob(job);
    setApplyOpen(true);
  };

  // called after modal submit succeeds
  const handleApplied = (job) => {
    addAppliedJob(job);
  };

  useEffect(() => {
    // Keep your demo behavior: mark both as viewed on load for now
    jobs.forEach((job) => handleJobView(job));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Head>
        <title>ForgeTomorrow - The Pipeline</title>
      </Head>

      {/* Mirror Seeker Dashboard layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '20px',
          padding: '120px 20px 20px',
          minHeight: '100vh',
          backgroundColor: '#ECEFF1',
        }}
      >
        {/* Sidebar column (300px) */}
        <GenericSidebar />

        {/* Main content column (fixed inner width to preserve right margin) */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ maxWidth: 860 }}>
            {/* Header */}
            <Card as="section" style={{ textAlign: 'center', padding: '12px 16px' }}>
              <h1 className="text-3xl font-bold" style={{ color: '#FF7043', margin: 0 }}>
                Job Listings
              </h1>
              <p className="text-gray-600" style={{ marginTop: 4, marginBottom: 0 }}>
                Explore and apply in one place.
              </p>
            </Card>

            {/* Jobs list */}
            {jobs.map((job) => (
              <Card as="section" key={job.id}>
                <CardHeader>
                  <CardTitle className="text-xl">{job.title}</CardTitle>
                  <CardSubtle>
                    {job.company} — {job.location}
                  </CardSubtle>
                </CardHeader>

                <CardContent>
                  <p className="mt-3 text-gray-700" style={{ margin: 0 }}>
                    {job.description}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
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

                    {/* Link to the new public job view page (fires JOB_VIEW there) */}
                    <Link
                      href={`/job/${job.id}`}
                      className="px-3 py-2 rounded-md border"
                      style={{ color: '#263238', background: 'white' }}
                    >
                      View details
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Viewed / Applied Summary */}
            <Card as="section">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#FF7043', marginTop: 0 }}>
                Viewed Jobs
              </h2>
              {viewedJobs.length === 0 ? (
                <p className="text-gray-500 italic" style={{ margin: 0 }}>
                  No jobs viewed yet.
                </p>
              ) : (
                <ul className="list-disc list-inside text-gray-700" style={{ margin: 0 }}>
                  {viewedJobs.map((job) => (
                    <li key={job.id}>{job.title}</li>
                  ))}
                </ul>
              )}

              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ color: '#FF7043' }}>
                Applied Jobs
              </h2>
              {appliedJobs.length === 0 ? (
                <p className="text-gray-500 italic" style={{ margin: 0 }}>
                  No jobs applied yet.
                </p>
              ) : (
                <ul className="list-disc list-inside text-gray-700" style={{ margin: 0 }}>
                  {appliedJobs.map((job) => (
                    <li key={job.id}>{job.title}</li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </main>
      </div>

      {/* Apply modal */}
      <ApplyModal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        job={applyJob}
        onApplied={handleApplied}
      />
    </>
  );
}

// ✅ Wrap the page in the provider and export
export default function JobsPage() {
  return (
    <JobPipelineProvider>
      <Jobs />
    </JobPipelineProvider>
  );
}
