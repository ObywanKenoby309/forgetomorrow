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

          // ✅ LESS padding so labels can breathe horizontally on mobile
          padding: '8px 8px',

          display: 'grid',
          // ✅ tighter vertical rhythm so the number stays visually centered
          gap: 3,
          textAlign: 'center',
          minWidth: 0,
          boxShadow: 'none',
        }}
      >
        {/* ✅ Short labels + horizontal breathing room */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            opacity: 0.92,
            lineHeight: 1.05,
            padding: '0 6px', // ✅ breathing space left/right for label
            whiteSpace: 'nowrap', // ✅ keep on one line (labels are short now)
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title}
        </div>

        {/* ✅ Number stays centered and prominent */}
        <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.05 }}>
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
      <Tile title="Pin" value={pinned} stage="Pinned" />
      <Tile title="Apply" value={applied} stage="Applied" />
      <Tile title="Interview" value={interviewing} stage="Interviewing" />
      <Tile title="Offer" value={offers} stage="Offers" />
      <Tile title="Close" value={closedOut} stage="Closed Out" />
    </div>
  );
}