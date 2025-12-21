// components/seeker/dashboard/RecommendedJobsPreview.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RecommendedJobsPreview() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/seeker/recommended-jobs?limit=4');
        if (!res.ok) throw new Error();
        const data = await res.json();
        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      } catch (err) {
        console.error('Recommended jobs load error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-orange-600 mb-4">
          New Matches for You
        </h2>
        <div className="text-center py-8 text-gray-500">Loading opportunities...</div>
      </section>
    );
  }

  if (error || jobs.length === 0) {
    return null; // silently hide if no jobs or error — keeps dashboard clean
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-orange-600">
          New Matches for You
        </h2>
        <Link
          href="/jobs"
          className="text-orange-600 font-medium hover:underline text-sm"
        >
          See more jobs →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="block p-4 border border-gray-100 rounded-lg hover:border-orange-300 hover:shadow transition"
          >
            <h3 className="font-semibold text-gray-900">{job.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{job.company}</p>
            <p className="text-xs text-gray-500 mt-2">
              {job.location} • {job.worksite || job.type || 'Full-time'}
            </p>
            {job.compensation && (
              <p className="text-xs text-orange-600 font-medium mt-2">
                {job.compensation}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}