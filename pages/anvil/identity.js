// pages/anvil/identity.js
import Head from 'next/head';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';

const ORANGE = '#FF7043';
const DARK = '#1E293B';
const SLATE = '#334155';

const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const WHITE_CARD = {
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'rgba(255,255,255,0.92)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const INPUT = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid rgba(0,0,0,0.14)',
  borderRadius: 10,
  fontSize: 13,
  color: DARK,
  background: 'rgba(255,255,255,0.92)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const TEXTAREA = {
  ...INPUT,
  minHeight: 92,
  resize: 'vertical',
  lineHeight: 1.5,
};

const SECTION_HDR = {
  padding: '10px 14px',
  background: 'linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))',
  color: 'white',
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: 0.4,
  borderRadius: '12px 12px 0 0',
};

function getChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || '');
    if (!s.includes('chrome=')) return '';
    const qIndex = s.indexOf('?');
    if (qIndex === -1) return '';
    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    return String(params.get('chrome') || '').toLowerCase();
  } catch {
    return '';
  }
}

function Pill({ children, tone = 'orange' }) {
  const colors = {
    orange: ['rgba(255,112,67,0.10)', ORANGE, 'rgba(255,112,67,0.24)'],
    green: ['rgba(22,163,74,0.10)', '#15803D', 'rgba(22,163,74,0.24)'],
    blue: ['rgba(14,165,233,0.10)', '#0369A1', 'rgba(14,165,233,0.24)'],
    amber: ['rgba(245,158,11,0.12)', '#92400E', 'rgba(245,158,11,0.26)'],
  };

  const [bg, color, border] = colors[tone] || colors.orange;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content',
        borderRadius: 999,
        padding: '5px 9px',
        fontSize: 11,
        fontWeight: 900,
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {children}
    </span>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 900, color: SLATE }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={INPUT}>
        <option value="">Choose one…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 900, color: SLATE }}>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={TEXTAREA}
      />
    </label>
  );
}

function BulletList({ items, color = ORANGE }) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!arr.length) {
    return <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>—</div>;
  }

  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 7 }}>
      {arr.map((item, idx) => (
        <li
          key={`${idx}-${item}`}
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            fontSize: 12,
            color: SLATE,
            lineHeight: 1.5,
          }}
        >
          <span style={{ color, fontWeight: 900, marginTop: 1 }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ResultCard({ title, tone = 'orange', children }) {
  const hdr =
    tone === 'green'
      ? 'rgba(22,163,74,0.86)'
      : tone === 'blue'
      ? 'rgba(14,165,233,0.86)'
      : tone === 'amber'
      ? 'rgba(245,158,11,0.90)'
      : 'rgba(255,112,67,0.90)';

  return (
    <section style={{ ...WHITE_CARD, overflow: 'hidden' }}>
      <div style={{ ...SECTION_HDR, background: hdr }}>{title}</div>
      <div style={{ padding: 14 }}>{children}</div>
    </section>
  );
}

function buildIdentitySnapshot(form) {
  const autonomy = form.autonomy;
  const ambiguity = form.ambiguity;
  const energy = form.energy;
  const pressure = form.pressure;
  const communication = form.communication;
  const growth = form.growth;

  const strengthSignals = [];

  if (energy === 'systems') strengthSignals.push('Systems thinker');
  if (energy === 'people') strengthSignals.push('Relationship builder');
  if (energy === 'execution') strengthSignals.push('Execution driver');
  if (energy === 'strategy') strengthSignals.push('Strategic navigator');

  if (pressure === 'calm') strengthSignals.push('Calm under pressure');
  if (pressure === 'direct') strengthSignals.push('Decisive problem solver');
  if (autonomy === 'high') strengthSignals.push('Independent operator');
  if (ambiguity === 'high') strengthSignals.push('Ambiguity-capable builder');

  const coreMode =
    energy === 'systems'
      ? 'Operational Systems Builder'
      : energy === 'people'
      ? 'Trust-Centered Connector'
      : energy === 'strategy'
      ? 'Strategic Direction Setter'
      : 'Execution-Focused Operator';

  const environment = [
    autonomy === 'high'
      ? 'Best with ownership, trust, and room to make decisions.'
      : autonomy === 'medium'
      ? 'Best with clear goals and reasonable autonomy.'
      : 'Best with clear structure, defined expectations, and close alignment.',
    ambiguity === 'high'
      ? 'Can navigate unclear environments when outcomes matter.'
      : ambiguity === 'medium'
      ? 'Handles change well when priorities are clarified.'
      : 'Performs best when role expectations and success measures are stable.',
    communication === 'direct'
      ? 'Likely values clear, direct, low-politics communication.'
      : communication === 'collaborative'
      ? 'Likely values discussion, shared context, and team buy-in.'
      : 'Likely values thoughtful written context before major decisions.',
  ];

  const opportunities = [
    growth === 'visibility'
      ? 'Increase visibility by documenting wins, decisions, and measurable outcomes.'
      : growth === 'delegation'
      ? 'Watch for over-ownership; build repeatable systems others can carry.'
      : growth === 'focus'
      ? 'Protect focus by narrowing priorities and reducing context-switching.'
      : 'Strengthen strategic framing so your work is understood beyond task completion.',
    'Review whether your current role rewards your natural operating style.',
    'Use this snapshot as a coaching conversation starter, not a fixed identity label.',
  ];

  const evidence = [
    form.recentWin
      ? `Recent win signal: ${form.recentWin}`
      : 'Recent win signal should be added later from resume, portfolio, and project history.',
    form.drain
      ? `Drain pattern: ${form.drain}`
      : 'Drain pattern should be refined through additional self-reflection.',
    form.goal
      ? `Current direction: ${form.goal}`
      : 'Current direction should be connected to Anvil goals later.',
  ];

  return {
    coreMode,
    strengthSignals: Array.from(new Set(strengthSignals)).slice(0, 6),
    environment,
    opportunities,
    evidence,
  };
}

export default function IdentityPage() {
  const router = useRouter();

  const chrome =
    String(router.query.chrome || '').toLowerCase() ||
    getChromeFromAsPath(router.asPath);

  const withChrome = (path) =>
    chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  const [form, setForm] = useState({
    energy: '',
    autonomy: '',
    ambiguity: '',
    pressure: '',
    communication: '',
    growth: '',
    recentWin: '',
    drain: '',
    goal: '',
  });

  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState('');

  const completion = useMemo(() => {
    const required = ['energy', 'autonomy', 'ambiguity', 'pressure', 'communication', 'growth'];
    const complete = required.filter((key) => Boolean(form[key])).length;
    return Math.round((complete / required.length) * 100);
  }, [form]);

  const setField = (key, value) => {
    setError('');
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const generateSnapshot = () => {
    const required = ['energy', 'autonomy', 'ambiguity', 'pressure', 'communication', 'growth'];
    const missing = required.filter((key) => !form[key]);

    if (missing.length) {
      setError('Complete the required reflection questions first.');
      return;
    }

    setSnapshot(buildIdentitySnapshot(form));
  };

  const reset = () => {
    setSnapshot(null);
    setError('');
  };

  const Header = (
    <section
      aria-label="Forge Identity Compass header"
      style={{
        background: 'white',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
        border: '1px solid #eee',
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, color: ORANGE, fontSize: 24, fontWeight: 900 }}>
        Forge Identity Compass
      </h1>
      <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 820, lineHeight: 1.5 }}>
        A voluntary professional identity reflection built around work patterns, evidence, and practical guidance — not labels, diagnosis, or personality boxes.
      </p>
    </section>
  );

  return (
    <>
      <Head>
        <title>Identity | The Anvil | ForgeTomorrow</title>
      </Head>

      <SeekerLayout
        title="Identity | The Anvil | ForgeTomorrow"
        header={Header}
        right={null}
        activeNav={null}
      >
        <div style={{ width: '100%', maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 14 }}>
          <div style={{ ...GLASS, padding: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <Pill>Voluntary reflection</Pill>
                <h2 style={{ margin: '10px 0 4px', color: DARK, fontSize: 20, fontWeight: 900 }}>
                  Understand how you work best
                </h2>
                <p style={{ margin: 0, color: '#64748B', fontSize: 13, lineHeight: 1.55, maxWidth: 780 }}>
                  This first version uses self-reflection only. Later, we’ll connect resume, portfolio, project, coaching, and preference signals so the result can explain why it reached each recommendation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push(withChrome('/anvil'))}
                style={{
                  border: '1px solid rgba(255,112,67,0.28)',
                  background: 'rgba(255,112,67,0.08)',
                  color: ORANGE,
                  borderRadius: 999,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                }}
              >
                ← Back to The Anvil
              </button>
            </div>
          </div>

          {!snapshot ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 340px)',
                gap: 14,
                alignItems: 'start',
              }}
            >
              <section style={{ ...GLASS, overflow: 'hidden' }}>
                <div style={SECTION_HDR}>🧭 IDENTITY REFLECTION</div>

                <div style={{ padding: 16, display: 'grid', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color: SLATE }}>Completion</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: ORANGE }}>{completion}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: 'rgba(15,23,42,0.10)', overflow: 'hidden' }}>
                      <div style={{ width: `${completion}%`, height: '100%', background: ORANGE, transition: 'width 180ms ease' }} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <SelectField
                      label="What type of work gives you the most energy?"
                      value={form.energy}
                      onChange={(v) => setField('energy', v)}
                      options={[
                        { value: 'systems', label: 'Improving systems, processes, and operations' },
                        { value: 'people', label: 'Helping, advising, coaching, or supporting people' },
                        { value: 'execution', label: 'Getting things done and moving work forward' },
                        { value: 'strategy', label: 'Planning direction, solving complex problems, or shaping vision' },
                      ]}
                    />

                    <SelectField
                      label="How much autonomy helps you do your best work?"
                      value={form.autonomy}
                      onChange={(v) => setField('autonomy', v)}
                      options={[
                        { value: 'high', label: 'High autonomy — give me the outcome and trust me' },
                        { value: 'medium', label: 'Balanced autonomy with clear check-ins' },
                        { value: 'low', label: 'Clear structure, close alignment, and defined steps' },
                      ]}
                    />

                    <SelectField
                      label="How comfortable are you with ambiguity?"
                      value={form.ambiguity}
                      onChange={(v) => setField('ambiguity', v)}
                      options={[
                        { value: 'high', label: 'Very comfortable — I can build through uncertainty' },
                        { value: 'medium', label: 'Comfortable if priorities are clear' },
                        { value: 'low', label: 'I prefer stable expectations and defined scope' },
                      ]}
                    />

                    <SelectField
                      label="How do you usually respond under pressure?"
                      value={form.pressure}
                      onChange={(v) => setField('pressure', v)}
                      options={[
                        { value: 'calm', label: 'I get calm and stabilize the situation' },
                        { value: 'direct', label: 'I make decisions quickly and act' },
                        { value: 'collaborative', label: 'I gather people and coordinate a response' },
                        { value: 'reflective', label: 'I pause, assess, and choose carefully' },
                      ]}
                    />

                    <SelectField
                      label="What communication style fits you best?"
                      value={form.communication}
                      onChange={(v) => setField('communication', v)}
                      options={[
                        { value: 'direct', label: 'Direct, clear, and low-politics' },
                        { value: 'collaborative', label: 'Collaborative, relational, and context-rich' },
                        { value: 'written', label: 'Written, thoughtful, and well-structured' },
                      ]}
                    />

                    <SelectField
                      label="What growth opportunity are you most focused on?"
                      value={form.growth}
                      onChange={(v) => setField('growth', v)}
                      options={[
                        { value: 'visibility', label: 'Being more visible for the value I create' },
                        { value: 'delegation', label: 'Delegating and not carrying too much alone' },
                        { value: 'focus', label: 'Improving focus and reducing overload' },
                        { value: 'strategy', label: 'Positioning my work more strategically' },
                      ]}
                    />
                  </div>

                  <TextField
                    label="Optional: Describe a recent professional win"
                    value={form.recentWin}
                    onChange={(v) => setField('recentWin', v)}
                    placeholder="Example: improved a process, helped a team, solved a recurring issue, delivered under pressure…"
                  />

                  <TextField
                    label="Optional: What drains you professionally?"
                    value={form.drain}
                    onChange={(v) => setField('drain', v)}
                    placeholder="Example: unclear priorities, office politics, repetitive admin work, no ownership, constant interruptions…"
                  />

                  <TextField
                    label="Optional: What are you trying to understand or decide right now?"
                    value={form.goal}
                    onChange={(v) => setField('goal', v)}
                    placeholder="Example: whether to pivot, whether to lead, what role fits me, how to explain my strengths…"
                  />

                  {error ? (
                    <div
                      style={{
                        padding: 11,
                        borderRadius: 10,
                        background: 'rgba(220,38,38,0.10)',
                        border: '1px solid rgba(220,38,38,0.25)',
                        color: '#B91C1C',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={generateSnapshot}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: 12,
                      background: ORANGE,
                      color: 'white',
                      padding: 14,
                      fontSize: 14,
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(255,112,67,0.34)',
                    }}
                  >
                    Generate My Identity Compass
                  </button>
                </div>
              </section>

              <aside style={{ display: 'grid', gap: 12 }}>
                <section style={{ ...GLASS, padding: 14, background: 'rgba(30,41,59,0.88)' }}>
                  <div style={{ fontWeight: 900, color: ORANGE, fontSize: 14, marginBottom: 6 }}>
                    Why this is different
                  </div>
                  <p style={{ margin: 0, color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 1.6 }}>
                    This is not a personality test, clinical tool, or hiring score. It is a professional reflection layer designed to help people understand work patterns and explain their value with evidence.
                  </p>
                </section>

                <section style={{ ...WHITE_CARD, padding: 14 }}>
                  <div style={{ fontWeight: 900, color: DARK, fontSize: 13, marginBottom: 8 }}>
                    Future save/share options
                  </div>

                  <div style={{ display: 'grid', gap: 8 }}>
                    {[
                      'Save my results',
                      'Show on portfolio',
                      'Share with coach',
                      'Include in hiring packet',
                    ].map((item) => (
                      <label
                        key={item}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#64748B',
                        }}
                      >
                        <input type="checkbox" disabled />
                        {item}
                      </label>
                    ))}
                  </div>

                  <div style={{ marginTop: 10, fontSize: 11, color: '#94A3B8', lineHeight: 1.45 }}>
                    Disabled for this test pass. We wire these after the experience is approved.
                  </div>
                </section>

                <section style={{ ...WHITE_CARD, padding: 14 }}>
                  <div style={{ fontWeight: 900, color: DARK, fontSize: 13, marginBottom: 8 }}>
                    Grounding principle
                  </div>
                  <BulletList
                    items={[
                      'Patterns, not labels.',
                      'Evidence, not assumptions.',
                      'Guidance, not diagnosis.',
                      'User control before sharing.',
                    ]}
                  />
                </section>
              </aside>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) minmax(0, 1fr)', gap: 14 }}>
              <aside style={{ ...GLASS, padding: 14, alignSelf: 'start', position: 'sticky', top: 16 }}>
                <Pill tone="green">Snapshot generated</Pill>

                <h2 style={{ margin: '10px 0 4px', color: DARK, fontSize: 20, fontWeight: 900 }}>
                  {snapshot.coreMode}
                </h2>

                <p style={{ margin: '0 0 12px', color: '#64748B', fontSize: 12, lineHeight: 1.55 }}>
                  This result is a working reflection based on your answers. Later versions should add resume, portfolio, project, and coaching evidence.
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {snapshot.strengthSignals.map((s) => (
                    <Pill key={s}>{s}</Pill>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={reset}
                  style={{
                    width: '100%',
                    borderRadius: 999,
                    padding: '8px 14px',
                    border: '1px solid rgba(255,112,67,0.25)',
                    background: 'rgba(255,112,67,0.08)',
                    color: ORANGE,
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  Edit answers
                </button>
              </aside>

              <section style={{ display: 'grid', gap: 12 }}>
                <ResultCard title="🔥 CORE STRENGTH SIGNALS">
                  <BulletList items={snapshot.strengthSignals} />
                </ResultCard>

                <ResultCard title="🌍 BEST-FIT WORK ENVIRONMENT" tone="blue">
                  <BulletList items={snapshot.environment} color="#0369A1" />
                </ResultCard>

                <ResultCard title="📈 GROWTH OPPORTUNITIES" tone="amber">
                  <BulletList items={snapshot.opportunities} color="#92400E" />
                </ResultCard>

                <ResultCard title="🧾 WHY THIS RESULT APPEARED" tone="green">
                  <BulletList items={snapshot.evidence} color="#15803D" />
                </ResultCard>

                <section style={{ ...GLASS, padding: 14 }}>
                  <div style={{ fontWeight: 900, color: ORANGE, fontSize: 13, marginBottom: 8 }}>
                    Save & share controls coming next
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                    {[
                      'Save my results',
                      'Show on portfolio',
                      'Share with coach',
                      'Include in hiring packet',
                    ].map((item) => (
                      <button
                        key={item}
                        type="button"
                        disabled
                        style={{
                          padding: '10px 8px',
                          borderRadius: 10,
                          border: '1px solid rgba(0,0,0,0.10)',
                          background: 'rgba(255,255,255,0.72)',
                          color: '#94A3B8',
                          fontSize: 11,
                          fontWeight: 900,
                          cursor: 'not-allowed',
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </section>
              </section>
            </div>
          )}
        </div>
      </SeekerLayout>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}