// pages/demo/seeker-dashboard.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

// ─── Shared styles (mirrors real seeker-dashboard.js) ────────────────────────
const ORANGE = '#FF7043';
const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
const KPI_GLASS = {
  ...GLASS,
  background: 'rgba(255,255,255,0.68)',
  boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
};
const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 12,
  boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
  boxSizing: 'border-box',
};
const ORANGE_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};
const GAP = 16;
const RIGHT_COL_WIDTH = 280;

// ─── KPI color map (mirrors seekerColors.js colorFor()) ──────────────────────
const KPI_COLORS = {
  pinned:       { bg: 'rgba(255,255,255,0.92)', border: 'rgba(0,0,0,0.08)',   label: '#64748B', value: '#0F172A' },
  applied:      { bg: 'rgba(37,99,235,0.07)',   border: 'rgba(37,99,235,0.2)', label: '#2563EB', value: '#1D4ED8' },
  interviewing: { bg: 'rgba(13,148,136,0.07)',  border: 'rgba(13,148,136,0.2)',label: '#0D9488', value: '#0F766E' },
  offers:       { bg: 'rgba(126,34,206,0.07)',  border: 'rgba(126,34,206,0.2)',label: '#7C3AED', value: '#6D28D9' },
  closedOut:    { bg: 'rgba(255,255,255,0.92)', border: 'rgba(0,0,0,0.08)',   label: '#64748B', value: '#0F172A' },
};

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_KPIS = [
  { key: 'pinned',       label: 'Pinned',       value: 3  },
  { key: 'applied',      label: 'Applied',      value: 7  },
  { key: 'interviewing', label: 'Interviewing', value: 2  },
  { key: 'offers',       label: 'Offers',       value: 1  },
  { key: 'closedOut',    label: 'Closed Out',   value: 4  },
];

const DEMO_STRENGTH = [
  { label: 'Professional Signal', value: 'Strong',    color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)'  },
  { label: 'Execution Visibility', value: 'Strong',   color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)'  },
  { label: 'Validation Risk',      value: 'Low',      color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)'  },
  { label: 'Portfolio Depth',      value: 'Strong',   color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)'  },
  { label: 'Resume Access',        value: 'Available',color: '#16A34A', bg: 'rgba(22,163,74,0.08)',  border: 'rgba(22,163,74,0.2)'  },
];

const ACTION_TILES = [
  { title: 'New Messages',        msg: '3 unread from recruiters' },
  { title: 'Job Updates',         msg: '5 new matches today'      },
  { title: 'Applications',        msg: 'Interview request pending' },
  { title: 'Calendar',            msg: 'Session tomorrow at 2pm'  },
  { title: 'Shared With Me',      msg: '2 documents shared'       },
];

const NEW_MATCHES = [
  { title: 'Senior Product Manager', location: 'Remote · US',        salary: '$165K–$210K', match: 94, matchLabel: 'Strong Match' },
  { title: 'VP of Product',          location: 'Hybrid · West Coast', salary: '$240K–$300K', match: 91, matchLabel: 'Strong Match' },
  { title: 'Principal PM',           location: 'Remote · US',        salary: '$185K–$250K', match: 78, matchLabel: 'Good Match'   },
  { title: 'Director of Product',    location: 'Hybrid · East Coast', salary: '$175K–$230K', match: 78, matchLabel: 'Good Match'   },
];

const NEXT_YES = [
  { title: 'Technical Account Manager',             company: 'Acme Co.',          location: 'Remote',         pinned: 'Pinned 6/20/2026' },
  { title: 'Director of Professional Button Pushing', company: 'Button Pushers Co.', location: 'Somewhere, USA', pinned: 'Pinned 6/23/2026' },
];

const APP_WEEKS = [
  { week: 'W1', applied: 4, interviews: 0 },
  { week: 'W2', applied: 7, interviews: 1 },
  { week: 'W3', applied: 5, interviews: 2 },
  { week: 'W4', applied: 9, interviews: 2 },
  { week: 'W5', applied: 6, interviews: 3 },
];

const ENGAGEMENT = [
  { label: 'Profile Views', value: 847,   unit: '7 days', color: ORANGE },
  { label: 'Search Hits',   value: 124,   unit: '7 days', color: '#2563EB' },
  { label: 'Completion',    value: '100%', unit: 'profile', color: '#16A34A' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DemoSeekerDashboard() {
  return (
    <>
      <Head><title>Seeker Dashboard — ForgeTomorrow</title></Head>
      <SeekerLayout activeNav="dashboard" contentFullBleed>
        <div style={{ padding: 0, margin: 0, width: '100%' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `minmax(0, 1fr) ${RIGHT_COL_WIDTH}px`,
            gridTemplateRows: 'auto auto auto auto',
            gap: GAP,
            width: '100%',
          }}>

            {/* ROW 1, COL 1: Title card */}
            <div style={{
              ...GLASS,
              padding: '18px 24px',
              textAlign: 'center',
              gridColumn: '1 / 2',
              gridRow: '1',
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                GOOD MORNING
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>
                Your Job Seeker Dashboard
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                You're not alone. Track your momentum, see your wins, and keep moving forward.
              </div>
            </div>

            {/* ROW 2, COL 1: KPIs + Profile Strength */}
            <section style={{ ...GLASS, padding: '12px 16px 14px 16px', gridColumn: '1 / 2', gridRow: '2' }}>

              {/* KPI header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 18, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>
                  KPIs
                </h2>
                <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>
                  Full history →
                </Link>
              </div>

              {/* KPI cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
                {DEMO_KPIS.map(({ key, label, value }) => {
                  const c = KPI_COLORS[key];
                  return (
                    <div key={key} style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                      padding: '10px 12px',
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 11, color: c.label, fontWeight: 600, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: c.value }}>{value}</div>
                    </div>
                  );
                })}
              </div>

              {/* Profile Strength header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2 style={{ fontSize: 16, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>
                  Profile Strength
                </h2>
                <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>
                  Full read →
                </Link>
              </div>

              {/* Profile Strength cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
                {DEMO_STRENGTH.map(s => (
                  <div key={s.label} style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 12,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    padding: '10px 12px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 10, color: s.color, fontWeight: 800, marginBottom: 4 }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* COL 2, ROWS 1–2: Ad — no glass backing, renders on wallpaper */}
            <aside style={{
              gridColumn: '2 / 3',
              gridRow: '1 / 3',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              boxSizing: 'border-box',
              alignSelf: 'stretch',
            }}>
              <div style={{ flex: 1, minHeight: 160 }}>
                <img
                  src="/ads/house/seeker-house-ad.png"
                  alt="Advertise with ForgeTomorrow"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14, display: 'block' }}
                />
              </div>
            </aside>

            {/* ROW 3, COL 1: Action Center */}
            <section className="rounded-xl p-5" style={{ ...GLASS, gridColumn: '1 / 2', gridRow: '3' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>
                  Action Center
                </h2>
                <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {ACTION_TILES.map(t => (
                  <Link key={t.title} href="#" style={{ textDecoration: 'none' }}>
                    <div style={{ ...GLASS, padding: 12, minHeight: 80, cursor: 'pointer', borderRadius: 14 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A', lineHeight: '20px' }}>{t.title}</div>
                      <div style={{ marginTop: 8, fontSize: 12, color: '#475569', lineHeight: '20px' }}>{t.msg}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* COL 2, ROW 3: Engagement widget */}
            <aside style={{
              ...KPI_GLASS,
              gridColumn: '2 / 3',
              gridRow: '3',
              padding: 10,
              boxSizing: 'border-box',
              alignSelf: 'start',
              height: 150,
              maxHeight: 150,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', flexShrink: 0, ...ORANGE_LIFT }}>
                Engagement
              </div>
              <div style={{ ...WHITE_CARD, padding: 8, flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, textAlign: 'center' }}>
                  {ENGAGEMENT.map(e => (
                    <div key={e.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: e.color, lineHeight: 1 }}>{e.value}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1.2 }}>{e.label}</div>
                      <div style={{ fontSize: 9, color: '#94A3B8' }}>{e.unit}</div>
                    </div>
                  ))}
                </div>
                <Link href="#" style={{ display: 'block', textAlign: 'center', fontSize: 11, fontWeight: 700, color: ORANGE, textDecoration: 'none', marginTop: 8 }}>
                  View analytics →
                </Link>
              </div>
            </aside>

            {/* ROW 4: Bottom 3 cards — bleed left under sidebar */}
            <div style={{
              gridColumn: '1 / -1',
              gridRow: '4',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 5fr) minmax(0, 3fr)',
              gap: GAP,
              marginLeft: -252,
              position: 'relative',
              zIndex: 11,
            }}>

              {/* New Matches */}
              <section style={{ ...GLASS, padding: 16 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ fontSize: 18, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>
                    New Matches
                  </h2>
                  <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>
                    View all
                  </Link>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {NEW_MATCHES.map((job, i) => (
                    <div key={i} style={{ ...WHITE_CARD, padding: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', lineHeight: 1.3, flex: 1 }}>{job.title}</div>
                        <div style={{
                          flexShrink: 0, textAlign: 'center',
                          background: job.match >= 90 ? 'rgba(255,112,67,0.1)' : 'rgba(217,119,6,0.08)',
                          borderRadius: 8, padding: '4px 6px',
                          border: `1px solid ${job.match >= 90 ? ORANGE : '#D97706'}33`,
                        }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: job.match >= 90 ? ORANGE : '#D97706' }}>{job.match}%</div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: job.match >= 90 ? ORANGE : '#D97706' }}>{job.matchLabel}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>{job.location} · {job.salary}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Your Next Yes */}
              <section style={{ ...GLASS, padding: 16 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 style={{ fontSize: 18, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>
                    Your Next Yes
                  </h2>
                  <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>
                    View all
                  </Link>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {NEXT_YES.map((job, i) => (
                    <div key={i} style={{ ...WHITE_CARD, padding: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>{job.company}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>{job.location}</div>
                      <div style={{ fontSize: 11, color: ORANGE, fontWeight: 700 }}>📌 {job.pinned}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Applications Over Time */}
              <section style={{ ...GLASS, padding: 16 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 style={{ fontSize: 16, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>
                    Applications Over Time
                  </h3>
                  <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>
                    View all
                  </Link>
                </div>
                <div style={{ ...WHITE_CARD, padding: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>WEEK</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em' }}>APPLIED</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.06em' }}>INTERVIEWS</div>
                  </div>
                  {APP_WEEKS.map((row, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr', gap: 8, padding: '6px 0', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{row.week}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: row.applied > 0 ? '#2563EB' : '#94A3B8' }}>{row.applied}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: row.interviews > 0 ? '#16A34A' : '#94A3B8' }}>{row.interviews}</div>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>
        </div>
      </SeekerLayout>
    </>
  );
}