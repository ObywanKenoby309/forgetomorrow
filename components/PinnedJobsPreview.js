// components/PinnedJobsPreview.js
'use client';

import React, { useEffect, useRef, useState } from 'react';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso || '—';
  }
}

function useIsMobile(bp = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < bp);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [bp]);

  return isMobile;
}

function PinnedCard({ job, compact = false }) {
  return (
    <div
      style={{
        border: '1px solid rgba(255,112,67,0.14)',
        borderRadius: compact ? 12 : 14,
        padding: compact ? '10px 11px' : '13px 14px',
        display: 'block',
        background: compact ? 'rgba(255,255,255,0.64)' : 'rgba(255,255,255,0.74)',
        boxShadow: '0 6px 16px rgba(15,23,42,0.07)',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontWeight: 900,
          color: '#111827',
          fontSize: compact ? 13 : 14,
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {job.title}
      </div>
      <div
        style={{
          marginTop: 5,
          color: '#526171',
          fontSize: compact ? 11.5 : 12,
          fontWeight: 700,
          lineHeight: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {job.company || 'Company not listed'}
      </div>
      <div
        style={{
          marginTop: 8,
          color: '#64748B',
          fontSize: compact ? 10.5 : 11.5,
          fontWeight: 650,
          lineHeight: 1.35,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {job.location || 'Location not listed'}
      </div>
      <div
        style={{
          marginTop: 6,
          color: '#D9480F',
          fontSize: compact ? 10.5 : 12,
          fontWeight: 900,
          lineHeight: 1.35,
        }}
      >
        📌 Pinned {formatDate(job.pinnedAt)}
      </div>
    </div>
  );
}

export default function PinnedJobsPreview({ compact = false, autoRotateMobile = false }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef(null);
  const isMobile = useIsMobile();

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

  useEffect(() => {
    if (activeIndex > Math.max(jobs.length - 1, 0)) {
      setActiveIndex(0);
    }
  }, [activeIndex, jobs.length]);

  useEffect(() => {
    if (!isMobile || !autoRotateMobile || jobs.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((idx) => (idx + 1) % jobs.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [autoRotateMobile, isMobile, jobs.length]);

  const goPrevious = () => {
    if (jobs.length <= 1) return;
    setActiveIndex((idx) => (idx - 1 + jobs.length) % jobs.length);
  };

  const goNext = () => {
    if (jobs.length <= 1) return;
    setActiveIndex((idx) => (idx + 1) % jobs.length);
  };

  const handleTouchStart = (e) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStart.current === null || jobs.length <= 1) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goNext();
      else goPrevious();
    }
    touchStart.current = null;
  };

  if (loading) {
    return <div style={{ color: '#607D8B', fontSize: compact ? 11 : 13, fontWeight: 700 }}>Loading pinned jobs…</div>;
  }

  if (error) {
    return (
      <div style={{ color: '#e53e3e', fontSize: compact ? 11 : 13 }}>
        {error}
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div
        style={{
          padding: compact ? 10 : 12,
          borderRadius: compact ? 12 : 14,
          background: 'rgba(255,255,255,0.64)',
          border: '1px solid rgba(255,112,67,0.18)',
          boxShadow: '0 6px 16px rgba(15,23,42,0.07)',
        }}
      >
        <div style={{ fontWeight: 900, color: '#9A3412', marginBottom: 5, fontSize: compact ? 12 : 13, lineHeight: 1.25 }}>
          No pinned jobs yet.
        </div>
        <div style={{ color: '#7C2D12', fontSize: compact ? 10.5 : 12, lineHeight: 1.4, fontWeight: 650 }}>
          Save jobs you want to chase. They’ll appear here.
        </div>
      </div>
    );
  }

  if (isMobile && compact) {
    const activeJob = jobs[activeIndex] || jobs[0];

    return (
      <div style={{ minWidth: 0 }}>
        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <PinnedCard job={activeJob} compact={compact} />
        </div>

        {jobs.length > 1 && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <button type="button" onClick={goPrevious} aria-label="Previous pinned job" style={navButtonStyle}>‹</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {jobs.map((job, idx) => (
                <button
                  key={job.id || idx}
                  type="button"
                  aria-label={`Show pinned job ${idx + 1}`}
                  onClick={() => setActiveIndex(idx)}
                  style={{
                    width: idx === activeIndex ? 18 : 6,
                    height: 6,
                    borderRadius: 999,
                    border: 'none',
                    padding: 0,
                    background: idx === activeIndex ? '#FF7043' : 'rgba(255,112,67,0.25)',
                    cursor: 'pointer',
                    transition: 'width 160ms ease, background 160ms ease',
                  }}
                />
              ))}
            </div>
            <button type="button" onClick={goNext} aria-label="Next pinned job" style={navButtonStyle}>›</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: compact ? 10 : 12 }}>
      {jobs.map((job) => (
        <PinnedCard key={job.id} job={job} compact={compact} />
      ))}
    </div>
  );
}

const navButtonStyle = {
  width: 28,
  height: 28,
  borderRadius: 999,
  border: '1px solid rgba(255,112,67,0.24)',
  background: 'rgba(255,255,255,0.72)',
  color: '#D9480F',
  fontSize: 20,
  fontWeight: 900,
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
};
