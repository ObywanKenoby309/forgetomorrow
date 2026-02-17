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
  const chrome = useMemo(
    () => String(router.query?.chrome || '').toLowerCase(),
    [router.query?.chrome]
  );

  const withChrome = useMemo(
    () => (path) => (chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path),
    [chrome]
  );

  // === ANIMATED COUNTER (behavior stays the same) ===
  const AnimatedNumber = ({ end, duration = 900 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      setCount(0);
      if (!end) return;

      let start = 0;
      const steps = Math.max(1, Math.floor(duration / 16));
      const step = end / steps;

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

  // === TILE (visuals match Applications StageStrip) ===
  const Tile = ({ title, value, stage }) => {
    const c = colorFor(stageKey(stage));
    return (
      <div
        className="ftKpiTile"
        style={{
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.solid}`,
        }}
      >
        <div className="ftKpiTitle">{title}</div>
        <div className="ftKpiValue">
          <AnimatedNumber end={value} />
        </div>
      </div>
    );
  };

  return (
    <>
      <style jsx>{`
        .ftKpiRow {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          cursor: pointer;
        }

        /* Match Applications StageStrip tile shape + spacing */
        .ftKpiTile {
          border-radius: 10px;
          padding: 10px 12px;
          display: grid;
          gap: 4px;
          text-align: center;
          min-width: 0;
          box-shadow: none;
        }

        /* Match Applications label */
        .ftKpiTitle {
          font-size: 12px;
          opacity: 0.9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.15;
        }

        /* Match Applications number */
        .ftKpiValue {
          font-size: 20px;
          font-weight: 800;
          line-height: 1;
        }

        @media (max-width: 520px) {
          .ftKpiRow {
            gap: 8px;
          }
          .ftKpiTile {
            padding: 10px 10px;
          }
          .ftKpiTitle {
            font-size: 11px;
          }
          .ftKpiValue {
            font-size: 18px;
          }
        }
      `}</style>

      <div
        className="ftKpiRow"
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
