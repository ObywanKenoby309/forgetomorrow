// components/seeker/dashboard/KpiRow.js
import React, { useState, useEffect } from 'react';
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

  // === ANIMATED COUNTER ===
  const AnimatedNumber = ({ end, duration = 1500 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      if (end === 0) return;
      let start = 0;
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
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

  // === KPI TILE ===
  const Tile = ({ title, value, stage }) => {
    const c = colorFor(stageKey(stage));
    return (
      <div className="kpiTile" style={{ background: c.bg, color: c.text, border: `1px solid ${c.solid}` }}>
        <div className="kpiTitle">{title}</div>
        <div className="kpiValue">
          <AnimatedNumber end={value} />
        </div>
      </div>
    );
  };

  // === MAIN RETURN — clickable row
  return (
    <>
      <style jsx>{`
        .kpiRow {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          cursor: pointer;
        }

        .kpiTile {
          border-radius: 12px;
          padding: 12px 16px;
          display: grid;
          gap: 6px;
          min-width: 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .kpiTitle {
          font-size: 13px;
          opacity: 0.9;
          font-weight: 600;
          line-height: 1.15;
          text-align: center;
          white-space: normal;
          overflow-wrap: anywhere;
        }

        .kpiValue {
          font-size: 24px;
          font-weight: 800;
          line-height: 1;
          text-align: center;
        }

        /* Mobile tightening so labels never collide */
        @media (max-width: 520px) {
          .kpiRow {
            gap: 8px;
          }
          .kpiTile {
            padding: 10px 10px;
          }
          .kpiTitle {
            font-size: 12px;
          }
          .kpiValue {
            font-size: 22px;
          }
        }

        @media (max-width: 420px) {
          .kpiTile {
            padding: 10px 8px;
          }
          .kpiTitle {
            font-size: 11px;
          }
          .kpiValue {
            font-size: 20px;
          }
        }
      `}</style>

      <div
        className="kpiRow"
        onClick={() => router.push('/seeker/applications')}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)')}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') router.push('/seeker/applications');
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
