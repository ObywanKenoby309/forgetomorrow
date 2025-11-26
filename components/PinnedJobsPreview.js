// components/PinnedJobsPreview.js
'use client';

import React, { useEffect, useState } from 'react';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso || '—';
  }
}

export default function PinnedJobsPreview() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/seeker/pinned-jobs?limit=3');
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to load pinned jobs');
        }
        const data = await res.json();
        if (cancelled) return;
        setJobs(data.jobs || []);
      } catch (err) {
        console.error('[PinnedJobsPreview] load error', err);
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
    return <div style={{ color: '#607D8B' }}>Loading pinned jobs…</div>;
  }

  if (error) {
    return (
      <div style={{ color: '#e53e3e', fontSize: 13 }}>
        {error}
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div style={{ color: '#607D8B', fontSize: 14 }}>
        No pinned jobs yet. When you pin roles from the job board, the latest ones will appear here as your “Next Yes.”
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {jobs.map((job) => (
        <div
          key={job.id}
          style={{
            border: '1px solid #eee',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{job.title}</div>
            <div style={{ color: '#546E7A' }}>
              {job.company}
              {job.location ? ` • ${job.location}` : ''}
            </div>
          </div>
          <div style={{ color: '#455A64', fontSize: 13 }}>
            Pinned: {formatDate(job.pinnedAt)}
          </div>
        </div>
      ))}
    </div>
  );
}
