// pages/demo/anvil.js
import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };
const DARK_CARD = { background: 'rgba(15,23,42,0.88)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 14 };

const TOOLS = [
  { id: 'growth', icon: '🚀', title: 'Growth & Pivot Engine', desc: 'Build your 30/60/90 day career roadmap powered by your resume evidence.', cta: 'Launch Engine', color: '#FF7043' },
  { id: 'offer', icon: '💰', title: 'Offer Negotiation', desc: 'Get a data-backed counteroffer strategy. Know your worth, prove it.', cta: 'Negotiate Now', color: '#7C3AED' },
  { id: 'identity', icon: '🧠', title: 'Professional Operating Profile', desc: 'Discover your leadership style, work DNA, and decision-making patterns.', cta: 'Build Profile', color: '#2563EB' },
  { id: 'project', icon: '📣', title: 'Project Promotion Engine', desc: 'Turn your best work into compelling portfolio evidence with AI.', cta: 'Promote Work', color: '#16A34A' },
];

const ROADMAP_PREVIEW = {
  direction: 'Stay the Course',
  target: 'VP of Product at Series B SaaS',
  phase1: ['Update LinkedIn headline and summary with signal language', 'Complete ForgeTomorrow portfolio with 3 quantified achievements', 'Request 2 strategic introductions from network'],
  phase2: ['Apply to 5 target companies with tailored applications', 'Schedule informational interviews at Stripe, Airbnb, Notion', 'Complete mock interview with career coach'],
  phase3: ['Negotiate final offers using ForgeTomorrow Offer Engine', 'Evaluate total comp across cash, equity, and growth trajectory', 'Make your move'],
};

export default function DemoAnvil() {
  const [active, setActive] = useState(null);
  const [direction, setDirection] = useState('stay');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
  };

  return (
    <>
      <Head><title>The Anvil — ForgeTomorrow</title></Head>
      <SeekerLayout header={
        <div style={{ ...GLASS, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: ORANGE, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>GOOD MORNING</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: ORANGE, fontStyle: 'italic', textShadow: '0 2px 8px rgba(255,112,67,0.4)' }}>The Anvil</div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Your workstation for building career signal — profile strength, negotiation readiness, and guided growth plans.</div>
        </div>
      }>
        {!active ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
              {TOOLS.map(tool => (
                <div key={tool.id} onClick={() => setActive(tool.id)}
                  style={{ ...GLASS, cursor: 'pointer', transition: 'transform 0.15s ease', ':hover': { transform: 'translateY(-2px)' } }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{tool.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>{tool.title}</div>
                  <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.55, marginBottom: 14 }}>{tool.desc}</div>
                  <button style={{ background: tool.color, color: '#fff', border: 'none', borderRadius: 999, padding: '9px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>{tool.cta}</button>
                </div>
              ))}
            </div>
          </div>
        ) : active === 'growth' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
            <div style={{ display: 'grid', gap: 12 }}>
              <button onClick={() => { setActive(null); setGenerated(false); }} style={{ background: 'none', border: '1px solid rgba(255,112,67,0.3)', color: ORANGE, borderRadius: 999, padding: '7px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer', width: 'fit-content', display: 'flex', alignItems: 'center', gap: 6 }}>← Anvil</button>

              <div style={{ ...GLASS }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', marginBottom: 12 }}>SELECT RESUME</div>
                <select style={{ width: '100%', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', background: 'rgba(255,255,255,0.9)' }}>
                  <option>Eric James - Founder & Chief Executive Officer - 2026-06-08 ★</option>
                  <option>Eric James - VP Product Resume - 2026-05-15</option>
                </select>
              </div>

              {!generated && (
                <div style={{ ...GLASS }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A', marginBottom: 14 }}>WHICH PATH ARE YOU CONSIDERING?</div>
                  {[['stay', '📈', 'Stay the Course', 'You like where you are. Increase your market value and map the next level.'], ['pivot', '🔀', 'Pivot', "You want to change direction. Tell us where and we'll compare it to your resume."], ['compare', '🤔', 'Not sure yet', 'Compare staying the course vs pivot options — see what you\'re missing for each path.']].map(([val, icon, label, desc]) => (
                    <div key={val} onClick={() => setDirection(val)}
                      style={{ ...WHITE_CARD, marginBottom: 10, cursor: 'pointer', border: direction === val ? `2px solid ${ORANGE}` : '1px solid rgba(0,0,0,0.07)', background: direction === val ? 'rgba(255,112,67,0.06)' : 'rgba(255,255,255,0.95)' }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: direction === val ? ORANGE : '#0F172A' }}>{label}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{desc}</div>
                    </div>
                  ))}
                  <button onClick={handleGenerate}
                    style={{ width: '100%', background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 900, fontSize: 15, cursor: 'pointer', marginTop: 4 }}>
                    {generating ? '🔄 Building your roadmap...' : `Generate My ${direction === 'stay' ? 'Stay' : direction === 'pivot' ? 'Pivot' : 'Compare'} Plan`}
                  </button>
                </div>
              )}

              {generated && (
                <div style={{ ...GLASS }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 16 }}>✅</span>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#15803D' }}>Your 30/60/90 Roadmap is Ready</div>
                  </div>
                  {[['Days 1–30: Foundation', ROADMAP_PREVIEW.phase1], ['Days 31–60: Activation', ROADMAP_PREVIEW.phase2], ['Days 61–90: Execution', ROADMAP_PREVIEW.phase3]].map(([phase, items]) => (
                    <div key={phase} style={{ ...WHITE_CARD, marginBottom: 10 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: ORANGE, marginBottom: 8 }}>{phase}</div>
                      {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                          <span style={{ color: ORANGE, flexShrink: 0 }}>→</span>
                          <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>{item}</div>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button style={{ flex: 1, background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '10px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Export to PDF</button>
                    <button style={{ flex: 1, background: 'none', border: `1px solid ${ORANGE}`, color: ORANGE, borderRadius: 999, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Open in Foundry</button>
                  </div>
                </div>
              )}
            </div>

            {/* Right panel */}
            <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
              <div style={{ ...DARK_CARD }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: ORANGE, marginBottom: 8 }}>🎯 Growth & Pivot Engine</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>Powered by Human-Centered Career Intelligence focused on your success. Your resume evidence drives the plan — not generic keyword advice.</div>
              </div>
              <div style={{ ...WHITE_CARD }}>
                <div style={{ fontWeight: 800, fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>THREE MODES</div>
                {[['🤔 Compare', 'See staying vs pivoting side by side. Costs, gaps, implications.'], ['📈 Stay', 'Increase your market value. Map the next level from where you are.'], ['🔀 Pivot', 'Target a specific role. See the exact gaps between now and there.']].map(([label, desc]) => (
                  <div key={label} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: '#0F172A', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...WHITE_CARD }}>
                <div style={{ fontWeight: 800, fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>YOUR ROADMAP INCLUDES</div>
                {['📅 30/60/90 day plan with objectives, actions, and metrics', '🏆 Quick wins for each phase', '⚠️ Risks to watch', '📈 Growth recommendations', '🧠 Skills to focus on', '🤝 Mentor escalation paths'].map((item, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#64748B', padding: '4px 0', borderBottom: i < 5 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>{item}</div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...GLASS, textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{TOOLS.find(t => t.id === active)?.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>{TOOLS.find(t => t.id === active)?.title}</div>
            <div style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>This tool is ready to use in your live account.</div>
            <button onClick={() => setActive(null)} style={{ background: 'none', border: `1px solid ${ORANGE}`, color: ORANGE, borderRadius: 999, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>← Back to Anvil</button>
          </div>
        )}
      </SeekerLayout>
    </>
  );
}
