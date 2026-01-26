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

  // ✅ Optional: if provided, Apply will navigate here.
  // IMPORTANT: chrome is NEVER trusted from applyHref - we inherit chrome and apply it safely.
  applyHref = '',

  // ✅ Optional: chrome context (preferred). If not provided, we inherit from current URL.
  chrome = '',
}) {
  if (!job) return null;

  const applyLink = job.url || job.externalUrl || job.link || job.applyUrl || '';
  const jobDetailUrl = `/jobs?jobId=${job.id}`; // adjust if your jobs page uses different param/query

  // ✅ Inherit chrome if not explicitly passed
  const getInheritedChrome = () => {
    if (chrome) return String(chrome);
    if (typeof window === 'undefined') return '';
    try {
      const params = new URLSearchParams(window.location.search);
      return String(params.get('chrome') || '');
    } catch {
      return '';
    }
  };

  const effectiveChrome = getInheritedChrome().toLowerCase();

  // ✅ Apply chrome safely to a URL (strip any existing chrome= from input)
  const applyChromeToHref = (href) => {
    if (!href || typeof window === 'undefined') return href;

    try {
      const url = new URL(href, window.location.origin);

      // Strip any incoming chrome to prevent hard-coded/grafted chrome
      url.searchParams.delete('chrome');

      // Re-apply the inherited/explicit chrome if present
      if (effectiveChrome) {
        url.searchParams.set('chrome', effectiveChrome);
      }

      // Return as relative so we don’t accidentally force origin changes
      return `${url.pathname}${url.search}${url.hash}`;
    } catch (err) {
      // If URL parsing fails (weird input), fall back to the raw href
      return href;
    }
  };

  // ✅ Default internal apply URL (only used if you don't pass applyHref and you don't pass onApply)
  const defaultInternalApplyUrl = applyChromeToHref(`/job/${job.id}/apply`);

  const handleApply = () => {
    // 1) If parent passed a handler, keep current behavior (modal/external logic lives there)
    if (typeof onApply === 'function') {
      onApply(job);
      return;
    }

    // 2) If parent passed a direct href, go there (but chrome is sanitized)
    if (applyHref) {
      window.location.href = applyChromeToHref(applyHref);
      return;
    }

    // 3) Fallback: internal apply page (inherits chrome)
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
