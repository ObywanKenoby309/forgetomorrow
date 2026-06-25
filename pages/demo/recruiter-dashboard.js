// pages/demo/recruiter-dashboard.js
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

const ORANGE = '#FF7043';
const GLASS = { borderRadius: 18, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.68)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' };
const WHITE_CARD = { background: 'rgba(255,255,255,0.97)', border: '1px solid rgba(255,255,255,0.60)', borderRadius: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.08)', boxSizing: 'border-box' };
const ORANGE_LIFT = { textShadow: '0 2px 4px rgba(15,23,42,0.65), 0 1px 2px rgba(0,0,0,0.4)', fontWeight: 900 };
const GAP = 16;
const RIGHT_COL_WIDTH = 280;

const KPIS = [
  { label: 'TOTAL VIEWS', value: '1,842' },
  { label: 'TOTAL APPLIES', value: '124' },
  { label: 'TIME-TO-FILL', value: '22d' },
  { label: 'VIEW→APPLY', value: '6.7%' },
];

const ACTION_TILES = [
  { title: 'Unread Replies', emptyText: null, items: ['Alexandra Chen replied to your outreach — Senior PM role', 'Marcus Johnson sent a follow-up message'], href: '#' },
  { title: 'Upcoming Interviews', emptyText: null, items: ['James Rivera — Thursday 2:00 PM (Senior PM)', 'Priya Sharma — Friday 10:00 AM (Head of Design)'], href: '#' },
  { title: 'Stalled Candidates', emptyText: 'No stalled candidates right now.', items: [], href: '#' },
  { title: 'Awaiting Feedback', emptyText: 'No hiring manager feedback pending.', items: [], href: '#' },
];

const TOP_CANDIDATES = [
  { name: 'Alexandra Chen', title: 'Senior Product Manager', match: 94 },
  { name: 'Marcus Johnson', title: 'VP of Engineering', match: 91 },
  { name: 'Priya Sharma', title: 'Head of Design', match: 88 },
  { name: 'James Rivera', title: 'Director of Sales', match: 86 },
  { name: 'Taylor Kim', title: 'Principal Data Scientist', match: 83 },
];

export default function DemoRecruiterDashboard() {
  return (
    <>
      <Head><title>Recruiter Dashboard — ForgeTomorrow</title></Head>
      <RecruiterLayout title="ForgeTomorrow — Recruiter Dashboard" activeNav="dashboard" contentFullBleed>
        <div style={{ width: '100%', padding: 0, margin: 0, paddingRight: 16, boxSizing: 'border-box' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `minmax(0,1fr) ${RIGHT_COL_WIDTH}px`, gridTemplateRows: 'auto auto auto auto', gap: GAP, width: '100%', boxSizing: 'border-box' }}>

            {/* Title Card */}
            <div style={{ ...GLASS, padding: 20, gridColumn: '1/2', gridRow: '1', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GOOD MORNING</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', ...ORANGE_LIFT }}>Recruiter Dashboard</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Your hiring pipeline at a glance.</div>
            </div>

            {/* KPIs */}
            <section style={{ ...GLASS, padding: '12px 16px 16px', gridColumn: '1/2', gridRow: '2' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: ORANGE, margin: 0, ...ORANGE_LIFT }}>KPIs</h2>
                <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>Full analytics →</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: GAP }}>
                {KPIS.map(k => (
                  <div key={k.label} style={{ ...WHITE_CARD, padding: '14px 16px', minHeight: 108, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</div>
                      <div style={{ fontSize: 28, fontWeight: 900, marginTop: 6, color: '#0F172A', letterSpacing: '-0.02em' }}>{k.value}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', textAlign: 'right', marginTop: 10 }}>View details</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Action Center */}
            <section style={{ ...GLASS, padding: 16, gridColumn: '1/2', gridRow: '3' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: ORANGE, margin: 0, ...ORANGE_LIFT }}>Action Center</h2>
                <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>View all</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: GAP }}>
                {ACTION_TILES.map(tile => (
                  <div key={tile.title} style={{ ...WHITE_CARD, padding: 16, display: 'flex', flexDirection: 'column', minHeight: 176 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', lineHeight: 1.35 }}>{tile.title}</div>
                    <div style={{ marginTop: 18, flex: 1 }}>
                      {tile.items.length === 0 ? (
                        <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55 }}>{tile.emptyText}</div>
                      ) : (
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.55 }}>{tile.items[0]}</div>
                      )}
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                      <a href={tile.href} style={{ fontSize: 13, fontWeight: 700, color: '#334155', textDecoration: 'none', border: '1px solid rgba(0,0,0,0.10)', borderRadius: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.86)' }}>View More</a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Right rail — Ad placeholder + Health Snapshot */}
            <aside style={{ gridColumn: '2/3', gridRow: '1/3', display: 'flex', flexDirection: 'column', gap: GAP, width: RIGHT_COL_WIDTH, boxSizing: 'border-box' }}>
              {/* Right rail — House Ad */}
              <div style={{ borderRadius: 18, overflow: 'hidden', boxShadow: '0 10px 28px rgba(15,23,42,0.12)' }}>
                <img
                  src="/ads/house/recruiter-house-ad.png"
                  alt="Advertise with ForgeTomorrow"
                  style={{ width: '100%', display: 'block', borderRadius: 18 }}
                />
              </div>
            </aside>

            {/* Health Snapshot — right col row 3 */}
            <div style={{ ...GLASS, padding: 16, gridColumn: '2/3', gridRow: '3', boxSizing: 'border-box' }}>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8, color: '#0F172A', lineHeight: 1.25 }}>Health Snapshot</div>
              <div style={{ ...WHITE_CARD, padding: 14, fontSize: 13, color: '#334155', display: 'grid', gap: 8, lineHeight: 1.55 }}>
                {[['Time-to-Hire', '22 days'], ['Top Apply Source', 'Forge (68%)'], ['Conversion (View→Apply)', '6.7%']].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#607D8B' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#112033' }}>{val}</span>
                  </div>
                ))}
                <div style={{ paddingTop: 2, fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>Open Analytics for breakdowns by range, role, recruiter, and funnel stage.</div>
                <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>Open Analytics</Link>
              </div>
            </div>

            {/* Bottom bleed row */}
            <div style={{ gridColumn: '1/-1', gridRow: '4', display: 'grid', gridTemplateColumns: 'minmax(0,5fr) minmax(0,5fr) minmax(0,3fr)', gap: GAP, marginLeft: -252, boxSizing: 'border-box' }}>

              {/* Top Candidate Recommendations */}
              <section style={{ ...GLASS, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: ORANGE, margin: 0, lineHeight: 1.25, ...ORANGE_LIFT }}>Top Candidate Recommendations</h2>
                  <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>View all</Link>
                </div>
                <div style={{ ...WHITE_CARD, padding: 14 }}>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {TOP_CANDIDATES.map(c => (
                      <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#112033', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#607D8B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{c.title}</div>
                        </div>
                        <div style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, color: ORANGE, background: 'rgba(255,112,67,0.10)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(255,112,67,0.20)' }}>{c.match}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Pipeline Health */}
              <section style={{ ...GLASS, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: ORANGE, margin: 0, lineHeight: 1.25, ...ORANGE_LIFT }}>Pipeline Health</h2>
                  <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>Open pipeline</Link>
                </div>
                <div style={{ ...WHITE_CARD, padding: 14, fontSize: 13, color: '#334155', display: 'grid', gap: 8, lineHeight: 1.55 }}>
                  {[['New applicants needing review', '24'], ['Candidates stuck in stage', '3'], ['Interviews scheduled this week', '5'], ['Offers pending response', '2']].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 999, background: ORANGE, flexShrink: 0 }} />
                        <span>{label}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#112033' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Trends */}
              <section style={{ ...GLASS, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: ORANGE, margin: 0, lineHeight: 1.25, ...ORANGE_LIFT }}>Trends</h3>
                  <Link href="#" style={{ color: ORANGE, fontWeight: 800, fontSize: 13, textDecoration: 'none', ...ORANGE_LIFT }}>View charts</Link>
                </div>
                <div style={{ ...WHITE_CARD, padding: 14, fontSize: 13, color: '#334155', display: 'grid', gap: 8, lineHeight: 1.55 }}>
                  {[['Views vs Applies', '+14% this week'], ['Time-to-fill', '22d avg (↓3d)'], ['Funnel drop-off', 'Screen → Interview: 54%'], ['Period vs prior', '+22% applications']].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: 999, background: '#1A4B8F', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', paddingLeft: 12, marginTop: 2 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

          </div>
        </div>
      </RecruiterLayout>
    </>
  );
}