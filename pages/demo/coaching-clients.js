// pages/demo/coaching-clients.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CoachingLayout from '@/components/layouts/CoachingLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 12 };

const CLIENTS = [
  { name: 'Sarah Mitchell', email: 'sarah.m@email.com', goal: 'Land a Senior PM role at a Series B startup', status: 'Active', sessions: 8, nextSession: 'Tomorrow 2:00 PM', lastContact: '2 days ago', rating: 4.9, avatar: '👩', progress: 78 },
  { name: 'Marcus Thompson', email: 'marcus.t@email.com', goal: 'Negotiate 40% raise and get promoted to Staff Engineer', status: 'Active', sessions: 5, nextSession: 'Friday 10:00 AM', lastContact: '5 days ago', rating: 4.7, avatar: '🧔', progress: 55 },
  { name: 'Jennifer Park', email: 'jen.park@email.com', goal: 'Transition from Marketing to Product Management', status: 'Active', sessions: 12, nextSession: 'Monday 3:00 PM', lastContact: '1 day ago', rating: 5.0, avatar: '👩‍💼', progress: 92 },
  { name: 'David Chen', email: 'david.c@email.com', goal: 'Build executive presence for C-suite transition', status: 'Active', sessions: 3, nextSession: 'Next Week', lastContact: '3 days ago', rating: 4.8, avatar: '🧑‍💼', progress: 34 },
  { name: 'Alex Rivera', email: 'alex.r@email.com', goal: 'Reenter workforce after 2-year career break', status: 'Inactive', sessions: 6, nextSession: '—', lastContact: '34 days ago', rating: 4.6, avatar: '🧑', progress: 61 },
];

export default function DemoCoachingClients() {
  const [selected, setSelected] = useState(CLIENTS[0]);

  return (
    <>
      <Head><title>Clients — ForgeTomorrow Coaching</title></Head>
      <CoachingLayout>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...GLASS, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE, fontStyle: 'italic' }}>Client Hub</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Manage your clients, track progress, and keep every relationship moving forward.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
            {/* Client list */}
            <div style={{ ...GLASS, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A' }}>All Clients ({CLIENTS.length})</div>
                <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '6px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>+ Add Client</button>
              </div>
              <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 80px 120px 80px', gap: 12 }}>
                {['Client', 'Progress', 'Next Session', 'Rating'].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>)}
              </div>
              {CLIENTS.map((c, i) => (
                <div key={i} onClick={() => setSelected(c)}
                  style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'grid', gridTemplateColumns: '1fr 80px 120px 80px', gap: 12, alignItems: 'center', cursor: 'pointer', background: selected.name === c.name ? 'rgba(255,112,67,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)', borderLeft: selected.name === c.name ? `3px solid ${ORANGE}` : '3px solid transparent' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,112,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{c.sessions} sessions · {c.status}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE, marginBottom: 3 }}>{c.progress}%</div>
                    <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 999 }}>
                      <div style={{ height: '100%', width: `${c.progress}%`, background: ORANGE, borderRadius: 999 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#475569' }}>{c.nextSession}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#D97706' }}>⭐ {c.rating}</div>
                </div>
              ))}
            </div>

            {/* Client detail */}
            <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
              <div style={{ ...GLASS }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,112,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{selected.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A' }}>{selected.name}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{selected.email}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: selected.status === 'Active' ? 'rgba(22,163,74,0.1)' : 'rgba(100,116,139,0.1)', color: selected.status === 'Active' ? '#16A34A' : '#64748B' }}>{selected.status}</span>
                  </div>
                </div>

                <div style={{ ...WHITE_CARD, marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Coaching Goal</div>
                  <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{selected.goal}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                  {[['Sessions', selected.sessions], ['Rating', `⭐ ${selected.rating}`], ['Progress', `${selected.progress}%`]].map(([label, val]) => (
                    <div key={label} style={{ ...WHITE_CARD, textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '10px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Schedule Session</button>
                  <button style={{ background: 'none', color: ORANGE, border: `1px solid ${ORANGE}`, borderRadius: 999, padding: '10px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Send Message</button>
                  <button style={{ background: 'none', color: '#64748B', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>View Full Profile</button>
                </div>
              </div>

              <div style={{ ...GLASS }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A', marginBottom: 10 }}>Next Session</div>
                <div style={{ ...WHITE_CARD }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{selected.nextSession}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Last contact: {selected.lastContact}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CoachingLayout>
    </>
  );
}
