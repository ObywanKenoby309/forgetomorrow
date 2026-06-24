// pages/demo/coaching-calendar.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 12 };

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SESSIONS = {
  24: [{ name: 'Sarah Mitchell', time: '10:00 AM', type: 'Strategy', avatar: '👩' }],
  25: [{ name: 'Marcus Thompson', time: '2:00 PM', type: 'Resume Review', avatar: '🧔' }, { name: 'Jennifer Park', time: '4:00 PM', type: 'Interview Prep', avatar: '👩‍💼' }],
  26: [{ name: 'David Chen', time: '11:00 AM', type: 'Career Planning', avatar: '🧑‍💼' }],
  28: [{ name: 'Sarah Mitchell', time: '10:00 AM', type: 'Follow-Up', avatar: '👩' }],
  30: [{ name: 'Jennifer Park', time: '3:00 PM', type: 'Strategy', avatar: '👩‍💼' }, { name: 'Alex Rivera', time: '5:00 PM', type: 'Onboarding', avatar: '🧑' }],
};

const UPCOMING = [
  { name: 'Sarah Mitchell', date: 'Tomorrow', time: '10:00 AM', type: 'Strategy Session', avatar: '👩', duration: '60 min' },
  { name: 'Marcus Thompson', date: 'Jun 27', time: '2:00 PM', type: 'Resume Review', avatar: '🧔', duration: '45 min' },
  { name: 'Jennifer Park', date: 'Jun 27', time: '4:00 PM', type: 'Interview Prep', avatar: '👩‍💼', duration: '60 min' },
  { name: 'David Chen', date: 'Jun 28', time: '11:00 AM', type: 'Career Planning', avatar: '🧑‍💼', duration: '60 min' },
];

export default function DemoCoachingCalendar() {
  const [selectedDay, setSelectedDay] = useState(25);
  const today = 25;

  const calDays = Array.from({ length: 35 }, (_, i) => {
    const d = i - 2;
    return d > 0 && d <= 30 ? d : null;
  });

  return (
    <>
      <Head><title>Calendar — ForgeTomorrow Coaching</title></Head>
      <CoachingLayout>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...GLASS, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE, fontStyle: 'italic' }}>Sessions Calendar</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Manage your coaching schedule, sessions, and client availability.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
            {/* Calendar */}
            <div style={{ ...GLASS }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#0F172A' }}>June 2026</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>← Prev</button>
                  <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Today</button>
                  <button style={{ background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>Next →</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#94A3B8', padding: '4px 0' }}>{d}</div>)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                {calDays.map((day, i) => {
                  const hasSessions = day && SESSIONS[day];
                  const isToday = day === today;
                  const isSelected = day === selectedDay;
                  return (
                    <div key={i} onClick={() => day && setSelectedDay(day)}
                      style={{ minHeight: 64, borderRadius: 10, padding: '6px 8px', cursor: day ? 'pointer' : 'default', background: isSelected ? 'rgba(255,112,67,0.1)' : isToday ? 'rgba(255,112,67,0.05)' : 'rgba(255,255,255,0.5)', border: isSelected ? `2px solid ${ORANGE}` : isToday ? `1px solid ${ORANGE}` : '1px solid rgba(0,0,0,0.06)' }}>
                      {day && (
                        <>
                          <div style={{ fontSize: 13, fontWeight: isToday ? 900 : 600, color: isToday ? ORANGE : '#0F172A' }}>{day}</div>
                          {hasSessions && SESSIONS[day].map((s, j) => (
                            <div key={j} style={{ fontSize: 9, fontWeight: 700, padding: '2px 4px', borderRadius: 4, background: ORANGE, color: '#fff', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name.split(' ')[0]}</div>
                          ))}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Day detail */}
              {selectedDay && (
                <div style={{ marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 10 }}>June {selectedDay} — {SESSIONS[selectedDay]?.length || 0} sessions</div>
                  {SESSIONS[selectedDay] ? SESSIONS[selectedDay].map((s, i) => (
                    <div key={i} style={{ ...WHITE_CARD, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,112,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{s.avatar}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{s.time} · {s.type}</div>
                      </div>
                      <button style={{ fontSize: 11, padding: '5px 12px', borderRadius: 999, background: ORANGE, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Join →</button>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: '20px 0' }}>No sessions scheduled</div>
                  )}
                </div>
              )}
            </div>

            {/* Right panel */}
            <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
              <div style={{ ...GLASS }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>Upcoming Sessions</div>
                  <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '6px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ Schedule</button>
                </div>
                {UPCOMING.map((s, i) => (
                  <div key={i} style={{ ...WHITE_CARD, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,112,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.avatar}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{s.type} · {s.duration}</div>
                        <div style={{ fontSize: 11, color: ORANGE, fontWeight: 600 }}>{s.date} at {s.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...GLASS }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', marginBottom: 10 }}>This Week</div>
                {[['Sessions', '5'], ['Hours', '5.25'], ['Clients', '4'], ['Avg Rating', '4.8 ⭐']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ fontSize: 13, color: '#64748B' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{val}</div>
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
