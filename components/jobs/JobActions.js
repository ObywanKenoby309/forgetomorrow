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

  // ✅ NEW (optional): if provided, Apply will navigate here (ex: `/job/${job.id}/apply?chrome=recruiter-ent`)
  applyHref = '',

  // ✅ NEW (optional): if applyHref not provided and no onApply, we can still route correctly
  chrome = '',
}) {
  if (!job) return null;

  const applyLink = job.url || job.externalUrl || job.link || job.applyUrl || '';
  const jobDetailUrl = `/jobs?jobId=${job.id}`; // adjust if your jobs page uses different param/query

  // ✅ Default internal apply URL (only used if you don't pass applyHref and you don't pass onApply)
  const defaultInternalApplyUrl = `/job/${job.id}/apply${chrome ? `?chrome=${encodeURIComponent(chrome)}` : ''}`;

  const handleApply = () => {
    // 1) If parent passed a handler, keep current behavior (modal/external logic lives there)
    if (typeof onApply === 'function') {
      onApply(job);
      return;
    }

    // 2) If parent passed a direct href, go there
    if (applyHref) {
      window.location.href = applyHref;
      return;
    }

    // 3) Fallback: internal apply page
    window.location.href = defaultInternalApplyUrl;
  };

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
        type="button"
        onClick={handleApply}
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
          type="button"
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
