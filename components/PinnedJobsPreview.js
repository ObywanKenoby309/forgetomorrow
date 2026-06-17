// components/PinnedJobsPreview.js
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

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

function PinnedJobCard({ job }) {
  return (
    <Link
      href={`/jobs?selectedJobId=${encodeURIComponent(job.jobId || job.id)}`}
      className="pinnedJobCard"
    >
      <div className="pinnedJobMain">
        <div className="pinnedJobText">
          <h3>{job.title}</h3>
          <p className="company">
            {job.company || 'Company not listed'}
            {job.location ? ` • ${job.location}` : ''}
          </p>
        </div>
        <div className="pinnedBadge">Pinned</div>
      </div>

      <div className="pinnedJobMeta">Saved {formatDate(job.pinnedAt)}</div>
    </Link>
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
        const res = await fetch('/api/seeker/pinned-jobs?limit=4');
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to load pinned jobs');
        }
        const data = await res.json();
        if (cancelled) return;
        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
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
    }, 5000);
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
    return (
      <div className={`pinnedJobsShell ${compact ? 'compact' : ''}`}>
        <div className="pinnedJobsLoading">Loading pinned jobs…</div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`pinnedJobsShell ${compact ? 'compact' : ''}`}>
        <div className="pinnedJobsError">{error}</div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className={`pinnedJobsShell ${compact ? 'compact' : ''}`}>
        <div className="pinnedJobsEmpty">
          <div className="emptyTitle">Your Next Yes is out there.</div>
          <div className="emptyBody">Pin a role that excites you. This space is reserved for the opportunity you actually want to chase.</div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (isMobile) {
    const activeJob = jobs[activeIndex] || jobs[0];

    return (
      <div className={`pinnedJobsShell ${compact ? 'compact' : ''}`}>
        <div
          className="pinnedJobsSingle"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <PinnedJobCard job={activeJob} />
        </div>

        {jobs.length > 1 && (
          <div className="pinnedJobsControls" aria-label="Pinned job carousel controls">
            <button type="button" onClick={goPrevious} aria-label="Previous pinned job">‹</button>
            <div className="pinnedJobsDots" aria-label="Pinned job position">
              {jobs.map((job, idx) => (
                <button
                  key={job.id || idx}
                  type="button"
                  aria-label={`Show pinned job ${idx + 1}`}
                  aria-current={idx === activeIndex ? 'true' : 'false'}
                  onClick={() => setActiveIndex(idx)}
                  className={idx === activeIndex ? 'active' : ''}
                />
              ))}
            </div>
            <button type="button" onClick={goNext} aria-label="Next pinned job">›</button>
          </div>
        )}

        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className={`pinnedJobsShell ${compact ? 'compact' : ''}`}>
      <div className="pinnedJobsGrid">
        {(compact ? jobs.slice(0, 3) : jobs).map((job) => (
          <PinnedJobCard key={job.id} job={job} />
        ))}
      </div>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .pinnedJobsShell {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  .pinnedJobsLoading,
  .pinnedJobsError,
  .pinnedJobsEmpty {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(255,112,67,0.14);
    background: rgba(255,255,255,0.72);
    border-radius: 14px;
    padding: 16px;
    color: #607D8B;
    font-size: 13px;
    font-weight: 700;
  }

  .pinnedJobsError {
    color: #C62828;
  }

  .emptyTitle {
    font-weight: 900;
    color: #9A3412;
    margin-bottom: 6px;
  }

  .emptyBody {
    color: #7C2D12;
    font-size: 12px;
    font-weight: 650;
    line-height: 1.45;
  }

  .pinnedJobsGrid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    width: 100%;
    min-width: 0;
  }

  .pinnedJobCard {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 13px 14px;
    border-radius: 14px;
    border: 1px solid rgba(255,112,67,0.14);
    background: rgba(255,255,255,0.64);
    box-shadow: 0 6px 16px rgba(15,23,42,0.07);
    color: inherit;
    text-decoration: none;
    transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  .pinnedJobCard:hover {
    transform: translateY(-1px);
    border-color: rgba(255,112,67,0.34);
    background: rgba(255,255,255,0.88);
    box-shadow: 0 10px 24px rgba(15,23,42,0.12);
  }

  .pinnedJobMain {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
  }

  .pinnedJobText {
    min-width: 0;
    flex: 1;
  }

  .pinnedJobText h3 {
    margin: 0;
    color: #111827;
    font-size: 14px;
    font-weight: 900;
    line-height: 1.25;
    letter-spacing: -0.01em;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .pinnedJobText .company {
    margin: 5px 0 0;
    color: #526171;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pinnedBadge {
    flex-shrink: 0;
    padding: 6px 8px;
    border-radius: 999px;
    border: 1px solid rgba(255,112,67,0.22);
    background: rgba(255,112,67,0.08);
    color: #D9480F;
    font-size: 10px;
    font-weight: 900;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .pinnedJobMeta {
    margin-top: 9px;
    color: #64748B;
    font-size: 11.5px;
    font-weight: 650;
    line-height: 1.35;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pinnedJobsSingle {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  .pinnedJobsControls {
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .pinnedJobsControls > button {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 1px solid rgba(255,112,67,0.24);
    background: rgba(255,255,255,0.72);
    color: #D9480F;
    font-size: 20px;
    font-weight: 900;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(15,23,42,0.08);
  }

  .pinnedJobsDots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .pinnedJobsDots button {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    border: none;
    padding: 0;
    background: rgba(255,112,67,0.25);
    cursor: pointer;
    transition: width 160ms ease, background 160ms ease;
  }

  .pinnedJobsDots button.active {
    width: 18px;
    background: #FF7043;
  }

  @media (max-width: 767px) {
    .pinnedJobCard {
      padding: 12px 13px;
      border-radius: 14px;
      background: rgba(255,255,255,0.78);
      box-shadow: 0 8px 20px rgba(15,23,42,0.10);
    }

    .pinnedJobText h3 {
      font-size: 13.5px;
      -webkit-line-clamp: 2;
    }

    .pinnedJobText .company {
      font-size: 11.5px;
    }

    .pinnedJobMeta {
      margin-top: 8px;
      font-size: 11px;
    }

    .pinnedBadge {
      padding: 5px 7px;
      font-size: 9px;
    }
  }
`;
