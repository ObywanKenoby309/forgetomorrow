// components/seeker/dashboard/ProfilePerformanceTeaser.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const STATS = [
  {
    key: 'viewsLast7',
    label: 'Profile Views',
    sub: '7 days',
    icon: '👁',
    color: '#E85D2F',
    bg: 'rgba(255,112,67,0.20)',
    border: 'rgba(255,112,67,0.42)',
  },
  {
    key: 'searchAppearancesLast7',
    label: 'Search Hits',
    sub: '7 days',
    icon: '🔍',
    color: '#1E73BE',
    bg: 'rgba(30,136,229,0.20)',
    border: 'rgba(30,136,229,0.42)',
  },
  {
    key: 'completionPercent',
    label: 'Completion',
    sub: 'profile',
    icon: '⚡',
    color: '#2E9D48',
    bg: 'rgba(67,160,71,0.20)',
    border: 'rgba(67,160,71,0.42)',
    suffix: '%',
  },
];

function StatCard({ icon, label, sub, value, color, bg, border, suffix = '', compact = false }) {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: compact ? 10 : 12,
        padding: compact ? '8px 6px' : '14px 10px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 2 : 4,
        flex: 1,
        minWidth: 0,
        boxShadow: '0 8px 18px rgba(15,23,42,0.08)',
      }}
    >
      <div style={{ fontSize: compact ? 15 : 20, lineHeight: 1 }}>{icon}</div>
      <div
        style={{
          fontSize: compact ? 20 : 26,
          fontWeight: 950,
          color,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
        }}
      >
        {value}{suffix}
      </div>
      <div style={{ fontSize: compact ? 8.5 : 11, fontWeight: 800, color, opacity: 0.92, textAlign: 'center', lineHeight: 1.12 }}>
        {label}
      </div>
      <div style={{ fontSize: compact ? 8 : 10, color: '#607D8B', fontWeight: 700, lineHeight: 1.1 }}>{sub}</div>
    </div>
  );
}

export default function ProfilePerformanceTeaser({ layout = 'row', compact = false }) {
  const router = useRouter();

  const [data, setData] = useState({
    viewsLast7: 0,
    searchAppearancesLast7: 0,
    completionPercent: 0,
  });
  const [loading, setLoading] = useState(true);

  const chrome = Array.isArray(router.query.chrome)
    ? router.query.chrome[0]
    : router.query.chrome;

  const analyticsHref = chrome
    ? `/profile-analytics?chrome=${encodeURIComponent(chrome)}`
    : '/profile-analytics';

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/seeker/profile-performance-teaser');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Profile performance teaser load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const isVertical = layout === 'vertical';

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap: compact ? 6 : 8 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: compact ? 62 : 90,
              borderRadius: compact ? 10 : 12,
              background: 'rgba(255,255,255,0.28)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 8 : 10 }}>
      <div style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap: compact ? 6 : 8 }}>
        {STATS.map((s) => (
          <StatCard
            key={s.key}
            icon={s.icon}
            label={s.label}
            sub={s.sub}
            value={data[s.key] ?? 0}
            color={s.color}
            bg={s.bg}
            border={s.border}
            suffix={s.suffix}
            compact={compact}
          />
        ))}
      </div>

      <Link
        href={analyticsHref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          borderRadius: compact ? 9 : 10,
          border: '1px solid rgba(255,112,67,0.28)',
          background: 'rgba(255,112,67,0.10)',
          color: '#E85D2F',
          fontSize: compact ? 10 : 12,
          fontWeight: 900,
          lineHeight: 1.2,
          padding: compact ? '7px 8px' : '9px 10px',
          textDecoration: 'none',
        }}
      >
        View analytics →
      </Link>
    </div>
  );
}