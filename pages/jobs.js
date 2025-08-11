// pages/jobs.js
import { useJobPipeline, JobPipelineProvider } from '../context/JobPipelineContext';
import Head from 'next/head';
import { useEffect } from 'react';
import GenericSidebar from '../components/GenericSidebar';

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

        {/* Main content column */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            <h1 style={{ color: '#FF7043', margin: 0 }} className="text-3xl font-bold mb-2">
              Job Listings
            </h1>
            <p className="text-gray-600">Explore and apply in one place.</p>
          </section>

          {/* Jobs list */}
          {jobs.map((job) => (
            <section
              key={job.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                border: '1px solid #e5e7eb',
              }}
            >
              <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
              <p className="text-gray-600">
                {job.company} — {job.location}
              </p>
              <p className="mt-3 text-gray-700">{job.description}</p>

              <button
                onClick={() => handleApply(job)}
                className="mt-4 bg-[#FF7043] hover:bg-[#F4511E] text-white px-4 py-2 rounded font-bold transition-colors"
              >
                Apply
              </button>
            </section>
          ))}

          {/* Viewed / Applied Summary */}
          <section
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            <h2 className="text-2xl font-bold mb-4 text-[#FF7043]">Viewed Jobs</h2>
            {viewedJobs.length === 0 ? (
              <p className="text-gray-500 italic">No jobs viewed yet.</p>
            ) : (
              <ul className="list-disc list-inside text-gray-700">
                {viewedJobs.map((job) => (
                  <li key={job.id}>{job.title}</li>
                ))}
              </ul>
            )}

            <h2 className="text-2xl font-bold mt-8 mb-4 text-[#FF7043]">Applied Jobs</h2>
            {appliedJobs.length === 0 ? (
              <p className="text-gray-500 italic">No jobs applied yet.</p>
            ) : (
              <ul className="list-disc list-inside text-gray-700">
                {appliedJobs.map((job) => (
                  <li key={job.id}>{job.title}</li>
                ))}
              </ul>
            )}
          </section>
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
