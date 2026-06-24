// pages/demo/recruiter-candidate-center.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 12 };

const CANDIDATES = [
  { name: 'Alexandra Chen', title: 'Senior Product Manager', location: 'San Francisco, CA', why: 94, stage: 'Interviewing', tags: ['Product', 'B2B', 'SaaS'], avatar: '👩‍💼' },
  { name: 'Marcus Johnson', title: 'VP of Engineering', location: 'Remote', why: 91, stage: 'Applied', tags: ['Engineering', 'Leadership', 'Scale'], avatar: '🧑‍💻' },
  { name: 'Priya Sharma', title: 'Head of Design', location: 'New York, NY', why: 88, stage: 'Screening', tags: ['Design', 'UX', 'Systems'], avatar: '👩‍🎨' },
  { name: 'James Rivera', title: 'Director of Sales', location: 'Austin, TX', why: 86, stage: 'Applied', tags: ['Sales', 'Enterprise', 'SaaS'], avatar: '🧑‍💼' },
  { name: 'Taylor Kim', title: 'Data Scientist', location: 'Remote', why: 83, stage: 'Sourced', tags: ['ML', 'Python', 'Analytics'], avatar: '🧑‍🔬' },
  { name: 'Jordan Williams', title: 'Product Designer', location: 'Seattle, WA', why: 79, stage: 'Sourced', tags: ['Figma', 'UX', 'Mobile'], avatar: '🧑‍🎨' },
];

const STAGE_COLORS = { Interviewing: '#16A34A', Applied: '#2563EB', Screening: '#D97706', Sourced: '#7C3AED' };

export default function DemoRecruiterCandidateCenter() {
  const [selected, setSelected] = useState(CANDIDATES[0]);

  return (
    <>
      <Head><title>Candidate Center — ForgeTomorrow</title></Head>
      <RecruiterLayout>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...GLASS, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE, fontStyle: 'italic' }}>Candidate Center</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Review, score, and engage top talent — all in one place.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
            {/* Candidate list */}
            <div style={{ ...GLASS, padding: 0, overflow: 'hidden' }}>
              {/* Filter bar */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 10, alignItems: 'center' }}>
                <input placeholder="Search candidates..." style={{ flex: 1, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '8px 14px', fontSize: 13, outline: 'none' }} />
                <select style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}>
                  <option>All Roles</option>
                  <option>Senior PM — ForgeTomorrow</option>
                  <option>VP Engineering — Demo Co</option>
                </select>
                <select style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }}>
                  <option>All Stages</option>
                  <option>Sourced</option>
                  <option>Applied</option>
                  <option>Screening</option>
                  <option>Interviewing</option>
                </select>
              </div>

              {/* Column headers */}
              <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'grid', gridTemplateColumns: '1fr 80px 120px 100px', gap: 12 }}>
                {['Candidate', 'WHY', 'Stage', 'Actions'].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>)}
              </div>

              {/* Rows */}
              {CANDIDATES.map((c, i) => (
                <div key={i} onClick={() => setSelected(c)}
                  style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'grid', gridTemplateColumns: '1fr 80px 120px 100px', gap: 12, alignItems: 'center', cursor: 'pointer', background: selected.name === c.name ? 'rgba(255,112,67,0.06)' : i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,112,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.avatar}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{c.title} · {c.location}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: c.why >= 90 ? '#16A34A' : c.why >= 80 ? '#D97706' : '#64748B' }}>{c.why}</div>
                    <div style={{ fontSize: 10, color: '#94A3B8' }}>/100</div>
                  </div>
                  <div><span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${STAGE_COLORS[c.stage]}18`, color: STAGE_COLORS[c.stage] }}>{c.stage}</span></div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: `1px solid ${ORANGE}`, color: ORANGE, background: 'none', cursor: 'pointer', fontWeight: 700 }}>Message</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Candidate detail */}
            <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
              <div style={{ ...GLASS }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,112,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{selected.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A' }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{selected.title}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{selected.location}</div>
                  </div>
                </div>

                <div style={{ ...WHITE_CARD, marginBottom: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>WHY Score</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: selected.why >= 90 ? '#16A34A' : '#D97706' }}>{selected.why}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>out of 100</div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {selected.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,112,67,0.1)', color: ORANGE }}>{tag}</span>
                  ))}
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '10px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Send Message</button>
                  <button style={{ background: 'none', color: ORANGE, border: `1px solid ${ORANGE}`, borderRadius: 999, padding: '10px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>View Full Profile</button>
                  <button style={{ background: 'none', color: '#64748B', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Why This Candidate →</button>
                </div>
              </div>

              <div style={{ ...GLASS }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#0F172A', marginBottom: 10 }}>Explainability</div>
                {[['Role Alignment', 94], ['Skills Match', 88], ['Experience Depth', 91], ['Cultural Signals', 82]].map(([label, score]) => (
                  <div key={label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div style={{ fontSize: 12, color: '#334155' }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE }}>{score}%</div>
                    </div>
                    <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 999 }}>
                      <div style={{ height: '100%', width: `${score}%`, background: ORANGE, borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </RecruiterLayout>
    </>
  );
}
