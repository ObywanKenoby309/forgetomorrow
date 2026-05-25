import { useEffect, useMemo, useState } from 'react';

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
  padding: '9px 11px',
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
  minHeight: 74,
  resize: 'vertical',
  lineHeight: 1.45,
};

const TABS = [
  { id: 'snapshot', label: 'Snapshot' },
  { id: 'work', label: 'Work Style' },
  { id: 'business', label: 'Business Integration' },
  { id: 'evidence', label: 'Evidence / WHY' },
  { id: 'share', label: 'Share' },
];

function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
}

function Pill({ children, tone = 'orange' }) {
  const colors = {
    orange: ['rgba(255,112,67,0.10)', ORANGE, 'rgba(255,112,67,0.24)'],
    green: ['rgba(22,163,74,0.10)', '#15803D', 'rgba(22,163,74,0.24)'],
    blue: ['rgba(14,165,233,0.10)', '#0369A1', 'rgba(14,165,233,0.24)'],
    amber: ['rgba(245,158,11,0.12)', '#92400E', 'rgba(245,158,11,0.26)'],
    slate: ['rgba(15,23,42,0.08)', '#334155', 'rgba(15,23,42,0.14)'],
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
      <span style={{ fontSize: 12, fontWeight: 900, color: SLATE }}>
        {label}
      </span>

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

function TextField({ label, value, onChange, placeholder, minHeight = 74 }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 900, color: SLATE }}>
        {label}
      </span>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...TEXTAREA, minHeight }}
      />
    </label>
  );
}

function BulletList({ items, color = ORANGE }) {
  const arr = toList(items);

  if (!arr.length) {
    return (
      <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
        —
      </div>
    );
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
            lineHeight: 1.48,
          }}
        >
          <span style={{ color, fontWeight: 900, marginTop: 1 }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MiniCard({ title, children, tone = 'orange' }) {
  const toneColor =
    tone === 'green'
      ? '#15803D'
      : tone === 'blue'
      ? '#0369A1'
      : tone === 'amber'
      ? '#92400E'
      : tone === 'slate'
      ? '#334155'
      : ORANGE;

  return (
    <section style={{ ...WHITE_CARD, padding: 13, display: 'grid', gap: 8 }}>
      <div style={{ color: toneColor, fontSize: 12, fontWeight: 900 }}>
        {title}
      </div>
      {children}
    </section>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `1px solid rgba(255,112,67,0.42)` : '1px solid rgba(15,23,42,0.08)',
        background: active ? 'rgba(255,112,67,0.12)' : 'rgba(255,255,255,0.78)',
        color: active ? ORANGE : SLATE,
        borderRadius: 999,
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 900,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

export default function ProfessionalOperatingProfileEngine() {
  const [form, setForm] = useState({
    energy: '',
    autonomy: '',
    ambiguity: '',
    pressure: '',
    communication: '',
    growth: '',
    learningStyle: '',
    challengeStyle: '',
    motivation: '',
    recognitionStyle: '',
    careerHope: '',
    idealImpact: '',
    stressTrigger: '',
    supportNeed: '',
    recentWin: '',
    drain: '',
    goal: '',
  });

  const [snapshot, setSnapshot] = useState(null);
  const [activeTab, setActiveTab] = useState('snapshot');
  const [error, setError] = useState('');
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [shareSettings, setShareSettings] = useState({
    showOnPortfolio: false,
    shareWithCoach: false,
    includeInHiringPacket: false,
  });

  useEffect(() => {
    let active = true;

    const loadSaved = async () => {
      try {
        setLoadingSaved(true);

        const res = await fetch('/api/anvil/identity', {
          method: 'GET',
          credentials: 'include',
        });

        const data = await res.json().catch(() => ({}));

        if (!active) return;

        if (res.ok && data?.profile) {
          if (data.profile.answersJson) {
            setForm((prev) => ({
              ...prev,
              ...data.profile.answersJson,
            }));
          }

          if (data.profile.snapshotJson) {
            setSnapshot(data.profile.snapshotJson);
          }

          setShareSettings({
            showOnPortfolio: Boolean(data.profile.showOnPortfolio),
            shareWithCoach: Boolean(data.profile.shareWithCoach),
            includeInHiringPacket: Boolean(data.profile.includeInHiringPacket),
          });
        }
      } catch {
        // non-blocking
      } finally {
        if (active) setLoadingSaved(false);
      }
    };

    loadSaved();

    return () => {
      active = false;
    };
  }, []);

  const requiredFields = [
    'energy',
    'autonomy',
    'ambiguity',
    'pressure',
    'communication',
    'growth',
    'learningStyle',
    'challengeStyle',
    'motivation',
    'careerHope',
  ];

  const completion = useMemo(() => {
    const complete = requiredFields.filter((key) => Boolean(form[key])).length;
    return Math.round((complete / requiredFields.length) * 100);
  }, [form]);

  const setField = (key, value) => {
    setError('');
    setSaveMessage('');
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setShareField = (key, value) => {
    setSaveMessage('');
    setShareSettings((prev) => ({ ...prev, [key]: value }));
  };

  const generateSnapshot = async () => {
    const missing = requiredFields.filter((key) => !form[key]);

    if (missing.length) {
      setError('Complete the required reflection questions first.');
      return;
    }

    setGenerating(true);
    setError('');
    setSaveMessage('');

    try {
      const res = await fetch('/api/anvil/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          answersJson: form,
          showOnPortfolio: shareSettings.showOnPortfolio,
          shareWithCoach: shareSettings.shareWithCoach,
          includeInHiringPacket: shareSettings.includeInHiringPacket,
          generateOnly: true,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to generate Professional Operating Profile.');
      }

      setSnapshot(data?.snapshot || null);
      setActiveTab('snapshot');
    } catch (e) {
      setError(e?.message || 'Failed to generate Professional Operating Profile.');
    } finally {
      setGenerating(false);
    }
  };

  const saveProfile = async () => {
    if (!snapshot) {
      setError('Generate your Professional Operating Profile before saving.');
      return;
    }

    setSaving(true);
    setError('');
    setSaveMessage('');

    try {
      const res = await fetch('/api/anvil/identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          answersJson: form,
          snapshotJson: snapshot,
          showOnPortfolio: shareSettings.showOnPortfolio,
          shareWithCoach: shareSettings.shareWithCoach,
          includeInHiringPacket: shareSettings.includeInHiringPacket,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save Professional Operating Profile.');
      }

      setSnapshot(data?.snapshot || snapshot);
      setSaveMessage('Professional Operating Profile saved.');
    } catch (e) {
      setError(e?.message || 'Failed to save Professional Operating Profile.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setSnapshot(null);
    setActiveTab('snapshot');
    setError('');
    setSaveMessage('');
  };

  const confidenceSignals = toList(snapshot?.confidenceSignals);
  const signalGroups = snapshot?.signalGroups || {};

  return (
    <div style={{ width: '100%', display: 'grid', gap: 12 }}>
      <section style={{ ...GLASS, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 7, minWidth: 260, flex: 1 }}>
            <Pill>Voluntary · Evidence-backed · User-controlled</Pill>
            <h2 style={{ margin: 0, color: ORANGE, fontSize: 20, fontWeight: 900 }}>
              Professional Operating Profile
            </h2>
            <p style={{ margin: 0, color: '#64748B', fontSize: 13, lineHeight: 1.5, maxWidth: 860 }}>
              Understand how you operate, learn, process pressure, integrate into teams, and perform at your best — backed by reflection, resume, portfolio, and ForgeTomorrow intelligence signals.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 6, minWidth: 150 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 900, color: SLATE }}>
              <span>Reflection</span>
              <span style={{ color: ORANGE }}>{completion}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(15,23,42,0.10)', overflow: 'hidden' }}>
              <div style={{ width: `${completion}%`, height: '100%', background: ORANGE, transition: 'width 180ms ease' }} />
            </div>
          </div>
        </div>
      </section>

      {loadingSaved ? (
        <section style={{ ...GLASS, padding: 18, color: SLATE, fontWeight: 800 }}>
          Loading saved Professional Operating Profile…
        </section>
      ) : !snapshot ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 320px)', gap: 12, alignItems: 'start' }}>
          <section style={{ ...GLASS, padding: 14, display: 'grid', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, color: DARK, fontSize: 16, fontWeight: 900 }}>
                Operating reflection
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 12, lineHeight: 1.45 }}>
                Answer honestly. This is not a score — it helps translate your working patterns into explainable professional intelligence.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
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

              <SelectField
                label="How do you learn best?"
                value={form.learningStyle}
                onChange={(v) => setField('learningStyle', v)}
                options={[
                  { value: 'hands_on', label: 'Hands-on — let me work through the real thing' },
                  { value: 'mentor_guided', label: 'Mentor-guided — show me the pattern, then let me try' },
                  { value: 'documentation', label: 'Documentation-first — give me the structure and reference material' },
                  { value: 'trial_and_error', label: 'Trial and error — I learn by testing and adjusting' },
                ]}
              />

              <SelectField
                label="How do you usually see challenges?"
                value={form.challengeStyle}
                onChange={(v) => setField('challengeStyle', v)}
                options={[
                  { value: 'builder', label: 'As something to build through or improve' },
                  { value: 'solver', label: 'As a problem to diagnose and resolve' },
                  { value: 'stabilizer', label: 'As something to calm, organize, and stabilize' },
                  { value: 'strategist', label: 'As a signal that direction or priorities need review' },
                ]}
              />

              <SelectField
                label="What most motivates you professionally?"
                value={form.motivation}
                onChange={(v) => setField('motivation', v)}
                options={[
                  { value: 'mission', label: 'Mission — doing work that matters' },
                  { value: 'mastery', label: 'Mastery — becoming excellent at what I do' },
                  { value: 'impact', label: 'Impact — seeing meaningful results from the work' },
                  { value: 'ownership', label: 'Ownership — being trusted to carry important work' },
                  { value: 'growth', label: 'Growth — building toward a bigger future' },
                ]}
              />

              <SelectField
                label="What do you hope your career gives you more of?"
                value={form.careerHope}
                onChange={(v) => setField('careerHope', v)}
                options={[
                  { value: 'purpose', label: 'Purpose and meaningful contribution' },
                  { value: 'stability', label: 'Stability and room to breathe' },
                  { value: 'leadership', label: 'Leadership influence and responsibility' },
                  { value: 'craft', label: 'A stronger craft and deeper expertise' },
                  { value: 'freedom', label: 'Freedom, autonomy, and self-direction' },
                ]}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <TextField label="Optional: recent professional win" value={form.recentWin} onChange={(v) => setField('recentWin', v)} placeholder="Improved a process, solved a recurring issue, delivered under pressure…" />
              <TextField label="Optional: what drains you professionally?" value={form.drain} onChange={(v) => setField('drain', v)} placeholder="Disconnected leadership, unclear priorities, politics, no ownership…" />
              <TextField label="Optional: pressure or stress trigger" value={form.stressTrigger} onChange={(v) => setField('stressTrigger', v)} placeholder="Lack of clarity, unstable leadership, overloaded timelines…" />
              <TextField label="Optional: support that helps you perform best" value={form.supportNeed} onChange={(v) => setField('supportNeed', v)} placeholder="Clear priorities, mentorship, trust, room to focus…" />
              <TextField label="Optional: impact you want to create" value={form.idealImpact} onChange={(v) => setField('idealImpact', v)} placeholder="Helping people, improving systems, building something lasting…" />
              <TextField label="Optional: recognition preference" value={form.recognitionStyle} onChange={(v) => setField('recognitionStyle', v)} placeholder="Outcomes, responsibility, compensation, visible appreciation…" />
            </div>

            <TextField
              label="Optional: what are you trying to understand or decide right now?"
              value={form.goal}
              onChange={(v) => setField('goal', v)}
              placeholder="Whether to pivot, lead, specialize, build, scale, or better explain my strengths…"
              minHeight={68}
            />

            {error ? (
              <div style={{ padding: 11, borderRadius: 10, background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.25)', color: '#B91C1C', fontSize: 12, fontWeight: 800 }}>
                {error}
              </div>
            ) : null}

            <button
              type="button"
              onClick={generateSnapshot}
              disabled={generating}
              style={{
                width: '100%',
                border: 'none',
                borderRadius: 12,
                background: generating ? '#9CA3AF' : ORANGE,
                color: 'white',
                padding: 13,
                fontSize: 14,
                fontWeight: 900,
                cursor: generating ? 'not-allowed' : 'pointer',
                boxShadow: generating ? 'none' : '0 4px 14px rgba(255,112,67,0.34)',
              }}
            >
              {generating ? 'Generating…' : 'Generate My Professional Operating Profile'}
            </button>
          </section>

          <aside style={{ display: 'grid', gap: 10 }}>
            <MiniCard title="What this creates" tone="slate">
              <BulletList
                items={[
                  'A practical picture of how you operate.',
                  'Evidence-backed language for seeker, coach, and recruiter use.',
                  'A share-controlled signal that belongs to the user.',
                ]}
                color="#334155"
              />
            </MiniCard>

            <MiniCard title="Evidence model">
              <BulletList
                items={[
                  'Self-reflection',
                  'Resume evidence',
                  'Portfolio/about evidence',
                  'Project evidence',
                  'Operational intelligence signals',
                ]}
              />
            </MiniCard>

            <MiniCard title="Ground rules" tone="green">
              <BulletList
                items={[
                  'Patterns, not labels.',
                  'Evidence, not assumptions.',
                  'Guidance, not diagnosis.',
                  'User control before sharing.',
                ]}
                color="#15803D"
              />
            </MiniCard>
          </aside>
        </div>
      ) : (
        <section style={{ ...GLASS, padding: 14, display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: 7, flex: 1, minWidth: 280 }}>
              <Pill tone="green">Profile generated</Pill>
              <h3 style={{ margin: 0, color: DARK, fontSize: 20, fontWeight: 900 }}>
                {snapshot.operatingStyle}
              </h3>
              <p style={{ margin: 0, color: '#64748B', fontSize: 13, lineHeight: 1.5, maxWidth: 860 }}>
                {snapshot.professionalSummary}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {toList(snapshot.strengthSignals).slice(0, 8).map((s) => (
                  <Pill key={s}>{s}</Pill>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button type="button" onClick={reset} style={{ borderRadius: 999, padding: '8px 14px', border: '1px solid rgba(255,112,67,0.25)', background: 'rgba(255,112,67,0.08)', color: ORANGE, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>
                Edit answers
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid rgba(15,23,42,0.08)', paddingTop: 12 }}>
            {TABS.map((tab) => (
              <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </TabButton>
            ))}
          </div>

          {activeTab === 'snapshot' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <MiniCard title="The person" tone="slate">
                <BulletList items={snapshot.person || snapshot.personProfile || [snapshot.professionalSummary]} color="#334155" />
              </MiniCard>

              <MiniCard title="The professional">
                <BulletList items={snapshot.professional || snapshot.professionalProfile || snapshot.strengthSignals} />
              </MiniCard>

              <MiniCard title="Where I thrive" tone="blue">
                <BulletList items={snapshot.thrivesIn} color="#0369A1" />
              </MiniCard>

              <MiniCard title="Confidence signals" tone="green">
                {confidenceSignals.length ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {confidenceSignals.map((item) => (
                      <Pill key={`${item.label}-${item.level}`} tone={item.level === 'Strong signal' ? 'green' : item.level === 'Moderate signal' ? 'blue' : 'amber'}>
                        {item.level}: {item.label}
                      </Pill>
                    ))}
                  </div>
                ) : (
                  <BulletList items={snapshot.strengthSignals} color="#15803D" />
                )}
              </MiniCard>

              <MiniCard title="Signal groups" tone="orange">
                <div style={{ display: 'grid', gap: 8 }}>
                  {['identity', 'leadership', 'execution', 'environment'].map((key) =>
                    toList(signalGroups[key]).length ? (
                      <div key={key}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: SLATE, textTransform: 'uppercase', marginBottom: 4 }}>
                          {key}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {signalGroups[key].map((item) => (
                            <Pill key={`${key}-${item}`} tone="slate">{item}</Pill>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </MiniCard>
            </div>
          )}

          {activeTab === 'work' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <MiniCard title="How I perform best" tone="green">
                <BulletList items={snapshot.howTheyPerformBest} color="#15803D" />
              </MiniCard>

              <MiniCard title="How I learn" tone="blue">
                <BulletList items={snapshot.learningProfile || snapshot.learningStyle || snapshot.learningGuidance} color="#0369A1" />
              </MiniCard>

              <MiniCard title="How I process pressure" tone="amber">
                <BulletList items={snapshot.stressProcessing || snapshot.pressureGuidance} color="#92400E" />
              </MiniCard>

              <MiniCard title="Challenge orientation" tone="slate">
                <BulletList items={snapshot.challengeOrientation} color="#334155" />
              </MiniCard>

              <MiniCard title="What motivates me">
                <BulletList items={snapshot.motivationProfile || snapshot.motivationDrivers || snapshot.motivation} />
              </MiniCard>

              <MiniCard title="Career direction" tone="blue">
                <BulletList items={snapshot.careerDirection} color="#0369A1" />
              </MiniCard>
            </div>
          )}

          {activeTab === 'business' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <MiniCard title="How to integrate me" tone="green">
                <BulletList items={snapshot.integrationGuidance} color="#15803D" />
              </MiniCard>

              <MiniCard title="How to utilize me" tone="orange">
                <BulletList items={snapshot.roleUtilization} />
              </MiniCard>

              <MiniCard title="Where I may need support" tone="amber">
                <BulletList items={snapshot.supportAreas} color="#92400E" />
              </MiniCard>

              <MiniCard title="Audience guidance" tone="slate">
                <BulletList
                  items={[
                    snapshot?.audienceViews?.seeker ? `Seeker: ${snapshot.audienceViews.seeker}` : '',
                    snapshot?.audienceViews?.coach ? `Coach: ${snapshot.audienceViews.coach}` : '',
                    snapshot?.audienceViews?.recruiter ? `Recruiter: ${snapshot.audienceViews.recruiter}` : '',
                  ].filter(Boolean)}
                  color="#334155"
                />
              </MiniCard>
            </div>
          )}

          {activeTab === 'evidence' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              <MiniCard title="Self-reflection evidence" tone="green">
                <BulletList items={snapshot?.why?.selfReflection || []} color="#15803D" />
              </MiniCard>

              <MiniCard title="Resume evidence" tone="blue">
                <BulletList items={snapshot?.why?.resumeEvidence || []} color="#0369A1" />
              </MiniCard>

              <MiniCard title="Portfolio evidence">
                <BulletList items={snapshot?.why?.portfolioEvidence || []} />
              </MiniCard>

              <MiniCard title="Project evidence" tone="amber">
                <BulletList items={snapshot?.why?.projectEvidence || []} color="#92400E" />
              </MiniCard>

              <MiniCard title="Operational intelligence signals" tone="slate">
                <BulletList items={snapshot?.why?.intelligenceEvidence || []} color="#334155" />
              </MiniCard>
            </div>
          )}

          {activeTab === 'share' && (
            <div style={{ display: 'grid', gap: 10 }}>
              <MiniCard title="Share controls">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                  <label style={{ ...WHITE_CARD, padding: 10, fontSize: 12, fontWeight: 800, color: SLATE }}>
                    <input type="checkbox" checked={shareSettings.showOnPortfolio} onChange={(e) => setShareField('showOnPortfolio', e.target.checked)} style={{ marginRight: 7 }} />
                    Show on portfolio
                  </label>

                  <label style={{ ...WHITE_CARD, padding: 10, fontSize: 12, fontWeight: 800, color: SLATE }}>
                    <input type="checkbox" checked={shareSettings.shareWithCoach} onChange={(e) => setShareField('shareWithCoach', e.target.checked)} style={{ marginRight: 7 }} />
                    Share with coach
                  </label>

                  <label style={{ ...WHITE_CARD, padding: 10, fontSize: 12, fontWeight: 800, color: SLATE }}>
                    <input type="checkbox" checked={shareSettings.includeInHiringPacket} onChange={(e) => setShareField('includeInHiringPacket', e.target.checked)} style={{ marginRight: 7 }} />
                    Include in hiring packet
                  </label>
                </div>

                <p style={{ margin: '10px 0 0', color: '#64748B', fontSize: 12, lineHeight: 1.45 }}>
                  PDF export should come after this layout stabilizes. For now, this saves the share settings and profile snapshot to the database.
                </p>
              </MiniCard>

              {error ? (
                <div style={{ padding: 11, borderRadius: 10, background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.25)', color: '#B91C1C', fontSize: 12, fontWeight: 800 }}>
                  {error}
                </div>
              ) : null}

              {saveMessage ? (
                <div style={{ padding: 11, borderRadius: 10, background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.25)', color: '#15803D', fontSize: 12, fontWeight: 800 }}>
                  {saveMessage}
                </div>
              ) : null}

              <button
                type="button"
                onClick={saveProfile}
                disabled={saving}
                style={{
                  width: '100%',
                  border: 'none',
                  borderRadius: 12,
                  background: saving ? '#9CA3AF' : ORANGE,
                  color: 'white',
                  padding: 13,
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving ? 'none' : '0 4px 14px rgba(255,112,67,0.34)',
                }}
              >
                {saving ? 'Saving…' : 'Save Professional Operating Profile'}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
