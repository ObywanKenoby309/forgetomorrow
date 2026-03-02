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

  // ✅ Mobile-only adjustments (PC unchanged)
  const [isMobileTight, setIsMobileTight] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Galaxy S21 Ultra (and most phones) are well under this threshold.
    const mq = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobileTight(!!mq.matches);

    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else mq.addListener(apply);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', apply);
      else mq.removeListener(apply);
    };
  }, []);

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

  // ✅ Desktop stays exactly the same; mobile just tightens spacing
  const rowStyle = {
    display: 'grid',
    gap: isMobileTight ? 8 : 12,
    gridTemplateColumns: 'repeat(5, minmax(0,1fr))',
    cursor: 'pointer',
  };

  const Tile = ({ title, value, stage, mobileTitle }) => {
    const c = colorFor(stageKey(stage));

    const showTitle = isMobileTight ? mobileTitle : title;

    // ✅ Only mobile changes
    const tilePadding = isMobileTight ? '6px 4px' : '10px 12px';
    const titleFontSize = isMobileTight ? 10 : 12;
    const titleSidePad = isMobileTight ? 2 : 6;
    const numberFontSize = isMobileTight ? 18 : 20;
    const innerGap = isMobileTight ? 2 : 4;

    return (
      <div
        style={{
          background: c.bg,
          color: c.text,
          border: `1px solid ${c.solid}`,
          borderRadius: 10,
          padding: tilePadding,
          display: 'grid',
          gap: innerGap,
          textAlign: 'center',
          minWidth: 0,
          boxShadow: 'none',
        }}
      >
        <div
          style={{
            fontSize: titleFontSize,
            fontWeight: 700,
            opacity: 0.92,
            lineHeight: 1.05,
            paddingLeft: titleSidePad,
            paddingRight: titleSidePad,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'clip', // ✅ no “Ap…” unless we truly hit a layout bug
          }}
        >
          {showTitle}
        </div>

        <div style={{ fontSize: numberFontSize, fontWeight: 800, lineHeight: 1.05 }}>
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
      <Tile title="Pinned" mobileTitle="Pin" value={pinned} stage="Pinned" />
      <Tile title="Applied" mobileTitle="Apply" value={applied} stage="Applied" />
      <Tile title="Interviewing" mobileTitle="Interview" value={interviewing} stage="Interviewing" />
      <Tile title="Offers" mobileTitle="Offer" value={offers} stage="Offers" />
      <Tile title="Closed Out" mobileTitle="Close" value={closedOut} stage="Closed Out" />
    </div>
  );
}