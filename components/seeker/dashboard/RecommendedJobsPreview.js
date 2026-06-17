// components/seeker/dashboard/RecommendedJobsPreview.js
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

function getAlignmentScore(job) {
  if (typeof job?.match === 'number' && job.match > 0) {
    return Math.round(job.match);
  }

  return null;
}

function getAlignmentLabel(score) {
  if (score >= 80) return 'Strong Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Adjacent Match';
  if (score > 0) return 'Weak Match';
  return '';
}

function formatLocation(job) {
  const location = job?.location || 'Location not listed';
  const worksite = job?.worksite || job?.type || 'Full-time';
  return `${location} • ${worksite}`;
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

function JobCard({ job }) {
  const alignmentScore = getAlignmentScore(job);
  const alignmentLabel = getAlignmentLabel(alignmentScore);

  return (
    <Link
      href={`/jobs?selectedJobId=${encodeURIComponent(job.id)}`}
      className="recommendedJobCard"
    >
      <div className="recommendedJobMain">
        <div className="recommendedJobText">
          <h3>{job.title}</h3>
          <p className="company">{job.company || 'Company not listed'}</p>
        </div>

        {typeof alignmentScore === 'number' && (
          <div className="alignmentPill" aria-label={`Alignment ${alignmentScore}% ${alignmentLabel}`}>
            <span className="alignmentScore">{alignmentScore}%</span>
            {alignmentLabel && <span className="alignmentLabel">{alignmentLabel}</span>}
          </div>
        )}
      </div>

      <div className="recommendedJobMeta">{formatLocation(job)}</div>

      {job.compensation && (
        <div className="recommendedJobComp">{job.compensation}</div>
      )}
    </Link>
  );
}

export default function RecommendedJobsPreview({ compact = false, autoRotateMobile = false }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef(null);
  const isMobile = useIsMobile();

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

  useEffect(() => {
    if (activeIndex > Math.max(jobs.length - 1, 0)) {
      setActiveIndex(0);
    }
  }, [activeIndex, jobs.length]);


  useEffect(() => {
    if (!isMobile || !autoRotateMobile || jobs.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((idx) => (idx + 1) % jobs.length);
    }, 4500);
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
      <div className={`recommendedJobsShell ${compact ? "compact" : ""}`}>
        <div className="recommendedJobsLoading">Loading opportunities...</div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (error || jobs.length === 0) {
    return null;
  }

  if (isMobile) {
    const activeJob = jobs[activeIndex] || jobs[0];

    return (
      <div className={`recommendedJobsShell ${compact ? "compact" : ""}`}>
        <div
          className="recommendedJobsSingle"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <JobCard job={activeJob} />
        </div>

        {jobs.length > 1 && (
          <div className="recommendedJobsControls" aria-label="Recommended job carousel controls">
            <button type="button" onClick={goPrevious} aria-label="Previous recommended job">
              ‹
            </button>

            <div className="recommendedJobsDots" aria-label="Recommended job position">
              {jobs.map((job, idx) => (
                <button
                  key={job.id || idx}
                  type="button"
                  aria-label={`Show recommended job ${idx + 1}`}
                  aria-current={idx === activeIndex ? 'true' : 'false'}
                  onClick={() => setActiveIndex(idx)}
                  className={idx === activeIndex ? 'active' : ''}
                />
              ))}
            </div>

            <button type="button" onClick={goNext} aria-label="Next recommended job">
              ›
            </button>
          </div>
        )}

        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className={`recommendedJobsShell ${compact ? "compact" : ""}`}>
      <div className="recommendedJobsGrid" aria-label="Recommended job matches">
        {(compact ? jobs.slice(0, 3) : jobs).map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .recommendedJobsShell {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  .recommendedJobsLoading {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    border: 1px solid rgba(255,112,67,0.14);
    background: rgba(255,255,255,0.72);
    border-radius: 14px;
    padding: 16px;
    text-align: center;
    color: #607D8B;
    font-size: 13px;
    font-weight: 700;
  }

  .recommendedJobsGrid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    width: 100%;
    min-width: 0;
  }

  .recommendedJobsShell.compact .recommendedJobsGrid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .recommendedJobsShell.compact .recommendedJobCard {
    background: rgba(255,255,255,0.64);
    box-shadow: 0 6px 16px rgba(15,23,42,0.07);
  }

  .recommendedJobsSingle {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    box-sizing: border-box;
  }

  .recommendedJobCard {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    padding: 13px 14px;
    border-radius: 14px;
    border: 1px solid rgba(255,112,67,0.14);
    background: rgba(255,255,255,0.74);
    box-shadow: 0 6px 18px rgba(15,23,42,0.08);
    color: inherit;
    text-decoration: none;
    transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  .recommendedJobCard:hover {
    transform: translateY(-1px);
    border-color: rgba(255,112,67,0.34);
    background: rgba(255,255,255,0.88);
    box-shadow: 0 10px 24px rgba(15,23,42,0.12);
  }

  .recommendedJobMain {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
  }

  .recommendedJobText {
    min-width: 0;
    flex: 1;
  }

  .recommendedJobText h3 {
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

  .recommendedJobText .company {
    margin: 5px 0 0;
    color: #526171;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .alignmentPill {
    flex-shrink: 0;
    min-width: 58px;
    max-width: 76px;
    padding: 6px 7px;
    border-radius: 12px;
    border: 1px solid rgba(255,112,67,0.22);
    background: rgba(255,112,67,0.08);
    text-align: center;
  }

  .alignmentScore {
    display: block;
    color: #D9480F;
    font-size: 16px;
    font-weight: 950;
    line-height: 1;
  }

  .alignmentLabel {
    display: block;
    margin-top: 3px;
    color: #64748B;
    font-size: 9.5px;
    font-weight: 850;
    line-height: 1.1;
  }

  .recommendedJobMeta,
  .recommendedJobComp {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recommendedJobMeta {
    margin-top: 9px;
    color: #64748B;
    font-size: 11.5px;
    font-weight: 650;
    line-height: 1.35;
  }

  .recommendedJobComp {
    margin-top: 6px;
    color: #D9480F;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.35;
  }

  .recommendedJobsControls {
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .recommendedJobsControls > button {
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

  .recommendedJobsDots {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .recommendedJobsDots button {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    border: none;
    padding: 0;
    background: rgba(255,112,67,0.25);
    cursor: pointer;
    transition: width 160ms ease, background 160ms ease;
  }

  .recommendedJobsDots button.active {
    width: 18px;
    background: #FF7043;
  }

  @media (max-width: 767px) {
    .recommendedJobsShell {
      margin: 0;
      overflow: hidden;
    }

    .recommendedJobCard {
      padding: 12px 13px;
      border-radius: 14px;
      background: rgba(255,255,255,0.78);
      box-shadow: 0 8px 20px rgba(15,23,42,0.10);
    }

    .recommendedJobText h3 {
      font-size: 13.5px;
      -webkit-line-clamp: 2;
    }

    .recommendedJobText .company {
      font-size: 11.5px;
    }

    .alignmentPill {
      min-width: 54px;
      max-width: 64px;
      padding: 5px 6px;
    }

    .alignmentScore {
      font-size: 15px;
    }

    .alignmentLabel {
      font-size: 9px;
    }

    .recommendedJobMeta {
      margin-top: 8px;
      font-size: 11px;
    }

    .recommendedJobComp {
      font-size: 11.5px;
    }
  }
`;
