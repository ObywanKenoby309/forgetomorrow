// pages/demo/coaching-dashboard.js
import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 12 };
const ORANGE_LIFT = { textShadow: '0 2px 4px rgba(15,23,42,0.65)', fontWeight: 900 };

const CLIENTS = [
  { name: 'Sarah Mitchell', status: 'Active', next: 'Tomorrow 2:00 PM', lastContact: '2 days ago' },
  { name: 'Marcus Thompson', status: 'Active', next: 'Friday 10:00 AM', lastContact: '5 days ago' },
  { name: 'Jennifer Park', status: 'Active', next: 'Monday 3:00 PM', lastContact: '1 day ago' },
  { name: 'David Chen', status: 'Active', next: 'Next Week', lastContact: '3 days ago' },
];

const UPCOMING = [
  { name: 'Sarah Mitchell', time: 'Tomorrow 2:00 PM', type: 'Strategy', avatar: '👩' },
  { name: 'Marcus Thompson', time: 'Friday 10:00 AM', type: 'Resume Review', avatar: '🧔' },
  { name: 'Jennifer Park', time: 'Monday 3:00 PM', type: 'Interview Prep', avatar: '👩‍💼' },
];

const FOLLOW_UP_SLIDES = [
  { label: 'SESSION FOLLOW-UPS', items: [{ name: 'Marcus Thompson', detail: 'Due Jun 25' }, { name: 'David Chen', detail: 'Due Jun 26' }] },
  { label: 'OVERDUE CHECK-INS', items: [{ name: 'Alex Rivera', detail: '34 days ago' }, { name: 'Priya Nair', detail: '31 days ago' }] },
];

function FollowUpCard() {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);
  useEffect(() => {
    timerRef.current = setInterval(() => setIdx(p => (p + 1) % FOLLOW_UP_SLIDES.length), 4000);
    return () => clearInterval(timerRef.current);
  }, []);
  const slide = FOLLOW_UP_SLIDES[idx];
  return (
    <section style={{ ...GLASS, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: ORANGE, ...ORANGE_LIFT }}>Follow-Ups Due</div>
        <Link href="#" style={{ fontSize: 11, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>View all →</Link>
      </div>
      <div style={{ ...WHITE_CARD, height: 120, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{slide.label}</div>
        <div style={{ display: 'grid', gap: 6, flex: 1 }}>
          {slide.items.map((item, i) => (
            <Link key={i} href="#" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', borderRadius: 6, background: 'rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{item.name}</div>
              <div style={{ fontSize: 10, color: '#94A3B8' }}>{item.detail}</div>
            </Link>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 6 }}>{idx === 0 ? 'Sessions with follow-ups past due' : 'No contact in 30+ days'}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
        {FOLLOW_UP_SLIDES.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 999, background: i === idx ? ORANGE : 'rgba(255,112,67,0.25)', border: 'none', padding: 0, cursor: 'pointer', transition: 'width 220ms ease' }} />
        ))}
      </div>
    </section>
  );
}

export default function DemoCoachingDashboard() {
  return (
    <>
      <Head><title>Coaching Dashboard — ForgeTomorrow</title></Head>
      <CoachingLayout hideDesktopRightRail={false}>
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Title */}
          <div style={{ ...GLASS, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GOOD MORNING</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>Your Coaching Dashboard</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Track client progress, manage sessions, and review feedback — all in one place.</div>
          </div>

          {/* KPIs */}
          <div style={{ ...GLASS }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE }}>KPIs</div>
              <div style={{ fontSize: 11, color: '#94A3B8' }}>Click a card to view more</div>
              <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>Full analytics →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[['Sessions Today', '2'], ['Active Clients', '4'], ['Follow-Ups Due', '2'], ['Avg Session Rating', '4.8/5']].map(([label, val]) => (
                <div key={label} style={{ ...WHITE_CARD, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Center */}
          <div style={{ ...GLASS }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE }}>Action Center</div>
              <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>View all</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 10 }}>
              {[['New Messages', '2 unread'], ['Session Requests', '1 pending'], ['New Feedback', '3 reviews'], ['Calendar', 'Session tomorrow'], ['Client Updates', '1 new update'], ['Shared With Me', '2 documents']].map(([title, msg]) => (
                <Link key={title} href="#" style={{ textDecoration: 'none' }}>
                  <div style={{ ...WHITE_CARD, minHeight: 80, cursor: 'pointer' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A', marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 11, color: '#475569' }}>{msg}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Clients + Docs + Follow-Ups */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 240px', gap: 16 }}>
            {/* Clients */}
            <section style={{ ...GLASS }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, ...ORANGE_LIFT }}>Clients</div>
                <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>View all →</Link>
              </div>
              <div style={{ ...WHITE_CARD }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 8, marginBottom: 8, padding: '0 4px' }}>
                  {['Name', 'Status', 'Next Session'].map(h => <div key={h} style={{ fontSize: 11, fontWeight: 800, color: '#64748B' }}>{h}</div>)}
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
            <section style={{ ...GLASS }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 12, ...ORANGE_LIFT }}>Docs & Tools</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {['Templates & Guides', 'Resource Library', 'Announcements'].map(t => (
                  <div key={t} style={{ ...WHITE_CARD, textAlign: 'center', minHeight: 90, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#0F172A', marginBottom: 6 }}>{t}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>Coming soon...</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Follow-Ups */}
            <FollowUpCard />
          </div>

          {/* Upcoming Sessions */}
          <section style={{ ...GLASS }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, ...ORANGE_LIFT }}>Upcoming Sessions</div>
              <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>View all →</Link>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {UPCOMING.map((s, i) => (
                <div key={i} style={{ ...WHITE_CARD, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,112,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{s.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{s.type}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>{s.time}</div>
                  <Link href="#" style={{ fontSize: 12, color: ORANGE, fontWeight: 700, textDecoration: 'none', border: '1px solid rgba(255,112,67,0.3)', borderRadius: 999, padding: '5px 12px' }}>Join →</Link>
                </div>
              ))}
            </div>
          </section>
        </div>
      </CoachingLayout>
    </>
  );
}
