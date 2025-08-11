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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex">
      <GenericSidebar top={80} />

      <main className="flex-1 md:ml-64 max-w-4xl mx-auto p-6">
        <Head>
          <title>ForgeTomorrow - The Pipeline</title>
        </Head>

        <h1 className="text-3xl font-bold text-[#FF7043] mb-6">Job Listings</h1>

        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800">{job.title}</h2>
            <p className="text-gray-600">
              {job.company} - {job.location}
            </p>
            <p className="mt-3 text-gray-700">{job.description}</p>

            <button
              onClick={() => handleApply(job)}
              className="mt-4 bg-[#FF7043] hover:bg-[#F4511E] text-white px-4 py-2 rounded transition"
            >
              Apply
            </button>
          </div>
        ))}

        {/* Viewed / Applied Summary */}
        <div className="mt-12">
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
        </div>
      </main>
    </div>
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
