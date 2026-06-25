// pages/demo/coaching-dashboard.js
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';

// ─── Shared styles ────────────────────────────────────────────────────────────
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

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_KPIS = [
  { label: 'SESSIONS TODAY',    value: '2'   },
  { label: 'ACTIVE CLIENTS',    value: '4'   },
  { label: 'FOLLOW-UPS DUE',    value: '2'   },
  { label: 'AVG SESSION RATING', value: '4.8/5' },
];

const ACTION_TILES = [
  { title: 'New Messages',     msg: '2 unread'         },
  { title: 'Session Requests', msg: '1 pending'        },
  { title: 'New Feedback',     msg: '3 reviews'        },
  { title: 'Calendar',         msg: 'Session tomorrow' },
  { title: 'Client Updates',   msg: '1 new update'     },
  { title: 'Shared With Me',   msg: '2 documents'      },
];

const CLIENTS = [
  { name: 'Sarah Mitchell',  status: 'Active', next: 'Tomorrow 2:00 PM' },
  { name: 'Marcus Thompson', status: 'Active', next: 'Friday 10:00 AM'  },
  { name: 'Jennifer Park',   status: 'Active', next: 'Monday 3:00 PM'   },
  { name: 'David Chen',      status: 'Active', next: 'Next Week'         },
];

const UPCOMING = [
  { name: 'Sarah Mitchell',  time: 'Tomorrow 2:00 PM',  type: 'Strategy',       avatar: '/profile-avatars/avatar-professional-path.png' },
  { name: 'Marcus Thompson', time: 'Friday 10:00 AM',   type: 'Resume Review',  avatar: '/profile-avatars/avatar-tech-nexus.png'         },
  { name: 'Jennifer Park',   time: 'Monday 3:00 PM',    type: 'Interview Prep', avatar: '/profile-avatars/demo-avatar.png'               },
];

const FOLLOW_UP_SLIDES = [
  { label: 'SESSION FOLLOW-UPS', subtext: 'Sessions with follow-ups past due',  items: [{ name: 'Marcus Thompson', detail: 'Due Jun 25' }, { name: 'David Chen', detail: 'Due Jun 26' }] },
  { label: 'OVERDUE CHECK-INS',  subtext: 'No contact in 30+ days',              items: [{ name: 'Alex Rivera', detail: '34 days ago' }, { name: 'Priya Nair', detail: '31 days ago' }] },
];

// ─── Follow-Up carousel ───────────────────────────────────────────────────────
function FollowUpCard() {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setIdx(p => (p + 1) % FOLLOW_UP_SLIDES.length), 4000);
    return () => clearInterval(timerRef.current);
  }, []);
  const slide = FOLLOW_UP_SLIDES[idx];
  return (
    <section style={{ ...GLASS, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: ORANGE, ...ORANGE_LIFT }}>Follow-Ups Due</div>
        <Link href="#" style={{ fontSize: 11, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>View all →</Link>
      </div>
      <div style={{ ...WHITE_CARD, padding: 10, height: 120, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{slide.label}</div>
        <div style={{ display: 'grid', gap: 6, flex: 1 }}>
          {slide.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{item.name}</div>
              <div style={{ fontSize: 10, color: '#94A3B8' }}>{item.detail}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 6 }}>{slide.subtext}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
        {FOLLOW_UP_SLIDES.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 999, background: i === idx ? ORANGE : 'rgba(255,112,67,0.25)', border: 'none', padding: 0, cursor: 'pointer', transition: 'width 220ms ease' }} />
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DemoCoachingDashboard() {
  return (
    <>
      <Head><title>Coaching Dashboard — ForgeTomorrow</title></Head>
      <CoachingLayout activeNav="dashboard" contentFullBleed>
        <div style={{ padding: 0, margin: 0, width: '100%' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `minmax(0, 1fr) ${RIGHT_COL_WIDTH}px`,
            gridTemplateRows: 'auto auto auto auto',
            gap: GAP,
            width: '100%',
          }}>

            {/* ROW 1, COL 1: Title card */}
            <div style={{ ...GLASS, padding: '18px 24px', textAlign: 'center', gridColumn: '1 / 2', gridRow: '1' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GOOD MORNING</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>Your Coaching Dashboard</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Track client progress, manage sessions, and review feedback — all in one place.</div>
            </div>

            {/* ROW 2, COL 1: KPIs */}
            <section style={{ ...GLASS, padding: '12px 16px 14px 16px', gridColumn: '1 / 2', gridRow: '2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 18, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>KPIs</h2>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>Click a card to view more</span>
                <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>Full analytics →</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                {DEMO_KPIS.map(({ label, value }) => (
                  <div key={label} style={{ ...WHITE_CARD, padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{value}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* COL 2, ROWS 1–2: Ad — no glass backing */}
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
                  src="/ads/house/coaching-house-ad.png"
                  alt="Advertise with ForgeTomorrow"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14, display: 'block' }}
                />
              </div>
            </aside>

            {/* ROW 3, COL 1: Action Center */}
            <section style={{ ...GLASS, padding: 20, gridColumn: '1 / 2', gridRow: '3' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>Action Center</h2>
                <span style={{ fontSize: 13, color: '#94A3B8' }}>Click a card to open</span>
                <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>View all</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 10 }}>
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

            {/* COL 2, ROW 3: Upcoming Sessions (compact) */}
            <aside style={{
              ...KPI_GLASS,
              gridColumn: '2 / 3',
              gridRow: '3',
              padding: 14,
              boxSizing: 'border-box',
              alignSelf: 'stretch',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: ORANGE, ...ORANGE_LIFT }}>Upcoming Sessions</div>
                <Link href="#" style={{ fontSize: 11, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>View all</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                {UPCOMING.map((s, i) => (
                  <div key={i} style={{ ...WHITE_CARD, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={s.avatar} alt={s.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>{s.type}</div>
                    </div>
                    <Link href="#" style={{ fontSize: 11, color: ORANGE, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,112,67,0.3)', borderRadius: 999, padding: '3px 8px', flexShrink: 0 }}>Join →</Link>
                  </div>
                ))}
              </div>
            </aside>

            {/* ROW 4: Clients | Docs & Tools | Follow-Ups — bleed left */}
            <div style={{
              gridColumn: '1 / -1',
              gridRow: '4',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 4fr) minmax(0, 3fr)',
              gap: GAP,
              marginLeft: -252,
              position: 'relative',
              zIndex: 11,
            }}>

              {/* Clients */}
              <section style={{ ...GLASS, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 18, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, ...ORANGE_LIFT }}>Clients</h2>
                  <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>View all →</Link>
                </div>
                <div style={{ ...WHITE_CARD, padding: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 8, marginBottom: 8, padding: '0 4px' }}>
                    {['Name', 'Status', 'Next Session'].map(h => (
                      <div key={h} style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{h}</div>
                    ))}
                  </div>
                  {CLIENTS.map((c, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 8, padding: '8px 4px', borderTop: '1px solid rgba(0,0,0,0.05)', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, background: 'rgba(22,163,74,0.1)', borderRadius: 999, padding: '2px 8px', textAlign: 'center' }}>{c.status}</div>
                      <div style={{ fontSize: 11, color: '#475569' }}>{c.next}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Docs & Tools */}
              <section style={{ ...GLASS, padding: 16 }}>
                <h2 style={{ fontSize: 18, color: ORANGE, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, marginBottom: 12, ...ORANGE_LIFT }}>Docs & Tools</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {['Templates & Guides', 'Resource Library', 'Announcements'].map(t => (
                    <div key={t} style={{ ...WHITE_CARD, padding: 12, textAlign: 'center', minHeight: 90, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A', marginBottom: 6 }}>{t}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>Coming soon...</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Follow-Ups */}
              <FollowUpCard />

            </div>

          </div>
        </div>
      </CoachingLayout>
    </>
  );
}