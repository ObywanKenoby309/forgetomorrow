// pages/demo/cover-letter.js
import React, { useState } from 'react';
import Head from 'next/head';

const ORANGE = '#FF7043';
const GLASS = { background: 'rgba(255,255,255,0.78)', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 10px 28px rgba(15,23,42,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 18, padding: 16 };
const WHITE_CARD = { background: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, padding: 14 };

const TEMPLATES = [
  { id: 'achievement', label: 'Achievement', desc: 'Lead with your biggest wins', icon: '🏆' },
  { id: 'narrative', label: 'Narrative', desc: 'Tell your career story', icon: '📖' },
  { id: 'concise', label: 'Concise', desc: 'Sharp and direct — 3 paragraphs', icon: '⚡' },
];

const COVER_CONTENT = `Dear Hiring Team at Stripe,

I'm writing to express my strong interest in the Senior Product Manager — Platform role. With over eight years building developer-facing products at scale, and a ForgeTomorrow WHY Score of 94/100 for this position, I believe my background aligns precisely with what you're looking to accomplish.

At TechCorp, I led the rebuild of our core API platform — reducing time-to-first-call for new developers by 67% and increasing developer satisfaction scores from 3.2 to 4.7 out of 5. I understand what it means to hold the line between engineering velocity and developer experience, and I know how to ship infrastructure that makes builders fall in love with your product.

What draws me to Stripe specifically is your commitment to making payments infrastructure feel like it disappears. I've watched your documentation evolve over the years and it's one of the clearest signals of a company that truly respects its developers. That's the standard I want to help you maintain — and raise.

I'd love to discuss how my experience translating complex platform capabilities into exceptional developer experiences could contribute to Stripe's next chapter.

Respectfully,
Eric James`;

export default function DemoCoverLetter() {
  const [template, setTemplate] = useState('achievement');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(true);
  const [role, setRole] = useState('Senior Product Manager — Platform');
  const [company, setCompany] = useState('Stripe');

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  };

  return (
    <>
      <Head><title>Cover Letter Builder — ForgeTomorrow</title></Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FF7043 0%, #FF8A65 50%, #334155 100%)', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ background: 'rgba(15,23,42,0.95)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ color: ORANGE, fontWeight: 900, fontSize: 16 }}>← ForgeTomorrow</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Cover Letter Builder</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 999, padding: '8px 18px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Export PDF</button>
            <button style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 400px', gap: 0, overflow: 'hidden' }}>
          {/* Left panel */}
          <div style={{ background: 'rgba(15,23,42,0.92)', borderRight: '1px solid rgba(255,255,255,0.08)', padding: 20, overflowY: 'auto' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Target Role</div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>Company</div>
                <input value={company} onChange={e => setCompany(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>Role Title</div>
                <input value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Template</div>
            <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
              {TEMPLATES.map(t => (
                <div key={t.id} onClick={() => setTemplate(t.id)}
                  style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: template === t.id ? 'rgba(255,112,67,0.2)' : 'rgba(255,255,255,0.05)', border: template === t.id ? `1px solid ${ORANGE}` : '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: template === t.id ? ORANGE : '#fff' }}>{t.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{t.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Resume Source</div>
            <select style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#fff', outline: 'none', marginBottom: 20 }}>
              <option>Eric James - Founder & CEO - 2026-06-08 ★</option>
            </select>

            <button onClick={handleGenerate} style={{ width: '100%', background: ORANGE, color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>
              {generating ? '✍️ Generating...' : '✨ Generate Cover Letter'}
            </button>
          </div>

          {/* Editor */}
          <div style={{ padding: 24, overflowY: 'auto', background: 'rgba(15,23,42,0.6)' }}>
            <div style={{ ...GLASS }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0F172A' }}>Cover Letter — {company}</div>
                {generated && <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#16A34A', fontWeight: 700 }}>✅ Generated from your resume</div>}
              </div>
              {generated ? (
                <textarea defaultValue={COVER_CONTENT} style={{ width: '100%', minHeight: 420, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 16, fontSize: 13, color: '#334155', lineHeight: 1.75, outline: 'none', fontFamily: 'Georgia, serif', resize: 'vertical', boxSizing: 'border-box', background: 'rgba(255,255,255,0.8)' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8', fontSize: 14 }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✍️</div>
                  Fill in the role details and click Generate to create your cover letter.
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div style={{ background: '#f8fafc', borderLeft: '1px solid rgba(0,0,0,0.1)', overflowY: 'auto', padding: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, textAlign: 'center' }}>Preview</div>
            <div style={{ background: '#fff', borderRadius: 8, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 12, color: '#0F172A', fontFamily: 'Georgia, serif', lineHeight: 1.8 }}>
              <div style={{ borderBottom: '1px solid rgba(255,112,67,0.3)', paddingBottom: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Eric James</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>Founder & CEO · ForgeTomorrow</div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>eric@forgetomorrow.com · Nashville, TN</div>
              </div>
              {generated && <div style={{ fontSize: 11, whiteSpace: 'pre-line', color: '#334155' }}>{COVER_CONTENT}</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
