// components/identity/ProfessionalOperatingProfileEngine.js
// Redesigned — dossier layout with editorial hierarchy
import { useEffect, useMemo, useState } from 'react';

const ORANGE = '#FF7043';
const DARK   = '#1E293B';
const SLATE  = '#334155';
const MID    = '#64748B';
const LIGHT  = '#94A3B8';

const GLASS = {
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.28)',
  background: 'rgba(255,255,255,0.60)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

const WHITE_CARD = {
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.07)',
  background: 'rgba(255,255,255,0.94)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
};

const INPUT = {
  width: '100%',
  padding: '9px 11px',
  border: '1px solid rgba(0,0,0,0.13)',
  borderRadius: 10,
  fontSize: 13,
  color: DARK,
  background: 'rgba(255,255,255,0.92)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const TEXTAREA = { ...INPUT, minHeight: 74, resize: 'vertical', lineHeight: 1.45 };

const TABS = [
  { id: 'snapshot',  label: 'Snapshot',           icon: '◉' },
  { id: 'work',      label: 'Work Style',          icon: '⬡' },
  { id: 'business',  label: 'Business Integration', icon: '◈' },
  { id: 'evidence',  label: 'Evidence / WHY',      icon: '◎' },
  { id: 'share',     label: 'Share',               icon: '↗' },
];

const TONE_COLORS = {
  orange: { bg: 'rgba(255,112,67,0.08)', color: ORANGE,    border: 'rgba(255,112,67,0.22)', dot: ORANGE    },
  green:  { bg: 'rgba(22,163,74,0.08)',  color: '#15803D', border: 'rgba(22,163,74,0.22)',  dot: '#16A34A' },
  blue:   { bg: 'rgba(14,165,233,0.08)', color: '#0369A1', border: 'rgba(14,165,233,0.22)', dot: '#0EA5E9' },
  amber:  { bg: 'rgba(245,158,11,0.10)', color: '#92400E', border: 'rgba(245,158,11,0.26)', dot: '#F59E0B' },
  slate:  { bg: 'rgba(15,23,42,0.06)',   color: SLATE,     border: 'rgba(15,23,42,0.13)',   dot: SLATE     },
};

function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [];
}

// ── Signal pill ──────────────────────────────────────────────────────────────
function Pill({ children, tone = 'orange', size = 'sm' }) {
  const c = TONE_COLORS[tone] || TONE_COLORS.orange;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      borderRadius: 999, border: `1px solid ${c.border}`,
      background: c.bg, color: c.color,
      padding: size === 'lg' ? '6px 12px' : '4px 9px',
      fontSize: size === 'lg' ? 12 : 11,
      fontWeight: 700, whiteSpace: 'nowrap',
      letterSpacing: '0.01em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {children}
    </span>
  );
}

// ── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children, tone = 'orange' }) {
  const c = TONE_COLORS[tone] || TONE_COLORS.orange;
  return (
    <div style={{
      fontSize: 10, fontWeight: 900, letterSpacing: '0.10em',
      textTransform: 'uppercase', color: c.color, marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

// ── Bullet list — left accent bar style ─────────────────────────────────────
function BulletList({ items, tone = 'orange' }) {
  const arr = toList(items);
  const c = TONE_COLORS[tone] || TONE_COLORS.orange;
  if (!arr.length) return <div style={{ fontSize: 12, color: LIGHT, fontStyle: 'italic' }}>—</div>;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
      {arr.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: SLATE, lineHeight: 1.55 }}>
          <span style={{ width: 3, minHeight: 16, borderRadius: 2, background: c.dot, flexShrink: 0, marginTop: 3 }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ── Dossier block — used throughout tabs ─────────────────────────────────────
function Block({ label, tone = 'orange', children, fullWidth = false }) {
  return (
    <div style={{
      ...WHITE_CARD,
      padding: '16px 18px',
      display: 'grid', gap: 10,
      gridColumn: fullWidth ? '1 / -1' : undefined,
    }}>
      <SectionLabel tone={tone}>{label}</SectionLabel>
      {children}
    </div>
  );
}

// ── Confidence signal badge ──────────────────────────────────────────────────
function ConfidenceBadge({ item }) {
  const level = item.level || '';
  const tone = level === 'Strong signal' ? 'green' : level === 'Moderate signal' ? 'blue' : 'amber';
  const c = TONE_COLORS[tone];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      padding: '8px 12px', borderRadius: 8,
      background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: c.color }}>{item.label}</span>
      <span style={{ fontSize: 10, fontWeight: 900, color: c.dot, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
        {level.toUpperCase()}
      </span>
    </div>
  );
}

// ── Evidence row — for the WHY tab ──────────────────────────────────────────
function EvidenceBlock({ label, items, tone }) {
  const arr = toList(items);
  const c = TONE_COLORS[tone] || TONE_COLORS.slate;
  if (!arr.length) return null;
  return (
    <div style={{ ...WHITE_CARD, padding: '14px 16px', display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 3, height: 16, borderRadius: 2, background: c.dot, flexShrink: 0 }} />
        <SectionLabel tone={tone}>{label}</SectionLabel>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
        {arr.map((item, i) => (
          <li key={i} style={{
            fontSize: 12, color: SLATE, lineHeight: 1.55,
            paddingLeft: 11, borderLeft: `2px solid ${c.border}`,
          }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Form helpers ─────────────────────────────────────────────────────────────
function SelectField({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'grid', gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: SLATE, letterSpacing: '0.03em' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={INPUT}>
        <option value="">Choose one…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange, placeholder, minHeight = 74 }) {
  return (
    <label style={{ display: 'grid', gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: SLATE, letterSpacing: '0.03em' }}>{label}</span>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...TEXTAREA, minHeight }} />
    </label>
  );
}

// ── Completion ring ──────────────────────────────────────────────────────────
function CompletionRing({ pct }) {
  const r = 22, c = 28, stroke = 3;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width={56} height={56} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,112,67,0.12)" strokeWidth={stroke} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={ORANGE} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 11, fontWeight: 900, color: ORANGE,
      }}>
        {pct}%
      </div>
    </div>
  );
}

const REQUIRED_FIELDS = ['energy','autonomy','ambiguity','pressure','communication','growth',
  'learningStyle','challengeStyle','motivation','careerHope'];

export default function ProfessionalOperatingProfileEngine() {
  const [form, setForm] = useState({
    energy:'', autonomy:'', ambiguity:'', pressure:'', communication:'', growth:'',
    learningStyle:'', challengeStyle:'', motivation:'', recognitionStyle:'', careerHope:'',
    idealImpact:'', stressTrigger:'', supportNeed:'', recentWin:'', drain:'', goal:'',
  });

  const [snapshot, setSnapshot]       = useState(null);
  const [activeTab, setActiveTab]     = useState('snapshot');
  const [error, setError]             = useState('');
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [saving, setSaving]           = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [shareSettings, setShareSettings] = useState({
    showOnPortfolio: false, shareWithCoach: false, includeInHiringPacket: false,
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoadingSaved(true);
        const res  = await fetch('/api/anvil/identity', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.ok && data?.profile) {
          if (data.profile.answersJson) setForm(p => ({ ...p, ...data.profile.answersJson }));
          if (data.profile.snapshotJson) setSnapshot(data.profile.snapshotJson);
          setShareSettings({
            showOnPortfolio:      Boolean(data.profile.showOnPortfolio),
            shareWithCoach:       Boolean(data.profile.shareWithCoach),
            includeInHiringPacket: Boolean(data.profile.includeInHiringPacket),
          });
        }
      } catch { /* non-blocking */ } finally { if (active) setLoadingSaved(false); }
    };
    load();
    return () => { active = false; };
  }, []);

  const completion = useMemo(() => {
    const done = REQUIRED_FIELDS.filter(k => Boolean(form[k])).length;
    return Math.round((done / REQUIRED_FIELDS.length) * 100);
  }, [form]);

  const setField = (k, v) => { setError(''); setSaveMessage(''); setForm(p => ({ ...p, [k]: v })); };

  const generate = async () => {
    if (REQUIRED_FIELDS.some(k => !form[k])) { setError('Complete the required reflection questions first.'); return; }
    setGenerating(true); setError(''); setSaveMessage('');
    try {
      const res  = await fetch('/api/anvil/identity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ answersJson: form, ...shareSettings, generateOnly: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to generate.');
      setSnapshot(data?.snapshot || null);
      setActiveTab('snapshot');
    } catch (e) { setError(e?.message || 'Failed to generate.'); }
    finally { setGenerating(false); }
  };

  const save = async () => {
    if (!snapshot) { setError('Generate your profile before saving.'); return; }
    setSaving(true); setError(''); setSaveMessage('');
    try {
      const res  = await fetch('/api/anvil/identity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ answersJson: form, snapshotJson: snapshot, ...shareSettings }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Failed to save.');
      setSnapshot(data?.snapshot || snapshot);
      setSaveMessage('Professional Operating Profile saved.');
    } catch (e) { setError(e?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingSaved) {
    return (
      <div style={{ ...GLASS, padding: 24, color: SLATE, fontWeight: 700, fontSize: 13 }}>
        Loading your Professional Operating Profile…
      </div>
    );
  }

  // ── Form view ──────────────────────────────────────────────────────────────
  if (!snapshot) {
    return (
      <div style={{ display: 'grid', gap: 14 }}>

        {/* Header */}
        <div style={{ ...GLASS, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Pill tone="slate">Voluntary</Pill>
                <Pill tone="slate">Evidence-backed</Pill>
                <Pill tone="slate">User-controlled</Pill>
              </div>
              <h2 style={{ margin: 0, color: ORANGE, fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>
                Professional Operating Profile
              </h2>
              <p style={{ margin: 0, color: MID, fontSize: 13, lineHeight: 1.55, maxWidth: 680 }}>
                Understand how you operate, learn, process pressure, integrate into teams, and perform
                at your best — backed by reflection, resume, portfolio, and ForgeTomorrow intelligence signals.
              </p>
            </div>
            <CompletionRing pct={completion} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 14, alignItems: 'start' }}>

          {/* Form */}
          <div style={{ ...GLASS, padding: 20, display: 'grid', gap: 14 }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 900, color: DARK }}>Operating reflection</h3>
              <p style={{ margin: 0, color: MID, fontSize: 12, lineHeight: 1.45 }}>
                Answer honestly. This translates your working patterns into explainable professional intelligence.
              </p>
            </div>

            {/* Required fields */}
            <div style={{ display: 'grid', gap: 2, marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: ORANGE }}>Required</span>
              <div style={{ height: 2, borderRadius: 1, background: 'rgba(255,112,67,0.15)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              <SelectField label="What type of work gives you the most energy?" value={form.energy} onChange={v => setField('energy',v)}
                options={[
                  { value:'systems',   label:'Improving systems, processes, and operations' },
                  { value:'people',    label:'Helping, advising, coaching, or supporting people' },
                  { value:'execution', label:'Getting things done and moving work forward' },
                  { value:'strategy',  label:'Planning direction, solving complex problems, or shaping vision' },
                ]} />
              <SelectField label="How much autonomy helps you do your best work?" value={form.autonomy} onChange={v => setField('autonomy',v)}
                options={[
                  { value:'high',   label:'High autonomy — give me the outcome and trust me' },
                  { value:'medium', label:'Balanced autonomy with clear check-ins' },
                  { value:'low',    label:'Clear structure, close alignment, and defined steps' },
                ]} />
              <SelectField label="How comfortable are you with ambiguity?" value={form.ambiguity} onChange={v => setField('ambiguity',v)}
                options={[
                  { value:'high',   label:'Very comfortable — I can build through uncertainty' },
                  { value:'medium', label:'Comfortable if priorities are clear' },
                  { value:'low',    label:'I prefer stable expectations and defined scope' },
                ]} />
              <SelectField label="How do you usually respond under pressure?" value={form.pressure} onChange={v => setField('pressure',v)}
                options={[
                  { value:'calm',          label:'I get calm and stabilize the situation' },
                  { value:'direct',        label:'I make decisions quickly and act' },
                  { value:'collaborative', label:'I gather people and coordinate a response' },
                  { value:'reflective',    label:'I pause, assess, and choose carefully' },
                ]} />
              <SelectField label="What communication style fits you best?" value={form.communication} onChange={v => setField('communication',v)}
                options={[
                  { value:'direct',        label:'Direct, clear, and low-politics' },
                  { value:'collaborative', label:'Collaborative, relational, and context-rich' },
                  { value:'written',       label:'Written, thoughtful, and well-structured' },
                ]} />
              <SelectField label="What growth opportunity are you most focused on?" value={form.growth} onChange={v => setField('growth',v)}
                options={[
                  { value:'visibility', label:'Being more visible for the value I create' },
                  { value:'delegation', label:'Delegating and not carrying too much alone' },
                  { value:'focus',      label:'Improving focus and reducing overload' },
                  { value:'strategy',   label:'Positioning my work more strategically' },
                ]} />
              <SelectField label="How do you learn best?" value={form.learningStyle} onChange={v => setField('learningStyle',v)}
                options={[
                  { value:'hands_on',            label:'Hands-on — let me work through the real thing' },
                  { value:'mentor_guided',        label:'Mentor-guided — show me the pattern, then let me try' },
                  { value:'documentation',        label:'Documentation-first — give me structure and reference material' },
                  { value:'trial_and_error',      label:'Trial and error — I learn by testing and adjusting' },
                ]} />
              <SelectField label="How do you usually see challenges?" value={form.challengeStyle} onChange={v => setField('challengeStyle',v)}
                options={[
                  { value:'builder',    label:'As something to build through or improve' },
                  { value:'solver',     label:'As a problem to diagnose and resolve' },
                  { value:'stabilizer', label:'As something to calm, organize, and stabilize' },
                  { value:'strategist', label:'As a signal that direction or priorities need review' },
                ]} />
              <SelectField label="What most motivates you professionally?" value={form.motivation} onChange={v => setField('motivation',v)}
                options={[
                  { value:'mission',   label:'Mission — doing work that matters' },
                  { value:'mastery',   label:'Mastery — becoming excellent at what I do' },
                  { value:'impact',    label:'Impact — seeing meaningful results from the work' },
                  { value:'ownership', label:'Ownership — being trusted to carry important work' },
                  { value:'growth',    label:'Growth — building toward a bigger future' },
                ]} />
              <SelectField label="What do you hope your career gives you more of?" value={form.careerHope} onChange={v => setField('careerHope',v)}
                options={[
                  { value:'purpose',   label:'Purpose and meaningful contribution' },
                  { value:'stability', label:'Stability and room to breathe' },
                  { value:'leadership',label:'Leadership influence and responsibility' },
                  { value:'craft',     label:'A stronger craft and deeper expertise' },
                  { value:'freedom',   label:'Freedom, autonomy, and self-direction' },
                ]} />
            </div>

            {/* Optional fields */}
            <div style={{ display: 'grid', gap: 2, marginTop: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: MID }}>Optional — adds depth</span>
              <div style={{ height: 2, borderRadius: 1, background: 'rgba(100,116,139,0.15)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              <TextField label="Recent professional win" value={form.recentWin} onChange={v => setField('recentWin',v)} placeholder="Improved a process, solved a recurring issue, delivered under pressure…" />
              <TextField label="What drains you professionally?" value={form.drain} onChange={v => setField('drain',v)} placeholder="Disconnected leadership, unclear priorities, politics, no ownership…" />
              <TextField label="Pressure or stress trigger" value={form.stressTrigger} onChange={v => setField('stressTrigger',v)} placeholder="Lack of clarity, unstable leadership, overloaded timelines…" />
              <TextField label="Support that helps you perform best" value={form.supportNeed} onChange={v => setField('supportNeed',v)} placeholder="Clear priorities, mentorship, trust, room to focus…" />
              <TextField label="Impact you want to create" value={form.idealImpact} onChange={v => setField('idealImpact',v)} placeholder="Helping people, improving systems, building something lasting…" />
              <TextField label="Recognition preference" value={form.recognitionStyle} onChange={v => setField('recognitionStyle',v)} placeholder="Outcomes, responsibility, compensation, visible appreciation…" />
            </div>

            <TextField label="What are you trying to understand or decide right now?" value={form.goal} onChange={v => setField('goal',v)}
              placeholder="Whether to pivot, lead, specialize, build, scale, or better explain my strengths…" minHeight={60} />

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.22)', color: '#B91C1C', fontSize: 12, fontWeight: 700 }}>
                {error}
              </div>
            )}

            <button type="button" onClick={generate} disabled={generating} style={{
              width: '100%', border: 'none', borderRadius: 12, cursor: generating ? 'not-allowed' : 'pointer',
              background: generating ? '#9CA3AF' : ORANGE, color: 'white',
              padding: 14, fontSize: 14, fontWeight: 900,
              boxShadow: generating ? 'none' : '0 4px 16px rgba(255,112,67,0.32)',
              letterSpacing: '-0.01em',
            }}>
              {generating ? 'Generating…' : 'Generate My Professional Operating Profile'}
            </button>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'grid', gap: 10, position: 'sticky', top: 16 }}>
            {[
              { title: 'What this creates', tone: 'slate', items: [
                'A practical picture of how you operate.',
                'Evidence-backed language for seeker, coach, and recruiter use.',
                'A share-controlled signal that belongs to you.',
              ]},
              { title: 'Evidence model', tone: 'orange', items: [
                'Self-reflection answers', 'Resume evidence', 'Portfolio / about',
                'Project evidence', 'Operational intelligence signals',
              ]},
              { title: 'Ground rules', tone: 'green', items: [
                'Patterns, not labels.', 'Evidence, not assumptions.',
                'Guidance, not diagnosis.', 'User control before sharing.',
              ]},
            ].map(card => (
              <div key={card.title} style={{ ...WHITE_CARD, padding: '14px 16px' }}>
                <SectionLabel tone={card.tone}>{card.title}</SectionLabel>
                <BulletList items={card.items} tone={card.tone} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Profile view ───────────────────────────────────────────────────────────
  const confidenceSignals = toList(snapshot?.confidenceSignals);
  const signalGroups      = snapshot?.signalGroups || {};

  return (
    <div style={{ display: 'grid', gap: 0 }}>

      {/* ── HERO HEADER ───────────────────────────────────────────────────── */}
      <div style={{
        ...GLASS,
        padding: '24px 28px',
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        borderBottom: '1px solid rgba(255,112,67,0.15)',
        background: 'rgba(255,255,255,0.72)',
      }}>
        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pill tone="green">Profile generated</Pill>
            <Pill tone="slate">Voluntary</Pill>
            <Pill tone="slate">Evidence-backed</Pill>
            <Pill tone="slate">User-controlled</Pill>
          </div>
          <button onClick={() => setSnapshot(null)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 999,
            border: '1px solid rgba(255,112,67,0.28)', background: 'rgba(255,112,67,0.07)',
            color: ORANGE, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            ↩ Edit answers
          </button>
        </div>

        {/* Operating style — the hero */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.10em', textTransform: 'uppercase', color: ORANGE, marginBottom: 6 }}>
            Operating Style
          </div>
          <h2 style={{
            margin: 0, fontSize: 28, fontWeight: 900, color: DARK,
            letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 10,
          }}>
            {snapshot.operatingStyle}
          </h2>
          <p style={{ margin: 0, color: MID, fontSize: 14, lineHeight: 1.65, maxWidth: 760 }}>
            {snapshot.professionalSummary}
          </p>
        </div>

        {/* Signal pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {toList(snapshot.strengthSignals).slice(0, 10).map(s => (
            <Pill key={s} tone="orange">{s}</Pill>
          ))}
        </div>
      </div>

      {/* ── TAB BAR ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 0, overflowX: 'auto',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        msOverflowStyle: 'none', scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: '0 0 auto',
              border: 'none', borderBottom: active ? `2.5px solid ${ORANGE}` : '2.5px solid transparent',
              background: 'none', cursor: 'pointer',
              padding: '12px 18px',
              fontSize: 12, fontWeight: active ? 900 : 600,
              color: active ? ORANGE : MID,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'color 0.12s, border-color 0.12s',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: 10, opacity: active ? 1 : 0.6 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────────────────────── */}
      <div style={{
        ...GLASS,
        borderTopLeftRadius: 0, borderTopRightRadius: 0,
        borderTop: 'none',
        padding: '20px 20px 24px',
      }}>

        {/* SNAPSHOT TAB */}
        {activeTab === 'snapshot' && (
          <div style={{ display: 'grid', gap: 14 }}>

            {/* Top row — person + professional side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <Block label="The person" tone="slate">
                <BulletList items={snapshot.person || snapshot.personProfile} tone="slate" />
              </Block>
              <Block label="The professional" tone="orange">
                <BulletList items={snapshot.professional || snapshot.professionalProfile} tone="orange" />
              </Block>
            </div>

            {/* Where I thrive — full width */}
            <Block label="Where I thrive" tone="blue" fullWidth>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                {toList(snapshot.thrivesIn).map((item, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)',
                    fontSize: 12, color: SLATE, lineHeight: 1.5,
                  }}>
                    {item}
                  </div>
                ))}
              </div>
            </Block>

            {/* Bottom row — confidence signals + signal groups */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <Block label="Confidence signals" tone="green">
                {confidenceSignals.length
                  ? <div style={{ display: 'grid', gap: 6 }}>
                      {confidenceSignals.map((item, i) => <ConfidenceBadge key={i} item={item} />)}
                    </div>
                  : <BulletList items={snapshot.strengthSignals} tone="green" />
                }
              </Block>

              <Block label="Signal groups" tone="orange">
                <div style={{ display: 'grid', gap: 12 }}>
                  {['identity','leadership','execution','environment'].map(key =>
                    toList(signalGroups[key]).length ? (
                      <div key={key}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: LIGHT, letterSpacing: '0.08em',
                          textTransform: 'uppercase', marginBottom: 6 }}>
                          {key}
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {signalGroups[key].map(s => <Pill key={s} tone="slate">{s}</Pill>)}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </Block>
            </div>
          </div>
        )}

        {/* WORK STYLE TAB */}
        {activeTab === 'work' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <Block label="How I perform best" tone="green">
                <BulletList items={snapshot.howTheyPerformBest} tone="green" />
              </Block>
              <Block label="How I learn" tone="blue">
                <BulletList items={snapshot.learningProfile || snapshot.learningGuidance} tone="blue" />
              </Block>
              <Block label="How I process pressure" tone="amber">
                <BulletList items={snapshot.stressProcessing || snapshot.pressureGuidance} tone="amber" />
              </Block>
              <Block label="Challenge orientation" tone="slate">
                <BulletList items={snapshot.challengeOrientation} tone="slate" />
              </Block>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <Block label="What motivates me" tone="orange">
                <BulletList items={snapshot.motivationProfile || snapshot.motivationDrivers} tone="orange" />
              </Block>
              <Block label="Career direction" tone="blue">
                <BulletList items={snapshot.careerDirection} tone="blue" />
              </Block>
            </div>
          </div>
        )}

        {/* BUSINESS INTEGRATION TAB */}
        {activeTab === 'business' && (
          <div style={{ display: 'grid', gap: 14 }}>
            {/* Integration + Utilization — full width each, prominent */}
            <Block label="How to integrate me" tone="green" fullWidth>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                {toList(snapshot.integrationGuidance).map((item, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)',
                    fontSize: 12, color: SLATE, lineHeight: 1.55,
                  }}>
                    {item}
                  </div>
                ))}
              </div>
            </Block>

            <Block label="How to utilize me" tone="orange" fullWidth>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                {toList(snapshot.roleUtilization).map((item, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(255,112,67,0.06)', border: '1px solid rgba(255,112,67,0.15)',
                    fontSize: 12, color: SLATE, lineHeight: 1.55,
                  }}>
                    {item}
                  </div>
                ))}
              </div>
            </Block>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <Block label="Where I may need support" tone="amber">
                <BulletList items={snapshot.supportAreas} tone="amber" />
              </Block>

              <Block label="Audience guidance" tone="slate">
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { role: 'Seeker',    key: 'seeker',    tone: 'orange' },
                    { role: 'Coach',     key: 'coach',     tone: 'blue'   },
                    { role: 'Recruiter', key: 'recruiter', tone: 'green'  },
                  ].map(({ role, key, tone }) =>
                    snapshot?.audienceViews?.[key] ? (
                      <div key={key}>
                        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.06em',
                          textTransform: 'uppercase', color: TONE_COLORS[tone].color, marginBottom: 4 }}>
                          {role}
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: SLATE, lineHeight: 1.55 }}>
                          {snapshot.audienceViews[key]}
                        </p>
                      </div>
                    ) : null
                  )}
                </div>
              </Block>
            </div>
          </div>
        )}

        {/* EVIDENCE / WHY TAB */}
        {activeTab === 'evidence' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {/* Intro strip */}
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(255,112,67,0.06)', border: '1px solid rgba(255,112,67,0.15)',
              fontSize: 12, color: SLATE, lineHeight: 1.55,
            }}>
              <strong style={{ color: ORANGE }}>How this profile was built.</strong>{' '}
              The Professional Operating Profile combines your self-reflection answers with resume evidence, portfolio signal, project evidence, and ForgeTomorrow operational intelligence signals. Every section below shows what evidence was used.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              <EvidenceBlock label="Self-reflection evidence"      items={snapshot?.why?.selfReflection}     tone="orange" />
              <EvidenceBlock label="Resume evidence"               items={snapshot?.why?.resumeEvidence}     tone="blue"   />
              <EvidenceBlock label="Portfolio evidence"            items={snapshot?.why?.portfolioEvidence}  tone="slate"  />
              <EvidenceBlock label="Project evidence"              items={snapshot?.why?.projectEvidence}    tone="amber"  />
            </div>
            <EvidenceBlock label="Operational intelligence signals" items={snapshot?.why?.intelligenceEvidence} tone="green" />
          </div>
        )}

        {/* SHARE TAB */}
        {activeTab === 'share' && (
          <div style={{ display: 'grid', gap: 14 }}>

            {/* Share controls */}
            <div style={{ ...WHITE_CARD, padding: '18px 20px', display: 'grid', gap: 14 }}>
              <SectionLabel tone="orange">Share controls</SectionLabel>
              <p style={{ margin: 0, fontSize: 12, color: MID, lineHeight: 1.55 }}>
                You control who sees this profile. Nothing is shared without your explicit choice here.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
                {[
                  { key: 'showOnPortfolio',      label: 'Show on portfolio',     desc: 'Visible on your public profile page' },
                  { key: 'shareWithCoach',        label: 'Share with coach',      desc: 'Coaches you work with can see this' },
                  { key: 'includeInHiringPacket', label: 'Include in hiring packet', desc: 'Added to recruiter candidate packets' },
                ].map(({ key, label, desc }) => (
                  <label key={key} style={{
                    ...WHITE_CARD, padding: '12px 14px', cursor: 'pointer',
                    border: shareSettings[key] ? '1px solid rgba(255,112,67,0.35)' : '1px solid rgba(0,0,0,0.07)',
                    background: shareSettings[key] ? 'rgba(255,112,67,0.05)' : 'rgba(255,255,255,0.94)',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={shareSettings[key]}
                        onChange={e => setShareSettings(p => ({ ...p, [key]: e.target.checked }))}
                        style={{ accentColor: ORANGE, width: 14, height: 14 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: DARK }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: MID, lineHeight: 1.4 }}>{desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.22)', color: '#B91C1C', fontSize: 12, fontWeight: 700 }}>
                {error}
              </div>
            )}
            {saveMessage && (
              <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(22,163,74,0.08)',
                border: '1px solid rgba(22,163,74,0.22)', color: '#15803D', fontSize: 12, fontWeight: 700 }}>
                {saveMessage}
              </div>
            )}

            <button type="button" onClick={save} disabled={saving} style={{
              width: '100%', border: 'none', borderRadius: 12,
              background: saving ? '#9CA3AF' : ORANGE, color: 'white',
              padding: 14, fontSize: 14, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(255,112,67,0.32)',
              letterSpacing: '-0.01em',
            }}>
              {saving ? 'Saving…' : 'Save Professional Operating Profile'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}