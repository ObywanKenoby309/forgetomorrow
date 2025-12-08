// components/PinnedJobs.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso || '—';
  }
}

export default function PinnedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/seeker/pinned-jobs');
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to load pinned jobs');
        }
        const data = await res.json();
        if (cancelled) return;
        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
      } catch (err) {
        console.error('[PinnedJobs] load error', err);
        if (!cancelled) setError(err.message || 'Failed to load pinned jobs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-[#FF7043] text-2xl font-semibold mb-4">
          Pinned Jobs
        </h2>
        <div className="text-gray-500 text-sm">Loading pinned jobs…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-[#FF7043] text-2xl font-semibold mb-4">
          Pinned Jobs
        </h2>
        <div className="text-red-600 text-sm">{error}</div>
      </section>
    );
  }

  if (!jobs.length) {
    return (
      <section className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-[#FF7043] text-2xl font-semibold mb-4">
          Pinned Jobs
        </h2>
        <div className="text-gray-600 text-sm">
          No pinned jobs yet. When you pin roles from the job board, they will
          appear here for quick access.
        </div>
      </section>
    );
  }

  return (
    <section className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-[#FF7043] text-2xl font-semibold mb-4">Pinned Jobs</h2>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div
            key={job.id || job.pinnedId}
            className="p-4 border rounded-lg bg-[#FAFAFA] flex flex-col md:flex-row justify-between items-start md:items-center"
          >
            <div>
              <h3 className="text-lg font-semibold text-[#212121]">
                {job.title || 'Untitled role'}
              </h3>
              <p className="text-gray-600">
                {job.company || 'Unknown company'}
                {job.location ? ` • ${job.location}` : ''}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Pinned: {formatDate(job.pinnedAt)}
              </p>
            </div>

            <div className="flex gap-3 mt-3 md:mt-0">
              {job.id ? (
                <Link href={`/jobs/apply/${job.id}`} className="flex-1">
                  <button className="bg-[#FF7043] text-white px-4 py-2 rounded hover:bg-[#F4511E] transition-colors w-full">
                    Apply Now
                  </button>
                </Link>
              ) : (
                <button
                  disabled
                  className="bg-gray-300 text-white px-4 py-2 rounded cursor-not-allowed"
                >
                  Apply
                </button>
              )}

              <button
                type="button"
                onClick={() => alert('Unpin coming soon')}
                className="border border-gray-400 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
