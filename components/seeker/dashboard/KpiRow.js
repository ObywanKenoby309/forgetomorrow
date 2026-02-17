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

  // ✅ Inline styles to guarantee identical rendering to Applications StageStrip
  const rowStyle = {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(5, minmax(0,1fr))',
    cursor: 'pointer',
  };

  const Tile = ({ title, value, stage }) => {
    const c = colorFor(stageKey(stage));
    return (
      <div
        style={{
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.solid}`,
          borderRadius: 10,
          padding: '10px 12px',
          display: 'grid',
          gap: 4,
          textAlign: 'center',
          minWidth: 0,
          boxShadow: 'none',
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.9, whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>
          <AnimatedNumber end={value} />
        </div>
      </div>
    );
  };

  return (
    <div
      style={rowStyle}
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
  );
}
