// components/jobs/JobActions.js
import React from 'react';
import Link from 'next/link';
import PinnedJobToggleButton from './PinnedJobToggleButton';

export default function JobActions({
  job,
  isPinned,
  onApply,
  onResumeAlign,
  isPaidUser = false,
  showViewPost = false, // true on pinned page
}) {
  if (!job) return null;

  const applyLink = job.url || job.externalUrl || job.link || job.applyUrl || '';
  const jobDetailUrl = `/jobs?jobId=${job.id}`; // adjust if your jobs page uses different param/query

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
        alignItems: 'center',
      }}
    >
      {/* Pin / Unpin */}
      <PinnedJobToggleButton jobId={job.id} initiallyPinned={isPinned} />

      {/* Apply */}
      <button
        onClick={() => onApply(job)}
        style={{
          background: '#FF7043',
          color: 'white',
          padding: '8px 16px',
          borderRadius: 999,
          border: 'none',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Apply
      </button>

      {/* Resume-Role Align (Pro only) */}
      {isPaidUser && (
        <button
          onClick={() => onResumeAlign(job)}
          style={{
            background: 'white',
            color: '#FF7043',
            padding: '8px 16px',
            borderRadius: 999,
            border: '1px solid #FF7043',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Resume-Role Align
        </button>
      )}

      {/* View Post (only on pinned page) */}
      {showViewPost && (
        <Link
          href={jobDetailUrl}
          style={{
            color: '#FF7043',
            fontSize: 14,
            textDecoration: 'underline',
          }}
        >
          View Post →
        </Link>
      )}
    </div>
  );
}