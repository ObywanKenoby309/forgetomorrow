// components/seeker/dashboard/ProfilePerformanceTeaser.js
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const STATS = [
  {
    key: 'viewsLast7',
    label: 'Profile Views',
    sub: '7 days',
    icon: '👁',
    color: '#FF7043',
    bg: 'rgba(255,112,67,0.08)',
    border: 'rgba(255,112,67,0.20)',
  },
  {
    key: 'searchAppearancesLast7',
    label: 'Search Hits',
    sub: '7 days',
    icon: '🔍',
    color: '#1E88E5',
    bg: 'rgba(30,136,229,0.08)',
    border: 'rgba(30,136,229,0.20)',
  },
  {
    key: 'completionPercent',
    label: 'Completion',
    sub: 'profile',
    icon: '⚡',
    color: '#43A047',
    bg: 'rgba(67,160,71,0.08)',
    border: 'rgba(67,160,71,0.20)',
    suffix: '%',
  },
];

function StatCard({ icon, label, sub, value, color, bg, border, suffix = '' }) {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 12,
        padding: '14px 10px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 20, lineHeight: 1 }}>{icon}</div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 900,
          color,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        {value}{suffix}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color, opacity: 0.85, textAlign: 'center', lineHeight: 1.2 }}>
        {label}
      </div>
      <div style={{ fontSize: 10, color: '#90A4AE', fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

export default function ProfilePerformanceTeaser() {
  const [data, setData] = useState({
    viewsLast7: 0,
    searchAppearancesLast7: 0,
    completionPercent: 0,
  });
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 90,
              borderRadius: 12,
              background: 'rgba(0,0,0,0.05)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: '#112033' }}>
          Profile Performance
        </div>
        <Link
          href="/profile-analytics"
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#FF7043',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Full analytics →
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 8 }}>
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
          />
        ))}
      </div>
    </div>
  );
}