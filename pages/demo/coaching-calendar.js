// pages/demo/coaching-calendar.js
import React, { useState } from 'react';
import Head from 'next/head';
import CoachingLayout from '@/components/layouts/CoachingLayout';

const ORANGE = '#FF7043';
const SLATE  = '#1E293B';
const MUTED  = '#64748B';
const GAP    = 16;
const RIGHT_COL_WIDTH = 280;

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};
const WHITE_CARD = {
  background: 'rgba(255,255,255,0.92)',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 10,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};
const ORANGE_LIFT = {
  textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)',
  fontWeight: 900,
};

// Approved avatars
const AVATARS = {
  a: '/profile-avatars/avatar-professional-path.png',
  b: '/profile-avatars/avatar-tech-nexus.png',
  c: '/profile-avatars/demo-avatar.png',
};

// June 2026 starts on Monday (day index 1)
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const JUNE_START_DOW = 1; // Monday
const JUNE_DAYS = 30;

// Sessions keyed by day-of-month
const SESSIONS = {
  24: [{ name: 'Sarah',   time: '10:00 AM', type: 'Strategy',      avatar: AVATARS.a }],
  25: [{ name: 'Marcus',  time: '2:00 PM',  type: 'Resume Review', avatar: AVATARS.b },
       { name: 'Jennifer',time: '4:00 PM',  type: 'Interview Prep',avatar: AVATARS.c }],
  26: [{ name: 'David',   time: '11:00 AM', type: 'Career Planning',avatar: AVATARS.a }],
  28: [{ name: 'Sarah',   time: '10:00 AM', type: 'Follow-Up',     avatar: AVATARS.a }],
  30: [{ name: 'Jennifer',time: '3:00 PM',  type: 'Strategy',      avatar: AVATARS.c },
       { name: 'Alex',    time: '5:00 PM',  type: 'Onboarding',    avatar: AVATARS.b }],
};

const UPCOMING = [
  { name: 'Sarah Mitchell',  date: 'Tomorrow',  time: '10:00 AM', type: 'Strategy Session', duration: '60 min', avatar: AVATARS.a },
  { name: 'Marcus Thompson', date: 'Jun 27',    time: '2:00 PM',  type: 'Resume Review',    duration: '45 min', avatar: AVATARS.b },
  { name: 'Jennifer Park',   date: 'Jun 27',    time: '4:00 PM',  type: 'Interview Prep',   duration: '60 min', avatar: AVATARS.c },
  { name: 'David Chen',      date: 'Jun 28',    time: '11:00 AM', type: 'Career Planning',  duration: '60 min', avatar: AVATARS.a },
];

const THIS_WEEK = [
  ['Sessions', '5'],
  ['Hours',    '5.25'],
  ['Clients',  '4'],
  ['Avg Rating', '4.8 ⭐'],
];

function Avatar({ src, name, size = 28 }) {
  return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, display: 'block' }} />;
}

// Build calendar grid — 6 rows × 7 cols
function buildGrid() {
  const cells = [];
  for (let i = 0; i < JUNE_START_DOW; i++) cells.push(null);
  for (let d = 1; d <= JUNE_DAYS; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function DemoCoachingCalendar() {
  const [selectedDay, setSelectedDay] = useState(26); // today
  const [view, setView] = useState('Month');
  const today = 26;
  const cells = buildGrid();

  const dayLabel = selectedDay
    ? `Thursday, June ${selectedDay}, 2026`
    : null;

  return (
    <>
      <Head><title>Sessions Calendar — ForgeTomorrow Coaching</title></Head>
      <CoachingLayout
        title="Sessions Calendar | ForgeTomorrow"
        activeNav="calendar"
        contentFullBleed
        sidebarInitialOpen={{ coaching: true, seeker: false }}
      >
        <div style={{ width: '100%', paddingRight: 16, boxSizing: 'border-box' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `minmax(0,1fr) ${RIGHT_COL_WIDTH}px`,
            gridTemplateRows: 'auto auto',
            gap: GAP,
            width: '100%',
            boxSizing: 'border-box',
          }}>

            {/* Title card — col 1 row 1 */}
            <div style={{ ...GLASS, padding: '18px 24px', textAlign: 'center', gridColumn: '1/2', gridRow: '1' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GOOD MORNING</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>Sessions Calendar</div>
              <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>Your command center for coaching time — scan your schedule at a glance.</div>
            </div>

            {/* Ad — col 2 rows 1–2, no glass */}
            <aside style={{ gridColumn: '2/3', gridRow: '1/3', display: 'flex', flexDirection: 'column', padding: 0, boxSizing: 'border-box', alignSelf: 'stretch' }}>
              <div style={{ flex: 1, minHeight: 160 }}>
                <img src="/ads/house/coaching-house-ad.png" alt="Advertise with ForgeTomorrow" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14, display: 'block' }} />
              </div>
            </aside>

            {/* Calendar panel — col 1 row 2 */}
            <div style={{ gridColumn: '1/2', gridRow: '2' }}>
              <div style={{ ...GLASS, padding: 20 }}>

                {/* Calendar header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: SLATE }}>Sessions Calendar</div>
                    <div style={{ fontSize: 11, color: MUTED }}>June 2026</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16 }}>
                    <button style={{ background: 'rgba(255,112,67,0.1)', border: `1px solid ${ORANGE}`, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: ORANGE, cursor: 'pointer' }}>Today</button>
                    <button style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                    <div style={{ fontSize: 14, fontWeight: 700, color: SLATE, minWidth: 80, textAlign: 'center' }}>June 2026</div>
                    <button style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                  </div>
                  <div style={{ flex: 1 }} />
                  {/* View toggle */}
                  <div style={{ display: 'flex', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, overflow: 'hidden' }}>
                    {['Month', 'List', 'Sessions'].map(v => (
                      <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: view === v ? 'rgba(0,0,0,0.07)' : 'transparent', color: view === v ? SLATE : MUTED, borderRight: v !== 'Sessions' ? '1px solid rgba(0,0,0,0.10)' : 'none' }}>
                        {v}
                      </button>
                    ))}
                  </div>
                  <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>+ Add Session</button>
                </div>

                {/* Day headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 2 }}>
                  {DAYS.map(d => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#94A3B8', padding: '6px 0', letterSpacing: '0.04em' }}>{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
                  {cells.map((day, i) => {
                    const hasSessions = day && SESSIONS[day];
                    const isToday = day === today;
                    const isSelected = day === selectedDay;
                    return (
                      <div
                        key={i}
                        onClick={() => day && setSelectedDay(day)}
                        style={{
                          minHeight: 72,
                          borderRadius: 10,
                          padding: '6px 8px',
                          cursor: day ? 'pointer' : 'default',
                          background: isSelected ? 'rgba(255,112,67,0.08)' : 'rgba(255,255,255,0.55)',
                          border: isSelected ? `1px solid ${ORANGE}` : isToday ? `1px solid rgba(255,112,67,0.4)` : '1px solid rgba(0,0,0,0.06)',
                          position: 'relative',
                        }}
                      >
                        {day && (
                          <>
                            <div style={{ fontSize: 12, fontWeight: isToday ? 900 : 500, color: isToday ? ORANGE : SLATE, textAlign: 'right', marginBottom: 4 }}>{day}</div>
                            {hasSessions && SESSIONS[day].map((s, j) => (
                              <div key={j} style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, background: ORANGE, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                                {s.name} · {s.time}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day panel — below calendar, inside col 1 */}
              {selectedDay && (
                <div style={{ ...GLASS, padding: 16, marginTop: GAP }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: SLATE }}>{dayLabel}</div>
                    <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '5px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ Add</button>
                  </div>
                  {SESSIONS[selectedDay] ? SESSIONS[selectedDay].map((s, i) => (
                    <div key={i} style={{ ...WHITE_CARD, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <Avatar src={s.avatar} name={s.name} size={32} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: SLATE }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: MUTED }}>{s.time} · {s.type}</div>
                      </div>
                      <button style={{ fontSize: 11, padding: '5px 12px', borderRadius: 999, background: ORANGE, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Join →</button>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: '20px 0' }}>No sessions scheduled</div>
                  )}
                </div>
              )}
            </div>

            {/* Right rail row 2 — Upcoming Sessions + This Week */}
            {/* These sit below the ad naturally via row 2, col 2 */}
            <div style={{ gridColumn: '2/3', gridRow: '2', display: 'grid', gap: GAP, alignContent: 'start' }}>

              {/* Upcoming Sessions */}
              <div style={{ ...GLASS, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: SLATE }}>Upcoming Sessions</div>
                  <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '5px 12px', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>+ Schedule</button>
                </div>
                {UPCOMING.map((s, i) => (
                  <div key={i} style={{ ...WHITE_CARD, padding: '10px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar src={s.avatar} name={s.name} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: SLATE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: MUTED }}>{s.type} · {s.duration}</div>
                      <div style={{ fontSize: 10, color: ORANGE, fontWeight: 700 }}>{s.date} at {s.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* This Week */}
              <div style={{ ...GLASS, padding: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: SLATE, marginBottom: 10 }}>This Week</div>
                {THIS_WEEK.map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: 13, color: MUTED }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: SLATE }}>{val}</div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      </CoachingLayout>
    </>
  );
}