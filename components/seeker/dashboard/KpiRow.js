// components/seeker/dashboard/KpiRow.js
import React, { useState, useEffect, useMemo } from 'react';
import { colorFor } from '@/components/seeker/dashboard/seekerColors';
import { useRouter } from 'next/router';

const stageKey = (stage) =>
  ({
    Pinned: 'neutral',
    Applied: 'applied',
    Interviewing: 'interviewing',
    Offers: 'offers',
    'Closed Out': 'info',
  }[stage] || 'neutral');

export default function KpiRow({
  pinned = 0,
  applied = 0,
  interviewing = 0,
  offers = 0,
  closedOut = 0,
}) {
  const router = useRouter();

  // Preserve chrome (matches behavior used elsewhere)
  const chrome = useMemo(() => String(router.query?.chrome || '').toLowerCase(), [router.query?.chrome]);
  const withChrome = useMemo(
    () => (path) => (chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path),
    [chrome]
  );

  // === ANIMATED COUNTER (keep behavior, but visuals match Applications) ===
  const AnimatedNumber = ({ end, duration = 900 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      // Reset for fresh animation
      setCount(0);

      // If end is 0, just show 0 (no interval)
      if (!end) return;

      let start = 0;
      const step = end / Math.max(1, Math.floor(duration / 16));
      const timer = setInterval(() => {
        start += step;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }, [end, duration]);

    return <>{count}</>;
  };

  // === KPI TILE (STYLE MATCHES Applications StageStrip) ===
  const Tile = ({ title, value, stage }) => {
    const c = colorFor(stageKey(stage));
    return (
      <div
        className="kpiTile"
        style={{
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.solid}`,
        }}
      >
        <div className="kpiTitle">{title}</div>
        <div className="kpiValue">
          <AnimatedNumber end={value} />
        </div>
      </div>
    );
  };

  return (
    <>
      <style jsx>{`
        /* Match Applications StageStrip grid */
        .kpiRow {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          cursor: pointer;
        }

        /* Match Applications StageStrip tiles */
        .kpiTile {
          border-radius: 10px;
          padding: 10px 12px;
          display: grid;
          gap: 4px;
          text-align: center;
          min-width: 0;
          box-shadow: none; /* Applications has no tile shadow */
          transition: none;
        }

        .kpiTitle {
          font-size: 12px;
          opacity: 0.9;
          white-space: nowrap; /* Applications uses nowrap */
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.15;
        }

        .kpiValue {
          font-size: 20px; /* Applications uses 20 */
          font-weight: 800;
          line-height: 1;
        }

        /* Tighten on small screens */
        @media (max-width: 520px) {
          .kpiRow {
            gap: 8px;
          }
          .kpiTile {
            padding: 10px 10px;
          }
          .kpiTitle {
            font-size: 11px;
          }
          .kpiValue {
            font-size: 18px;
          }
        }
      `}</style>

      <div
        className="kpiRow"
        onClick={() => router.push(withChrome('/seeker/applications'))}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') router.push(withChrome('/seeker/applications'));
        }}
        aria-label="Open applications"
      >
        <Tile title="Pinned" value={pinned} stage="Pinned" />
        <Tile title="Applied" value={applied} stage="Applied" />
        <Tile title="Interviewing" value={interviewing} stage="Interviewing" />
        <Tile title="Offers" value={offers} stage="Offers" />
        <Tile title="Closed Out" value={closedOut} stage="Closed Out" />
      </div>
    </>
  );
}
