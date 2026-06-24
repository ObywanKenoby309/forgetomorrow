// pages/demo/recruiter-search.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };

const RESULTS = [
  { name: 'Alexandra Chen', title: 'Senior Product Manager', location: 'San Francisco, CA', why: 96, skills: ['Product Strategy', 'B2B SaaS', 'AI/ML'], avatar: '👩‍💼', exp: '8 years', open: true },
  { name: 'Marcus Johnson', title: 'VP of Engineering', location: 'Remote', why: 93, skills: ['Go', 'Distributed Systems', 'Leadership'], avatar: '🧑‍💻', exp: '12 years', open: true },
  { name: 'Priya Sharma', title: 'Head of Design', location: 'New York, NY', why: 91, skills: ['Figma', 'Design Systems', 'UX Research'], avatar: '👩‍🎨', exp: '9 years', open: false },
  { name: 'James Rivera', title: 'Director of Sales', location: 'Austin, TX', why: 88, skills: ['Enterprise Sales', 'MEDDIC', 'SaaS'], avatar: '🧑‍💼', exp: '10 years', open: true },
  { name: 'Taylor Kim', title: 'Principal Data Scientist', location: 'Remote', why: 85, skills: ['PyTorch', 'LLMs', 'Python'], avatar: '🧑‍🔬', exp: '7 years', open: true },
  { name: 'Jordan Williams', title: 'Product Designer', location: 'Seattle, WA', why: 82, skills: ['Figma', 'Prototyping', 'Mobile'], avatar: '🧑‍🎨', exp: '6 years', open: false },
];

export default function DemoRecruiterSearch() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('Senior Product Manager B2B SaaS');
  const [comparing, setComparing] = useState([]);

  const toggleCompare = (name) => {
    setComparing(prev => prev.includes(name) ? prev.filter(n => n !== name) : prev.length < 2 ? [...prev, name] : prev);
  };

  return (
    <>
      <Head><title>Search — ForgeTomorrow Recruiter</title></Head>
      <RecruiterLayout>
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ ...GLASS, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: ORANGE, fontStyle: 'italic' }}>Advanced Search</div>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Natural language search powered by ForgeTomorrow Intelligence — find candidates by signal, not just keywords.</div>
          </div>

          {/* Search bar */}
          <div style={{ ...GLASS }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input value={query} onChange={e => setQuery(e.target.value)}
                style={{ flex: 1, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '12px 18px', fontSize: 14, outline: 'none', background: 'rgba(255,255,255,0.9)' }}
                placeholder="Describe your ideal candidate in plain English..." />
              <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '12px 28px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Search</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[['Location', 'Remote, USA'], ['Experience', '5–12 years'], ['WHY Score', '80+'], ['Open to work', 'Yes'], ['Skills', 'Product, SaaS, AI']].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,112,67,0.08)', border: '1px solid rgba(255,112,67,0.25)', color: ORANGE }}>
                  <span style={{ color: '#94A3B8', fontWeight: 500 }}>{label}:</span> {val}
                  <span style={{ cursor: 'pointer', marginLeft: 2 }}>×</span>
                </div>
              ))}
            </div>
          </div>

          {comparing.length === 2 && (
            <div style={{ ...GLASS, background: 'rgba(255,112,67,0.08)', border: '1px solid rgba(255,112,67,0.3)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: ORANGE }}>Comparing: {comparing.join(' vs ')}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '8px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>View Side-by-Side →</button>
                <button onClick={() => setComparing([])} style={{ background: 'none', border: '1px solid rgba(255,112,67,0.4)', color: ORANGE, borderRadius: 999, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Clear</button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginBottom: 10 }}>{RESULTS.length} candidates matched · ranked by WHY Score</div>
              <div style={{ display: 'grid', gap: 10 }}>
                {RESULTS.map((c, i) => (
                  <div key={i} style={{ ...WHITE_CARD, cursor: 'pointer', border: selected?.name === c.name ? `2px solid ${ORANGE}` : '1px solid rgba(0,0,0,0.07)', display: 'grid', gridTemplateColumns: '1fr 80px 120px auto', alignItems: 'center', gap: 16 }}
                    onClick={() => setSelected(c)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,112,67,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{c.avatar}</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {c.name}
                          {c.open && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: 'rgba(22,163,74,0.1)', color: '#16A34A' }}>Open to work</span>}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{c.title} · {c.location} · {c.exp}</div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                          {c.skills.slice(0, 3).map(s => <span key={s} style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: 'rgba(255,112,67,0.08)', color: ORANGE }}>{s}</span>)}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 20, color: c.why >= 90 ? '#16A34A' : '#D97706' }}>{c.why}<span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 500 }}>/100</span></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <button style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, border: `1px solid ${ORANGE}`, color: ORANGE, background: 'none', cursor: 'pointer', fontWeight: 700 }} onClick={e => { e.stopPropagation(); }}>Message</button>
                      <button style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.12)', color: '#64748B', background: 'none', cursor: 'pointer', fontWeight: 700 }} onClick={e => { e.stopPropagation(); }}>Add to Pool</button>
                    </div>
                    <div onClick={e => { e.stopPropagation(); toggleCompare(c.name); }}>
                      <input type="checkbox" checked={comparing.includes(c.name)} onChange={() => {}} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: ORANGE }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selected && (
              <div style={{ ...GLASS, position: 'sticky', top: 16, alignSelf: 'start' }}>
                <button onClick={() => setSelected(null)} style={{ fontSize: 11, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontWeight: 600, fontFamily: 'inherit' }}>✕ Close</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,112,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{selected.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: '#0F172A' }}>{selected.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{selected.title}</div>
                  </div>
                </div>
                <div style={{ ...WHITE_CARD, textAlign: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>WHY Score</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: selected.why >= 90 ? '#16A34A' : '#D97706' }}>{selected.why}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>out of 100</div>
                </div>
                {[['Role Alignment', selected.why], ['Skills Match', selected.why - 4], ['Experience Depth', selected.why - 7], ['Signal Strength', selected.why - 2]].map(([label, score]) => (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div style={{ fontSize: 12, color: '#334155' }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE }}>{score}%</div>
                    </div>
                    <div style={{ height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 999 }}>
                      <div style={{ height: '100%', width: `${score}%`, background: ORANGE, borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
                  <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '10px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Send Message</button>
                  <button style={{ background: 'none', color: ORANGE, border: `1px solid ${ORANGE}`, borderRadius: 999, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>View Full Profile</button>
                  <button style={{ background: 'none', color: '#64748B', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 999, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Why This Candidate →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </RecruiterLayout>
    </>
  );
}
