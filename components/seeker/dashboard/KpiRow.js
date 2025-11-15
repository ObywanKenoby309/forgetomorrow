// components/seeker/dashboard/KpiRow.js
import React, { useState, useEffect } from 'react';
import { kpiColors } from '@/components/seeker/dashboard/seekerColors';
import { useRouter } from 'next/router';

export default function KpiRow({
  applied = 0,
  viewed = 0,
  interviewing = 0,
  offers = 0,
  rejected = 0,
  lastApplicationSent,
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
  const Tile = ({ title, value, stage, pulse = false }) => {
    const { bg, text, border } = kpiColors(stage);
    return (
      <div
        style={{
          background: bg,
          color: text,
          borderRadius: 12,
          padding: '12px 16px',
          border: `1px solid ${border || 'rgba(0,0,0,0.08)'}`,
          display: 'grid',
          gap: 4,
          minWidth: 0,
          boxShadow: pulse ? '0 0 20px rgba(255, 112, 67, 0.6)' : '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          cursor: pulse ? 'pointer' : 'default',
          position: 'relative',
          overflow: 'hidden',
        }}
        onClick={pulse ? () => router.push('/resume/select-template') : undefined}
      >
        {pulse && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle, rgba(255,112,67,0.3) 0%, transparent 70%)',
              animation: 'pulse 2s infinite',
            }}
          />
        )}
        <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>
          {stage === 'info' ? value : <AnimatedNumber end={value} />}
        </div>
      </div>
    );
  };

  // === CTA BANNER — ONLY ONE! ===
  const CtaBanner = () => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
      <div
        style={{
          gridColumn: '1 / -1',
          background: 'linear-gradient(135deg, #FF7043 0%, #F4511E 100%)',
          color: 'white',
          padding: '16px 20px',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 25px rgba(255, 112, 67, 0.3)',
          animation: 'slideUp 0.6s ease-out',
          cursor: 'pointer',
          marginTop: 8,
          fontFamily: 'inherit',
        }}
        onClick={() => router.push('/resume-cover')}
      >
        {/* LEFT: TEXT */}
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            87% get interviews in 7 days
          </div>
          <div style={{ fontSize: 14, opacity: 0.95, marginTop: 2 }}>
            <em>with an ATS-aligned resume</em>
          </div>
        </div>

        {/* RIGHT: BUTTON */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.25)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: 999,
            fontWeight: 600,
            fontSize: 15,
            animation: 'pulseBtn 1.8s infinite',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          Build Resume
        </div>
      </div>
    );
  };

  // === MAIN RETURN ===
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
      <Tile title="Applications Sent" value={applied} stage="applied" />
      <Tile title="Viewed by Employers" value={viewed} stage="viewed" />
      <Tile title="Interviews Scheduled" value={interviewing} stage="interviewing" pulse={true} />
      <Tile title="Offers Received" value={offers} stage="offers" />
      <Tile title="Rejected" value={rejected} stage="rejected" />
      <Tile title="Last Sent" value={lastApplicationSent || '—'} stage="info" />

      {/* CTA BANNER */}
      <CtaBanner />
    </div>
  );
}

// === CSS ANIMATIONS ===
const styles = `
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  @keyframes pulseBtn {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}