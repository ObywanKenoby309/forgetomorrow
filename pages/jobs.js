// pages/jobs.js
import Head from 'next/head';
import { useEffect } from 'react';
import GenericSidebar from '../components/GenericSidebar';
import { useJobPipeline, JobPipelineProvider } from '../context/JobPipelineContext';
import { Card, CardHeader, CardTitle, CardContent, CardSubtle } from '../components/ui/Card';

function Jobs() {
  const { viewedJobs, appliedJobs, addViewedJob, addAppliedJob } = useJobPipeline();

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

  const handleApply = (job) => {
    addAppliedJob(job);
    alert(`You applied to: ${job.title}`);
  };

  useEffect(() => {
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

                  <button
                    onClick={() => handleApply(job)}
                    className="mt-4"
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
