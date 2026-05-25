// components/identity/ProfessionalOperatingProfileEngine.js
// v3 — Explainable Human Operational Intelligence workspace
// Compact. Analytical. Evidence-backed. Premium.

import { useEffect, useMemo, useState } from 'react';

// ── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  orange:  '#FF7043',
  dark:    '#0F172A',
  slate:   '#334155',
  mid:     '#64748B',
  light:   '#94A3B8',
  border:  'rgba(15,23,42,0.08)',
  glass:   'rgba(255,255,255,0.62)',
  white:   'rgba(255,255,255,0.94)',
};

const TONE = {
  orange: { fg: '#FF7043', bg: 'rgba(255,112,67,0.07)', border: 'rgba(255,112,67,0.20)', bar: '#FF7043' },
  green:  { fg: '#15803D', bg: 'rgba(22,163,74,0.07)',  border: 'rgba(22,163,74,0.20)',  bar: '#16A34A' },
  blue:   { fg: '#0369A1', bg: 'rgba(14,165,233,0.07)', border: 'rgba(14,165,233,0.20)', bar: '#0EA5E9' },
  amber:  { fg: '#92400E', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)', bar: '#F59E0B' },
  slate:  { fg: '#334155', bg: 'rgba(15,23,42,0.05)',   border: 'rgba(15,23,42,0.12)',   bar: '#475569' },
};

const surface = {
  borderRadius: 14,
  border: `1px solid rgba(255,255,255,0.26)`,
  background: T.glass,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

const card = {
  borderRadius: 10,
  border: `1px solid ${T.border}`,
  background: T.white,
  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
};

const INPUT_BASE = {
  width: '100%', padding: '8px 10px',
  border: `1px solid ${T.border}`, borderRadius: 8,
  fontSize: 12, color: T.dark, background: T.white,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const TABS = [
  { id: 'snapshot',  label: 'Profile'     },
  { id: 'work',      label: 'Work Style'  },
  { id: 'business',  label: 'Integration' },
  { id: 'evidence',  label: 'Evidence'    },
  { id: 'share',     label: 'Share'       },
];

const REQUIRED = ['energy','autonomy','ambiguity','pressure','communication',
                  'growth','learningStyle','challengeStyle','motivation','careerHope'];

function toArr(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return [];
}
function safe(v='') { return String(v||'').trim(); }

// ── Primitives ────────────────────────────────────────────────────────────────

function Label({ children, tone='orange' }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 900, letterSpacing: '0.10em',
      textTransform: 'uppercase', color: TONE[tone]?.fg || T.mid,
      marginBottom: 7,
    }}>{children}</div>
  );
}

function Tag({ children, tone='orange' }) {
  const c = TONE[tone] || TONE.orange;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 999,
      fontSize: 10, fontWeight: 700,
      background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: c.bar, flexShrink: 0 }} />
      {children}
    </span>
  );
}

function Bullets({ items, tone='slate' }) {
  const arr = toArr(items);
  const bar = TONE[tone]?.bar || T.mid;
  if (!arr.length) return <div style={{ fontSize: 11, color: T.light, fontStyle: 'italic' }}>—</div>;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
      {arr.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: T.slate, lineHeight: 1.5 }}>
          <span style={{ width: 2, minHeight: 14, borderRadius: 1, background: bar, flexShrink: 0, marginTop: 4 }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Block({ label, tone='slate', children, span2=false }) {
  return (
    <div style={{ ...card, padding: '13px 15px', display: 'grid', gap: 9,
      gridColumn: span2 ? '1 / -1' : undefined }}>
      <Label tone={tone}>{label}</Label>
      {children}
    </div>
  );
}

// ── Confidence badge — analytical read, not a pill ────────────────────────────
function ConfidenceBadge({ item }) {
  const level = safe(item.level);
  const tone  = level.includes('Strong') ? 'green' : level.includes('Moderate') ? 'blue' : 'amber';
  const c     = TONE[tone];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 10px', borderRadius: 7,
      background: c.bg, border: `1px solid ${c.border}`,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: T.dark }}>{item.label}</span>
      <span style={{
        fontSize: 9, fontWeight: 900, letterSpacing: '0.08em',
        color: c.fg, textTransform: 'uppercase',
      }}>
        {level.replace(' signal','').replace(' Signal','')}
      </span>
    </div>
  );
}

// ── Evidence row — secondary, collapsible feel ───────────────────────────────
function EvidenceSection({ label, items, tone, defaultOpen=false }) {
  const [open, setOpen] = useState(defaultOpen);
  const arr = toArr(items);
  if (!arr.length) return null;
  const c = TONE[tone] || TONE.slate;
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '10px 14px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, borderRadius: 2, background: c.bar, flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em',
            textTransform: 'uppercase', color: c.fg }}>
            {label}
          </span>
          <span style={{ fontSize: 10, color: T.light, fontWeight: 600 }}>
            {arr.length} signal{arr.length !== 1 ? 's' : ''}
          </span>
        </div>
        <span style={{ fontSize: 12, color: T.mid, transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.15s', display: 'inline-block' }}>
          ▾
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 14px 12px', display: 'grid', gap: 5,
          borderTop: `1px solid ${T.border}`, paddingTop: 10, marginTop: 0 }}>
          {arr.map((item, i) => (
            <div key={i} style={{
              fontSize: 12, color: T.slate, lineHeight: 1.5,
              paddingLeft: 10, borderLeft: `2px solid ${c.border}`,
            }}>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tiled items — for integration/utilization ─────────────────────────────────
function TileGrid({ items, tone='slate' }) {
  const arr = toArr(items);
  const c   = TONE[tone] || TONE.slate;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 7 }}>
      {arr.map((item, i) => (
        <div key={i} style={{
          padding: '9px 11px', borderRadius: 8,
          background: c.bg, border: `1px solid ${c.border}`,
          fontSize: 12, color: T.slate, lineHeight: 1.5,
        }}>
          {item}
        </div>
      ))}
    </div>
  );
}

// ── Form helpers ──────────────────────────────────────────────────────────────
function SelectField({ label, value, onChange, options }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.slate }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={INPUT_BASE}>
        <option value="">Choose one…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.slate }}>{label}</span>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...INPUT_BASE, minHeight: 66, resize: 'vertical', lineHeight: 1.45 }} />
    </label>
  );
}

// ── Completion bar — slim ─────────────────────────────────────────────────────
function CompletionBar({ pct }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 999, background: 'rgba(255,112,67,0.12)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: T.orange,
          transition: 'width 300ms ease', borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 900, color: T.orange, whiteSpace: 'nowrap' }}>{pct}%</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
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
    let alive = true;
    (async () => {
      try {
        const res  = await fetch('/api/anvil/identity', { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!alive) return;
        if (res.ok && data?.profile) {
          if (data.profile.answersJson) setForm(p => ({ ...p, ...data.profile.answersJson }));
          if (data.profile.snapshotJson) setSnapshot(data.profile.snapshotJson);
          setShareSettings({
            showOnPortfolio:       Boolean(data.profile.showOnPortfolio),
            shareWithCoach:        Boolean(data.profile.shareWithCoach),
            includeInHiringPacket: Boolean(data.profile.includeInHiringPacket),
          });
        }
      } catch {} finally { if (alive) setLoadingSaved(false); }
    })();
    return () => { alive = false; };
  }, []);

  const completion = useMemo(() => {
    const done = REQUIRED.filter(k => Boolean(form[k])).length;
    return Math.round((done / REQUIRED.length) * 100);
  }, [form]);

  const setField = (k, v) => { setError(''); setSaveMessage(''); setForm(p => ({ ...p, [k]: v })); };

  const generate = async () => {
    if (REQUIRED.some(k => !form[k])) { setError('Complete all required questions first.'); return; }
    setGenerating(true); setError('');
    try {
      const res  = await fetch('/api/anvil/identity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ answersJson: form, ...shareSettings, generateOnly: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Generation failed.');
      setSnapshot(data?.snapshot || null);
      setActiveTab('snapshot');
    } catch (e) { setError(e?.message || 'Generation failed.'); }
    finally { setGenerating(false); }
  };

  const save = async () => {
    if (!snapshot) { setError('Generate before saving.'); return; }
    setSaving(true); setError('');
    try {
      const res  = await fetch('/api/anvil/identity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ answersJson: form, snapshotJson: snapshot, ...shareSettings }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Save failed.');
      setSnapshot(data?.snapshot || snapshot);
      setSaveMessage('Saved.');
    } catch (e) { setError(e?.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loadingSaved) return (
    <div style={{ ...surface, padding: '16px 20px', fontSize: 12, color: T.mid }}>
      Loading your Professional Operating Profile…
    </div>
  );

  // ── Form ───────────────────────────────────────────────────────────────────
  if (!snapshot) return (
    <div style={{ display: 'grid', gap: 12 }}>

      {/* Compact header */}
      <div style={{ ...surface, padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
              {['Voluntary','Evidence-backed','User-controlled'].map(l => (
                <Tag key={l} tone="slate">{l}</Tag>
              ))}
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: T.orange, letterSpacing: '-0.02em' }}>
              Professional Operating Profile
            </h2>
          </div>
          <div style={{ minWidth: 180, flex: '0 0 180px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.mid, marginBottom: 5 }}>Reflection complete</div>
            <CompletionBar pct={completion} />
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: T.mid, lineHeight: 1.55 }}>
          Understand how you operate, learn, process pressure, and integrate into teams — backed by reflection, resume, portfolio, and ForgeTomorrow intelligence signals.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 240px', gap: 12, alignItems: 'start' }}>

        {/* Form body */}
        <div style={{ ...surface, padding: '16px 18px', display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: T.orange, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
            Required — 10 questions
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
            <SelectField label="Work energy source" value={form.energy} onChange={v => setField('energy',v)} options={[
              { value:'systems',   label:'Systems, processes, and operations' },
              { value:'people',    label:'Helping, advising, and supporting people' },
              { value:'execution', label:'Getting things done and moving work forward' },
              { value:'strategy',  label:'Planning direction and solving complex problems' },
            ]} />
            <SelectField label="Autonomy preference" value={form.autonomy} onChange={v => setField('autonomy',v)} options={[
              { value:'high',   label:'High — give me the outcome and trust me' },
              { value:'medium', label:'Balanced with clear check-ins' },
              { value:'low',    label:'Clear structure and defined steps' },
            ]} />
            <SelectField label="Ambiguity tolerance" value={form.ambiguity} onChange={v => setField('ambiguity',v)} options={[
              { value:'high',   label:'Very comfortable — I build through uncertainty' },
              { value:'medium', label:'Comfortable if priorities are clear' },
              { value:'low',    label:'I prefer stable expectations and scope' },
            ]} />
            <SelectField label="Pressure response" value={form.pressure} onChange={v => setField('pressure',v)} options={[
              { value:'calm',          label:'I get calm and stabilize the situation' },
              { value:'direct',        label:'I make decisions quickly and act' },
              { value:'collaborative', label:'I gather people and coordinate' },
              { value:'reflective',    label:'I pause, assess, and choose carefully' },
            ]} />
            <SelectField label="Communication style" value={form.communication} onChange={v => setField('communication',v)} options={[
              { value:'direct',        label:'Direct, clear, and low-politics' },
              { value:'collaborative', label:'Collaborative and context-rich' },
              { value:'written',       label:'Written, thoughtful, and structured' },
            ]} />
            <SelectField label="Growth focus" value={form.growth} onChange={v => setField('growth',v)} options={[
              { value:'visibility', label:'Being more visible for the value I create' },
              { value:'delegation', label:'Not carrying too much alone' },
              { value:'focus',      label:'Improving focus and reducing overload' },
              { value:'strategy',   label:'Positioning my work more strategically' },
            ]} />
            <SelectField label="Learning style" value={form.learningStyle} onChange={v => setField('learningStyle',v)} options={[
              { value:'hands_on',       label:'Hands-on — work through the real thing' },
              { value:'mentor_guided',  label:'Mentor-guided — show me the pattern first' },
              { value:'documentation',  label:'Documentation-first' },
              { value:'trial_and_error',label:'Trial and error — test and adjust' },
            ]} />
            <SelectField label="Challenge orientation" value={form.challengeStyle} onChange={v => setField('challengeStyle',v)} options={[
              { value:'builder',    label:'Build through it or improve it' },
              { value:'solver',     label:'Diagnose and resolve it' },
              { value:'stabilizer', label:'Calm, organize, and stabilize it' },
              { value:'strategist', label:'Reframe it strategically' },
            ]} />
            <SelectField label="Primary motivation" value={form.motivation} onChange={v => setField('motivation',v)} options={[
              { value:'mission',   label:'Mission — work that matters' },
              { value:'mastery',   label:'Mastery — becoming excellent' },
              { value:'impact',    label:'Impact — meaningful results' },
              { value:'ownership', label:'Ownership — trusted to carry important work' },
              { value:'growth',    label:'Growth — building toward more' },
            ]} />
            <SelectField label="Career hope" value={form.careerHope} onChange={v => setField('careerHope',v)} options={[
              { value:'purpose',   label:'Purpose and meaningful contribution' },
              { value:'stability', label:'Stability and room to breathe' },
              { value:'leadership',label:'Leadership influence and responsibility' },
              { value:'craft',     label:'A stronger craft and deeper expertise' },
              { value:'freedom',   label:'Freedom, autonomy, and self-direction' },
            ]} />
          </div>

          <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: T.mid, paddingBottom: 8, borderBottom: `1px solid ${T.border}`, marginTop: 4 }}>
            Optional — adds depth and specificity
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
            <TextArea label="Recent professional win" value={form.recentWin} onChange={v => setField('recentWin',v)} placeholder="A process improved, a problem solved, a delivery under pressure…" />
            <TextArea label="What drains you" value={form.drain} onChange={v => setField('drain',v)} placeholder="Disconnected leadership, unclear priorities, no ownership…" />
            <TextArea label="Pressure or stress trigger" value={form.stressTrigger} onChange={v => setField('stressTrigger',v)} placeholder="Lack of clarity, unstable leadership, overloaded timelines…" />
            <TextArea label="Support that helps you perform" value={form.supportNeed} onChange={v => setField('supportNeed',v)} placeholder="Clear priorities, mentorship, trust, room to focus…" />
          </div>
          <TextArea label="What are you trying to understand or decide right now?" value={form.goal} onChange={v => setField('goal',v)}
            placeholder="Whether to pivot, lead, specialize, build, or better explain your strengths…" />

          {error && <div style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.07)',
            border: '1px solid rgba(220,38,38,0.20)', color: '#B91C1C', fontSize: 12, fontWeight: 700 }}>{error}</div>}

          <button type="button" onClick={generate} disabled={generating} style={{
            border: 'none', borderRadius: 10, cursor: generating ? 'not-allowed' : 'pointer',
            background: generating ? '#9CA3AF' : T.orange, color: 'white',
            padding: '12px 20px', fontSize: 13, fontWeight: 900,
            boxShadow: generating ? 'none' : '0 3px 12px rgba(255,112,67,0.28)',
            letterSpacing: '-0.01em', alignSelf: 'start',
          }}>
            {generating ? 'Generating…' : 'Generate Profile'}
          </button>
        </div>

        {/* Sidebar — compact */}
        <div style={{ display: 'grid', gap: 8, position: 'sticky', top: 16 }}>
          {[
            { label: 'Output', tone: 'orange', items: ['Operating style classification','Strength signal map','Work style & pressure profile','Business integration guidance','Evidence trail'] },
            { label: 'Evidence model', tone: 'slate', items: ['Self-reflection','Resume signal','Portfolio / about','Project evidence','Operational intelligence'] },
            { label: 'Ground rules', tone: 'green', items: ['Patterns, not labels','Evidence, not assumptions','Guidance, not diagnosis','User control before sharing'] },
          ].map(s => (
            <div key={s.label} style={{ ...card, padding: '12px 14px' }}>
              <Label tone={s.tone}>{s.label}</Label>
              <Bullets items={s.items} tone={s.tone} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Profile view ────────────────────────────────────────────────────────────
  const sigs   = toArr(snapshot?.confidenceSignals);
  const groups = snapshot?.signalGroups || {};
  const why    = snapshot?.why || {};

  return (
    <div style={{ display: 'grid', gap: 0 }}>

      {/* ── COMPACT INTELLIGENCE HEADER ───────────────────────────────────── */}
      <div style={{
        ...surface,
        padding: '16px 20px',
        borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
        borderBottom: `1px solid rgba(255,112,67,0.12)`,
        background: 'rgba(255,255,255,0.75)',
      }}>
        {/* Top row: classification + edit */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.10em', textTransform: 'uppercase',
              color: T.orange, marginBottom: 5 }}>
              Professional Operating Profile · Generated
            </div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: T.dark, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
              {snapshot.operatingStyle}
            </h2>
          </div>
          <button onClick={() => setSnapshot(null)} style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 999,
            border: `1px solid rgba(255,112,67,0.25)`, background: 'rgba(255,112,67,0.07)',
            color: T.orange, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>
            ↩ Edit
          </button>
        </div>

        {/* Summary — one sentence, tight */}
        <p style={{ margin: '0 0 12px', fontSize: 12, color: T.mid, lineHeight: 1.6, maxWidth: 700 }}>
          {snapshot.professionalSummary}
        </p>

        {/* Signal tags — compact row, no duplication */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {toArr(snapshot.strengthSignals).slice(0, 8).map(s => <Tag key={s} tone="orange">{s}</Tag>)}
        </div>
      </div>

      {/* ── TAB NAV ───────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${T.border}`,
        overflowX: 'auto', msOverflowStyle: 'none', scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: '0 0 auto', border: 'none', cursor: 'pointer', background: 'none',
              borderBottom: active ? `2px solid ${T.orange}` : '2px solid transparent',
              padding: '10px 16px',
              fontSize: 11, fontWeight: active ? 900 : 600,
              color: active ? T.orange : T.mid,
              transition: 'color 0.1s, border-color 0.1s',
              whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB BODY ──────────────────────────────────────────────────────── */}
      <div style={{
        ...surface, padding: '16px 18px',
        borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none',
      }}>

        {/* PROFILE TAB */}
        {activeTab === 'snapshot' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              <Block label="The person" tone="slate">
                <Bullets items={snapshot.person || snapshot.personProfile} tone="slate" />
              </Block>
              <Block label="The professional" tone="orange">
                <Bullets items={snapshot.professional || snapshot.professionalProfile} tone="orange" />
              </Block>
            </div>

            {/* Where I thrive — compact tiles */}
            <Block label="Where I thrive" tone="blue" span2>
              <TileGrid items={snapshot.thrivesIn} tone="blue" />
            </Block>

            {/* Confidence signals + signal groups — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              <Block label="Confidence signals" tone="green">
                <div style={{ display: 'grid', gap: 5 }}>
                  {sigs.length
                    ? sigs.map((item, i) => <ConfidenceBadge key={i} item={item} />)
                    : <Bullets items={snapshot.strengthSignals?.slice(0,5)} tone="green" />
                  }
                </div>
              </Block>

              <Block label="Signal groups" tone="slate">
                <div style={{ display: 'grid', gap: 10 }}>
                  {['identity','leadership','execution','environment'].map(key =>
                    toArr(groups[key]).length ? (
                      <div key={key}>
                        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.08em',
                          textTransform: 'uppercase', color: T.light, marginBottom: 5 }}>
                          {key}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {groups[key].map(s => <Tag key={s} tone="slate">{s}</Tag>)}
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
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              <Block label="How I perform best" tone="green">
                <Bullets items={snapshot.howTheyPerformBest} tone="green" />
              </Block>
              <Block label="How I learn" tone="blue">
                <Bullets items={snapshot.learningProfile || snapshot.learningGuidance} tone="blue" />
              </Block>
              <Block label="How I process pressure" tone="amber">
                <Bullets items={snapshot.stressProcessing || snapshot.pressureGuidance} tone="amber" />
              </Block>
              <Block label="Challenge orientation" tone="slate">
                <Bullets items={snapshot.challengeOrientation} tone="slate" />
              </Block>
              <Block label="What motivates me" tone="orange">
                <Bullets items={snapshot.motivationProfile || snapshot.motivationDrivers} tone="orange" />
              </Block>
              <Block label="Career direction" tone="blue">
                <Bullets items={snapshot.careerDirection} tone="blue" />
              </Block>
            </div>
          </div>
        )}

        {/* INTEGRATION TAB */}
        {activeTab === 'business' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <Block label="How to integrate me" tone="green" span2>
              <TileGrid items={snapshot.integrationGuidance} tone="green" />
            </Block>
            <Block label="How to utilize me" tone="orange" span2>
              <TileGrid items={snapshot.roleUtilization} tone="orange" />
            </Block>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              <Block label="Where I may need support" tone="amber">
                <Bullets items={snapshot.supportAreas} tone="amber" />
              </Block>
              <Block label="Audience guidance" tone="slate">
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { role:'Seeker',    key:'seeker',    tone:'orange' },
                    { role:'Coach',     key:'coach',     tone:'blue'   },
                    { role:'Recruiter', key:'recruiter', tone:'green'  },
                  ].map(({ role, key, tone }) =>
                    snapshot?.audienceViews?.[key] ? (
                      <div key={key}>
                        <Label tone={tone}>{role}</Label>
                        <p style={{ margin: 0, fontSize: 12, color: T.slate, lineHeight: 1.5 }}>
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

        {/* EVIDENCE TAB — collapsible, secondary feel */}
        {activeTab === 'evidence' && (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{
              padding: '9px 12px', borderRadius: 8, marginBottom: 4,
              background: 'rgba(255,112,67,0.05)', border: '1px solid rgba(255,112,67,0.12)',
              fontSize: 11, color: T.mid, lineHeight: 1.55,
            }}>
              <strong style={{ color: T.orange }}>Evidence trail.</strong>{' '}
              Every conclusion in this profile is backed by one or more of these sources. Expand any section to inspect the signal.
            </div>
            <EvidenceSection label="Self-reflection" items={why.selfReflection}     tone="orange" defaultOpen={true} />
            <EvidenceSection label="Resume"           items={why.resumeEvidence}     tone="blue"   />
            <EvidenceSection label="Portfolio"        items={why.portfolioEvidence}  tone="slate"  />
            <EvidenceSection label="Projects"         items={why.projectEvidence}    tone="amber"  />
            <EvidenceSection label="Intelligence signals" items={why.intelligenceEvidence} tone="green" />
          </div>
        )}

        {/* SHARE TAB */}
        {activeTab === 'share' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ ...card, padding: '14px 16px', display: 'grid', gap: 12 }}>
              <Label tone="orange">Share controls</Label>
              <p style={{ margin: 0, fontSize: 12, color: T.mid, lineHeight: 1.5 }}>
                Nothing is shared without your explicit choice. You control who sees this profile.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
                {[
                  { key:'showOnPortfolio',       label:'Show on portfolio',        desc:'Visible on your public profile' },
                  { key:'shareWithCoach',         label:'Share with coach',         desc:'Coaches you work with can see this' },
                  { key:'includeInHiringPacket',  label:'Include in hiring packet', desc:'Added to recruiter candidate packets' },
                ].map(({ key, label, desc }) => (
                  <label key={key} style={{
                    ...card, padding: '10px 12px', cursor: 'pointer',
                    border: shareSettings[key] ? '1px solid rgba(255,112,67,0.30)' : `1px solid ${T.border}`,
                    background: shareSettings[key] ? 'rgba(255,112,67,0.04)' : T.white,
                    display: 'flex', flexDirection: 'column', gap: 5,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <input type="checkbox" checked={shareSettings[key]}
                        onChange={e => setShareSettings(p => ({ ...p, [key]: e.target.checked }))}
                        style={{ accentColor: T.orange, width: 13, height: 13 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.dark }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: T.mid, lineHeight: 1.4 }}>{desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && <div style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.07)',
              border: '1px solid rgba(220,38,38,0.20)', color: '#B91C1C', fontSize: 12, fontWeight: 700 }}>{error}</div>}
            {saveMessage && <div style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(22,163,74,0.07)',
              border: '1px solid rgba(22,163,74,0.20)', color: '#15803D', fontSize: 12, fontWeight: 700 }}>{saveMessage}</div>}

            <button type="button" onClick={save} disabled={saving} style={{
              border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
              background: saving ? '#9CA3AF' : T.orange, color: 'white',
              padding: '11px 20px', fontSize: 13, fontWeight: 900, alignSelf: 'start',
              boxShadow: saving ? 'none' : '0 3px 12px rgba(255,112,67,0.28)',
            }}>
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}