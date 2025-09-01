// pages/seeker-dashboard.js
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import SeekerLayout from '@/components/layouts/SeekerLayout';
import SeekerRightColumn from '@/components/seeker/SeekerRightColumn';
import PinnedJobsPreview from '@/components/PinnedJobsPreview';

// DASHBOARD WIDGETS (graphs)
import KpiRow from '@/components/seeker/dashboard/KpiRow';
import FunnelChart from '@/components/seeker/dashboard/FunnelChart';
import ApplicationsOverTime from '@/components/seeker/dashboard/ApplicationsOverTime';

const STORAGE_KEY = 'applicationsTracker';

/* ---------- helpers: last N ISO weeks + bucketing ---------- */
const startOfISOWeek = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // 1..7 (Mon..Sun)
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
};
const weekDiff = (a /* Date */, b /* Date */) => {
  const MSWEEK = 7 * 24 * 3600 * 1000;
  return Math.floor((a - b) / MSWEEK);
};
/** Build W8..W1 buckets from trackerData (Applied + Interviewing by dateAdded) */
function buildWeekSeries(trackerData, n = 8) {
  const today = new Date();
  const thisWeek = startOfISOWeek(today);

  // init W8..W1 oldest->newest
  const labels = Array.from({ length: n }, (_, i) => `W${n - i}`);
  const buckets = labels.map(() => ({ applied: 0, interviews: 0 }));

  const countItem = (isoDate, kind /* 'applied' | 'interviews' */) => {
    if (!isoDate) return;
    const d = new Date(isoDate);
    if (isNaN(d)) return;
    const wStart = startOfISOWeek(d);
    const diff = weekDiff(thisWeek, wStart); // 0=cur week, 1=last week, etc.
    if (diff >= 0 && diff < n) {
      const idx = n - diff - 1; // map 0..n-1 to Wn..W1
      buckets[idx][kind] += 1;
    }
  };

  // Applied by dateAdded
  (trackerData?.Applied || []).forEach((j) => countItem(j.dateAdded, 'applied'));
  // Interviewing by dateAdded
  (trackerData?.Interviewing || []).forEach((j) => countItem(j.dateAdded, 'interviews'));

  // produce [{label:'W8', applied:x, interviews:y}, ... 'W1']
  return labels.map((label, i) => ({ label, applied: buckets[i].applied, interviews: buckets[i].interviews }));
}

export default function SeekerDashboard() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [trackerData, setTrackerData] = useState({
    Pinned: [],
    Applied: [],
    Interviewing: [],
    Offers: [],
    Rejected: [],
    // optionally: viewedByEmployers, lastApplicationAt, Hired
  });

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      try { setTrackerData(JSON.parse(saved)); } catch {}
    }
  }, []);

  // KPIs
  const kpi = {
    applied:      trackerData?.Applied?.length || 0,
    viewed:       trackerData?.viewedByEmployers || 0,
    interviewing: trackerData?.Interviewing?.length || 0,
    offers:       trackerData?.Offers?.length || 0,
    rejected:     trackerData?.Rejected?.length || 0,
    hired:        trackerData?.Hired?.length || 0,
    lastSent:     trackerData?.lastApplicationAt
                    ? new Date(trackerData.lastApplicationAt).toLocaleDateString()
                    : '—',
  };

  // build W8..W1 from data (memoized)
  const weeks = useMemo(() => buildWeekSeries(trackerData, 8), [trackerData]);

  // Header
  const HeaderBox = (
    <section
      style={{
        background: 'white',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, color: '#FF7043', fontSize: 24, fontWeight: 800 }}>
        Your Job Seeker Dashboard
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
        High-level insights at a glance. Drill into what needs attention and keep momentum.
      </p>
    </section>
  );

  const RightRail = (
    <div style={{ display: 'grid', gap: 12 }}>
      <SeekerRightColumn variant="dashboard" />
    </div>
  );

  return (
    <SeekerLayout
      title="Seeker Dashboard | ForgeTomorrow"
      header={HeaderBox}
      right={RightRail}
      activeNav="dashboard"
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {/* KPI ROW */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 12,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <h2 style={{ color: '#FF7043', margin: 0, fontSize: '1.05rem', lineHeight: 1.2 }}>
            Job Search Snapshot
          </h2>
          <div style={{ marginTop: 8 }}>
            <KpiRow
              applied={kpi.applied}
              viewed={kpi.viewed}
              interviewing={kpi.interviewing}
              offers={kpi.offers}
              rejected={kpi.rejected}
              lastApplicationSent={kpi.lastSent}
            />
          </div>
        </section>

        {/* CHARTS ROW */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0, color: '#455A64' }}>Application Funnel</h3>
            <FunnelChart
              data={{
                applied: kpi.applied,
                viewed: kpi.viewed,
                interviewing: kpi.interviewing,
                offers: kpi.offers,
                hired: kpi.hired,
              }}
            />
          </div>

          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0, color: '#455A64' }}>Applications Over Time</h3>
            <ApplicationsOverTime weeks={weeks} withChrome={withChrome} />
          </div>
        </section>

        {/* INSIGHTS (placeholders for now) */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0, color: '#455A64' }}>Response Speed</h3>
            <div style={{ color: '#607D8B' }}>Benchmarks coming soon.</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0, color: '#455A64' }}>Top Categories</h3>
            <div style={{ color: '#607D8B' }}>Distribution coming soon.</div>
          </div>
        </section>

        {/* PINNED PREVIEW */}
        <section
          style={{
            background: 'white',
            borderRadius: 12,
            padding: 16,
            border: '1px solid #eee',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ color: '#FF7043', margin: 0 }}>Pinned Jobs</h2>
            <Link href={withChrome('/pinned-jobs')} style={{ color: '#FF7043', fontWeight: 600 }}>
              View all
            </Link>
          </div>
          <PinnedJobsPreview />
        </section>
      </div>
    </SeekerLayout>
  );
}
