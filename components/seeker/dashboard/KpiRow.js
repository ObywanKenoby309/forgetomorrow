// components/seeker/dashboard/KpiRow.js
import React, { useState, useEffect } from 'react';
import { colorFor } from '@/components/seeker/dashboard/seekerColors';
import { useRouter } from 'next/router';

const STAGES = ['Pinned', 'Applied', 'Interviewing', 'Offers', 'Closed Out'];

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
      <div
        style={{
          background: c.bg,
          color: c.text,
          borderRadius: 12,
          padding: '12px 16px',
          border: `1px solid ${c.solid}`,
          display: 'grid',
          gap: 4,
          minWidth: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>
          <AnimatedNumber end={value} />
        </div>
      </div>
    );
  };

  // === MAIN RETURN — clickable row
  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
        cursor: 'pointer',
      }}
      onClick={() => router.push('/seeker/applications')}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
    >
      <Tile title="Pinned" value={pinned} stage="Pinned" />
      <Tile title="Applied" value={applied} stage="Applied" />
      <Tile title="Interviewing" value={interviewing} stage="Interviewing" />
      <Tile title="Offers" value={offers} stage="Offers" />
      <Tile title="Closed Out" value={closedOut} stage="Closed Out" />
    </div>
  );
}