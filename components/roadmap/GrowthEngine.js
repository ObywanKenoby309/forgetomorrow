// components/roadmap/GrowthEngine.js
// Growth & Pivot Intelligence Engine
// Same architecture as OfferEngine — two panels, unified intelligence backbone
// Left: resume + direction input | Right: tabbed 30/60/90 roadmap cockpit
import { useState, useCallback, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { ResumeContext } from '@/context/ResumeContext';

const ORANGE = '#FF7043';
const SLATE = '#334155';
const DARK = '#1E293B';

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
  width: '100%', padding: '8px 11px',
  border: '1px solid rgba(0,0,0,0.12)', borderRadius: 9,
  fontSize: 12, color: DARK, background: 'rgba(255,255,255,0.90)',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const SECTION_HDR = {
  padding: '9px 14px',
  background: 'linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))',
  color: 'white', fontWeight: 900, fontSize: 12, letterSpacing: 0.4,
  borderRadius: '12px 12px 0 0',
};

// ─── Direction choice card ─────────────────────────────────────────────────────
function DirectionCard({ value, current, onChange, emoji, label, sub }) {
  const active = current === value;
  return (
    <button type="button" onClick={() => onChange(value)}
      style={{
        padding: '14px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', width: '100%',
        border: `2px solid ${active ? ORANGE : 'rgba(0,0,0,0.10)'}`,
        background: active ? 'rgba(255,112,67,0.07)' : 'rgba(255,255,255,0.80)',
        transition: 'all 0.15s',
      }}>
      <div style={{ fontSize: 20, marginBottom: 5 }}>{emoji}</div>
      <div style={{ fontWeight: 900, fontSize: 13, color: active ? '#C2410C' : DARK, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{sub}</div>
    </button>
  );
}

// ─── Bullet list ───────────────────────────────────────────────────────────────
function BulletList({ items, color }) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!arr.length) return <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>—</div>;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 5 }}>
      {arr.map((x, i) => (
        <li key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: 11, color: SLATE, lineHeight: 1.45 }}>
          <span style={{ color: color || ORANGE, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>•</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Phase section card ────────────────────────────────────────────────────────
function PhaseCard({ data }) {
  if (!data) return <div style={{ fontSize: 12, color: '#94A3B8', padding: 12 }}>No data for this phase.</div>;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {/* Top row: Objectives + Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={{ ...SECTION_HDR, borderRadius: 0, borderTopLeftRadius: 12, borderTopRightRadius: 12, fontSize: 10, background: 'rgba(255,112,67,0.90)' }}>🎯 OBJECTIVES</div>
          <div style={{ padding: '10px 12px' }}><BulletList items={data.objectives} color={ORANGE} /></div>
        </div>
        <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={{ ...SECTION_HDR, borderRadius: 0, borderTopLeftRadius: 12, borderTopRightRadius: 12, fontSize: 10 }}>⚡ ACTIONS</div>
          <div style={{ padding: '10px 12px' }}><BulletList items={data.actions} /></div>
        </div>
      </div>
      {/* Second row: Metrics + Quick Wins */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={{ ...SECTION_HDR, borderRadius: 0, borderTopLeftRadius: 12, borderTopRightRadius: 12, fontSize: 10, background: 'rgba(14,165,233,0.85)' }}>📊 METRICS</div>
          <div style={{ padding: '10px 12px' }}><BulletList items={data.metrics} color='#0EA5E9' /></div>
        </div>
        <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={{ ...SECTION_HDR, borderRadius: 0, borderTopLeftRadius: 12, borderTopRightRadius: 12, fontSize: 10, background: 'rgba(22,163,74,0.85)' }}>🏆 QUICK WINS</div>
          <div style={{ padding: '10px 12px' }}><BulletList items={data.quickWins} color='#16A34A' /></div>
        </div>
      </div>
      {/* Risks */}
      {data.risks?.length > 0 && (
        <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={{ ...SECTION_HDR, borderRadius: 0, borderTopLeftRadius: 12, borderTopRightRadius: 12, fontSize: 10, background: 'rgba(220,38,38,0.80)' }}>⚠️ RISKS</div>
          <div style={{ padding: '10px 12px' }}><BulletList items={data.risks} color='#DC2626' /></div>
        </div>
      )}
      {/* Presentation note */}
      {data.presentation && (
        <div style={{ ...GLASS, padding: '10px 13px', borderLeft: `3px solid ${ORANGE}`, fontSize: 11, color: SLATE, lineHeight: 1.55 }}>
          <div style={{ fontWeight: 800, fontSize: 10, color: ORANGE, marginBottom: 4 }}>HOW TO PRESENT YOURSELF</div>
          {data.presentation}
        </div>
      )}
    </div>
  );
}

// ─── Results cockpit ───────────────────────────────────────────────────────────
const RESULT_TABS = [
  { id: 'day30', label: '30 Days' },
  { id: 'day60', label: '60 Days' },
  { id: 'day90', label: '90 Days' },
  { id: 'growth', label: 'Growth' },
  { id: 'skills', label: 'Skills' },
];

function ResultCockpit({ plan, direction, pivotTarget, onReset, hasResume, isMobile, mobileTab, onMobileTabChange }) {
  const router = useRouter();
  const [tab, setTab] = useState('day30');
  const activeTab = mobileTab || tab;
  const setActiveTab = onMobileTabChange || setTab;

  const handlePrint = () => {
    if (!plan) return;
    const dirLabel = direction === 'compare' ? 'Your Compare Plan'
      : direction === 'pivot' ? `Your Pivot Plan${pivotTarget ? ` — ${pivotTarget}` : ''}`
      : 'Your Stay-the-Course Plan';

    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;

    const listHtml = (items) => {
      const arr = Array.isArray(items) ? items.filter(Boolean) : [];
      if (!arr.length) return '<p style="color:#9ca3af">—</p>';
      return `<ul>${arr.map(i => `<li>${String(i).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</li>`).join('')}</ul>`;
    };

    const phaseHtml = (title, data) => !data ? '' : `
      <section style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:14px 0;page-break-inside:avoid">
        <h2 style="margin:0 0 12px;font-size:18px;font-weight:800;color:#FF7043">${title}</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div><div style="font-weight:800;margin-bottom:6px">Objectives</div>${listHtml(data.objectives)}</div>
          <div><div style="font-weight:800;margin-bottom:6px">Actions</div>${listHtml(data.actions)}</div>
          <div><div style="font-weight:800;margin-bottom:6px">Metrics</div>${listHtml(data.metrics)}</div>
          <div><div style="font-weight:800;margin-bottom:6px">Quick Wins</div>${listHtml(data.quickWins)}</div>
        </div>
        ${data.risks?.length ? `<div style="margin-top:12px"><div style="font-weight:800;color:#DC2626;margin-bottom:6px">Risks</div>${listHtml(data.risks)}</div>` : ''}
        ${data.presentation ? `<div style="margin-top:12px;padding:10px;background:#fff7ed;border-left:3px solid #FF7043;border-radius:6px;font-size:13px">${data.presentation}</div>` : ''}
      </section>`;

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${dirLabel} — ForgeTomorrow</title>
    <style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial;padding:24px;color:#111;line-height:1.5}
    ul{padding-left:18px}li{margin:4px 0}.note{margin-top:14px;padding:12px;border:1px solid #e5e7eb;border-radius:10px;background:#f9fafb;font-size:12.5px}
    @page{margin:12mm}</style></head><body>
    <div style="border-bottom:2px solid #FF7043;padding-bottom:14px;margin-bottom:18px">
      <h1 style="margin:0;color:#FF7043;font-size:26px">${dirLabel}</h1>
      <div style="color:#6b7280;font-size:13px;margin-top:4px">${plan?.meta?.candidate || ''} — Generated ${plan?.meta?.generatedAt ? new Date(plan.meta.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
    </div>
    ${phaseHtml('First 30 Days', plan?.day30)}
    ${phaseHtml('Days 31–60', plan?.day60)}
    ${phaseHtml('Days 61–90', plan?.day90)}
    ${plan?.growthRecommendations?.length ? `<section style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:14px 0"><h2 style="margin:0 0 10px;font-size:18px;font-weight:800">Growth Recommendations</h2>${listHtml(plan.growthRecommendations)}</section>` : ''}
    ${plan?.skillsFocus?.length ? `<section style="border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin:14px 0"><h2 style="margin:0 0 10px;font-size:18px;font-weight:800">Skills Focus</h2>${listHtml(plan.skillsFocus)}</section>` : ''}
    <div class="note"><strong>ForgeTomorrow Guidance Note:</strong> AI-assisted guidance grounded in your resume evidence. Not a substitute for live coaching or mentorship. Work with a coach through The Hearth to refine your strategy.</div>
    </body></html>`;

    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch {} }, 250);
  };

  // Action bar
  const ActionBar = () => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
      <button type="button" onClick={handlePrint}
        style={{ padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer', background: ORANGE, color: 'white', border: 'none' }}>
        📄 Print Brief
      </button>
      <button type="button" onClick={() => router.push('/the-hearth?module=mentorship')}
        style={{ padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer', background: 'rgba(255,255,255,0.85)', color: SLATE, border: '1px solid rgba(0,0,0,0.12)' }}>
        🤝 Find a Coach
      </button>
      <button type="button" onClick={() => router.push('/calendar')}
        style={{ padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer', background: 'rgba(255,255,255,0.85)', color: SLATE, border: '1px solid rgba(0,0,0,0.12)' }}>
        📅 Open Calendar
      </button>
      <button type="button" onClick={onReset}
        style={{ padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'transparent', color: '#94A3B8', border: '1px solid rgba(0,0,0,0.08)', marginLeft: 'auto' }}>
        Start Over
      </button>
    </div>
  );

  // Tab bar
  const TabBar = () => (
    <div style={{ display: 'flex', gap: 2, marginBottom: 10, background: 'rgba(0,0,0,0.06)', borderRadius: 10, padding: 3 }}>
      {RESULT_TABS.map(t => (
        <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
          style={{ flex: 1, padding: '7px 6px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
            border: 'none', background: activeTab === t.id ? 'white' : 'transparent',
            color: activeTab === t.id ? ORANGE : '#64748B',
            boxShadow: activeTab === t.id ? '0 2px 6px rgba(0,0,0,0.10)' : 'none',
            transition: 'all 0.15s' }}>
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, animation: 'fadeSlideIn 0.3s ease forwards', height: '100%' }}>
      <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Resume connection banner */}
      {hasResume ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 8,
          background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.20)', marginBottom: 8 }}>
          <span style={{ fontSize: 11 }}>✅</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#15803D' }}>Roadmap grounded in verified resume evidence via ForgeTomorrow intelligence engine.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 8,
          background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', marginBottom: 8 }}>
          <span style={{ fontSize: 11 }}>⚠️</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E' }}>Using self-reported inputs only. Connect your resume to strengthen roadmap accuracy.</span>
        </div>
      )}

      {/* Sticky action + tab bar */}
      <div style={{ position: isMobile ? 'static' : 'sticky', top: 0, zIndex: 10, background: 'transparent', paddingBottom: 2 }}>
        <ActionBar />
        <TabBar />
      </div>

      {/* Tab content */}
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: 2, paddingBottom: isMobile ? 80 : 0 }}>
        {activeTab === 'day30' && <PhaseCard data={plan?.day30} />}
        {activeTab === 'day60' && <PhaseCard data={plan?.day60} />}
        {activeTab === 'day90' && <PhaseCard data={plan?.day90} />}
        {activeTab === 'growth' && (
          <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
            <div style={SECTION_HDR}>📈 GROWTH RECOMMENDATIONS</div>
            <div style={{ padding: '12px 14px' }}><BulletList items={plan?.growthRecommendations} /></div>
          </div>
        )}
        {activeTab === 'skills' && (
          <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
            <div style={SECTION_HDR}>🧠 SKILLS FOCUS</div>
            <div style={{ padding: '12px 14px' }}><BulletList items={plan?.skillsFocus} /></div>
          </div>
        )}

        {/* Mentor CTA */}
        <div style={{ ...GLASS, padding: '12px 14px', borderLeft: `3px solid ${ORANGE}`, marginTop: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 12, color: ORANGE, marginBottom: 5 }}>🤝 Bring a Human Mentor In</div>
          <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.55, marginBottom: 8 }}>
            A coach can pressure-test your plan, sharpen your positioning, and keep you accountable to the timeline.
          </div>
          <button type="button" onClick={() => router.push('/the-hearth?module=mentorship')}
            style={{ padding: '7px 14px', background: ORANGE, color: 'white', borderRadius: 8, fontWeight: 900, fontSize: 11, border: 'none', cursor: 'pointer' }}>
            Find a Growth Coach on The Hearth →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main GrowthEngine ─────────────────────────────────────────────────────────
export default function GrowthEngine() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const withChrome = (path) => chrome ? `${path}${path.includes('?') ? '&' : '?'}chrome=${chrome}` : path;

  // Pull from ResumeContext — same as Forge Hammer
  const {
    formData = {},
    summary = '',
    experiences = [],
    skills = [],
    educationList = [],
  } = useContext(ResumeContext) || {};

  const hasResume = !!(summary?.trim() || experiences?.length > 0 || skills?.length > 0 || formData?.fullName || formData?.name);

  // Resume list for selector
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [loadingResumes, setLoadingResumes] = useState(false);

  // Direction
  const [direction, setDirection] = useState('compare');
  const [pivotTarget, setPivotTarget] = useState('');

  // Plan state
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mobile
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState('day30');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Load resume list
  useEffect(() => {
    let active = true;
    setLoadingResumes(true);
    fetch('/api/resume/list')
      .then(r => r.json())
      .then(data => {
        if (!active) return;
        const list = Array.isArray(data?.resumes) ? data.resumes : [];
        setResumes(list);
        const primary = list.find(r => r?.isPrimary);
        const first = list[0];
        setSelectedResumeId(String(primary?.id || first?.id || ''));
      })
      .catch(() => { if (active) setResumes([]); })
      .finally(() => { if (active) setLoadingResumes(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => { if (direction !== 'pivot') setPivotTarget(''); }, [direction]);

  const handleGenerate = async () => {
    if (!selectedResumeId) { setError('Please select a resume.'); return; }
    if (direction === 'pivot' && !pivotTarget.trim()) { setError('Tell us what you want to pivot into.'); return; }

    setLoading(true); setError(''); setPlan(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const body = { resumeId: selectedResumeId, direction };
      if (direction === 'pivot') body.pivotTarget = pivotTarget.trim();

      const res = await fetch('/api/anvil/onboarding-growth/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403 && data?.error === 'free_limit_reached') {
        throw new Error("You've used your free Growth plan. Upgrade to Seeker Pro for unlimited access.");
      }
      if (!res.ok) throw new Error(data?.error || `Failed to generate plan (${res.status})`);
      if (!data?.plan) throw new Error('No plan returned from server.');

      setPlan(data.plan);
    } catch (e) {
      setError(e?.name === 'AbortError' ? 'Generation timed out. Please try again.' : String(e?.message || 'Something went wrong.'));
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  const handleReset = () => { setPlan(null); setError(''); setDirection('compare'); setPivotTarget(''); setMobileTab('day30'); };

  const directionLabel = { compare: 'Compare Plan', grow: 'Stay-the-Course Plan', pivot: `Pivot Plan${pivotTarget ? ` — ${pivotTarget}` : ''}` };

  // ─── INPUT PANEL ────────────────────────────────────────────────────────────
  const InputPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Resume connection banner */}
      {hasResume ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 10,
          background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.25)' }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>✅</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', lineHeight: 1.4 }}>
            Roadmap grounded in verified experience and impact evidence.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 13px', borderRadius: 10,
          background: 'rgba(234,179,8,0.10)', border: '1px solid rgba(234,179,8,0.30)' }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', lineHeight: 1.4 }}>
              Using self-reported inputs only. Connect your resume for deeper roadmap intelligence.
            </div>
            <a href={withChrome('/resume/create')} style={{ fontSize: 10, color: ORANGE, fontWeight: 800, textDecoration: 'underline' }}>
              Open Resume Builder →
            </a>
          </div>
        </div>
      )}

      {/* Resume selector */}
      <div style={{ ...GLASS, overflow: 'hidden' }}>
        <div style={SECTION_HDR}>📄 SELECT RESUME</div>
        <div style={{ padding: '12px 14px' }}>
          {loadingResumes ? (
            <div style={{ fontSize: 12, color: '#64748B' }}>Loading your resumes…</div>
          ) : resumes.length === 0 ? (
            <div style={{ fontSize: 12, color: '#DC2626', lineHeight: 1.5 }}>
              No resumes found.{' '}
              <a href={withChrome('/resume/create')} style={{ color: ORANGE, fontWeight: 800, textDecoration: 'underline' }}>Build one →</a>
            </div>
          ) : (
            <select value={selectedResumeId} onChange={e => setSelectedResumeId(e.target.value)}
              style={{ ...INPUT, fontSize: 12 }}>
              <option value="">Choose a resume…</option>
              {resumes.map(r => (
                <option key={r.id} value={r.id}>
                  {r?.name || r?.title || `Resume from ${new Date(r.createdAt).toLocaleDateString()}`}
                  {r?.isPrimary ? ' ★' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Direction cards */}
      <div style={{ ...GLASS, overflow: 'hidden' }}>
        <div style={SECTION_HDR}>🧭 WHICH PATH ARE YOU CONSIDERING?</div>
        <div style={{ padding: '12px 14px', display: 'grid', gap: 8 }}>
          <DirectionCard value="compare" current={direction} onChange={setDirection}
            emoji="🤔" label="Not sure yet"
            sub="Compare staying the course vs pivot options — see what you're missing for each path." />
          <DirectionCard value="grow" current={direction} onChange={setDirection}
            emoji="📈" label="Stay the Course"
            sub="You like where you are. Increase your market value and map the next level." />
          <DirectionCard value="pivot" current={direction} onChange={setDirection}
            emoji="🔀" label="Pivot"
            sub="You want to change direction. Tell us where and we'll compare it to your resume." />

          {direction === 'pivot' && (
            <div style={{ marginTop: 4, animation: 'fadeSlideIn 0.2s ease' }}>
              <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 11, color: '#475569', marginBottom: 5 }}>
                What do you want to pivot into?
              </label>
              <input value={pivotTarget} onChange={e => setPivotTarget(e.target.value)}
                placeholder="e.g. Product Manager, Customer Success Director, Recruiter Ops…"
                style={INPUT} />
              <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                The evidence engine will compare your resume to this target and identify the gaps.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '9px 12px', background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, fontSize: 11, color: '#DC2626', fontWeight: 700 }}>
          {error}
        </div>
      )}

      {/* Generate button */}
      <button type="button" onClick={handleGenerate}
        disabled={loading || !selectedResumeId}
        style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: loading || !selectedResumeId ? 'not-allowed' : 'pointer',
          background: loading || !selectedResumeId ? '#9CA3AF' : ORANGE, color: 'white', fontWeight: 900, fontSize: 14,
          boxShadow: loading || !selectedResumeId ? 'none' : '0 4px 14px rgba(255,112,67,0.40)',
          transition: 'all 0.2s' }}>
        {loading ? '🧠 Generating your roadmap…' : `Generate My ${directionLabel[direction]}`}
      </button>

      {loading && (
        <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center' }}>
          Running evidence engine + building your 30/60/90 plan. This can take up to 45 seconds.
        </div>
      )}

      {/* What you get preview */}
      <div style={{ ...WHITE_CARD, padding: '10px 12px' }}>
        <div style={{ fontWeight: 800, fontSize: 10, color: SLATE, marginBottom: 7, letterSpacing: 0.3 }}>YOUR ROADMAP INCLUDES</div>
        {['📅 30/60/90 day plan with objectives, actions, and metrics', '🏆 Quick wins for each phase', '⚠️ Risks to watch', '📈 Growth recommendations', '🧠 Skills to focus on', '🤝 Mentor escalation paths'].map((item, i) => (
          <div key={i} style={{ fontSize: 10, color: '#64748B', padding: '3px 0', borderBottom: i < 5 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>{item}</div>
        ))}
      </div>
    </div>
  );

  // ─── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    if (plan) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <ResultCockpit plan={plan} direction={direction} pivotTarget={pivotTarget}
            onReset={handleReset} hasResume={hasResume}
            isMobile={true} mobileTab={mobileTab} onMobileTabChange={setMobileTab} />
          {/* Sticky bottom tab nav */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
            background: 'rgba(255,255,255,0.95)', borderTop: '1px solid rgba(0,0,0,0.10)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', padding: '8px 16px 12px' }}>
            {[
              { id: 'day30', emoji: '📅', label: '30 Days' },
              { id: 'day60', emoji: '📅', label: '60 Days' },
              { id: 'day90', emoji: '📅', label: '90 Days' },
              { id: 'growth', emoji: '📈', label: 'Growth' },
              { id: 'skills', emoji: '🧠', label: 'Skills' },
            ].map(t => (
              <button key={t.id} type="button" onClick={() => setMobileTab(t.id)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <span style={{ fontSize: 16 }}>{t.emoji}</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: mobileTab === t.id ? ORANGE : '#94A3B8' }}>{t.label}</span>
                {mobileTab === t.id && <div style={{ width: 16, height: 2, borderRadius: 1, background: ORANGE }} />}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        <InputPanel />
      </div>
    );
  }

  // ─── DESKTOP LAYOUT ─────────────────────────────────────────────────────────
  if (plan) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,300px) minmax(0,1fr)', gap: 12, alignItems: 'stretch', width: '100%', gridAutoRows: '1fr' }}>
        <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ position: 'sticky', top: 16, alignSelf: 'start' }}>
          {/* Plan summary left panel */}
          <div style={{ ...GLASS, overflow: 'hidden' }}>
            <div style={SECTION_HDR}>📋 YOUR PLAN</div>
            <div style={{ padding: '14px', display: 'grid', gap: 8 }}>
              {[
                ['Direction', direction === 'compare' ? 'Compare: Stay vs Pivot' : direction === 'grow' ? 'Stay the Course' : `Pivot → ${pivotTarget}`],
                ['Resume', resumes.find(r => String(r.id) === String(selectedResumeId))?.name || 'Selected resume'],
                ['Generated', plan?.meta?.generatedAt ? new Date(plan?.meta?.generatedAt).toLocaleDateString() : new Date().toLocaleDateString()],
                ['Candidate', plan?.meta?.candidate || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 6, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', paddingTop: 1 }}>{k.toUpperCase()}</div>
                  <div style={{ fontSize: 11, color: SLATE, fontWeight: 600, lineHeight: 1.4 }}>{v}</div>
                </div>
              ))}
              {plan?.meta?.headline && (
                <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5, fontStyle: 'italic', paddingTop: 4 }}>{plan.meta.headline}</div>
              )}
              <button type="button" onClick={handleReset}
                style={{ marginTop: 4, padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  background: 'rgba(255,112,67,0.08)', color: ORANGE, border: `1px solid rgba(255,112,67,0.25)` }}>
                ✏️ New Roadmap
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ResultCockpit plan={plan} direction={direction} pivotTarget={pivotTarget}
            onReset={handleReset} hasResume={hasResume} isMobile={false} />
        </div>
      </div>
    );
  }

  // Loading state desktop
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,300px) minmax(0,1fr)', gap: 12, width: '100%' }}>
        <InputPanel />
        <div style={{ ...GLASS, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 14 }}>🧠</div>
          <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 6 }}>Building your roadmap…</div>
          <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
            Running evidence engine. Analyzing resume signals. Building your 30/60/90 plan.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
        </div>
      </div>
    );
  }

  // Input state desktop
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)', gap: 12, alignItems: 'start', width: '100%' }}>
      <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <InputPanel />
      {/* Right: preview of what is coming */}
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ ...GLASS, padding: '16px 14px', background: 'rgba(30,41,59,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ fontWeight: 900, fontSize: 14, color: ORANGE, marginBottom: 6 }}>🧠 Growth & Pivot Engine</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', lineHeight: 1.6 }}>
            Powered by Human-Centered Career Intelligence focused on your success. Your resume evidence drives the plan — not generic keyword advice.
          </div>
        </div>
        <div style={{ ...WHITE_CARD, padding: '12px 14px' }}>
          <div style={{ fontWeight: 800, fontSize: 10, color: SLATE, marginBottom: 8, letterSpacing: 0.3 }}>THREE MODES</div>
          {[
            ['🤔 Compare', 'Not sure? See staying vs pivoting side by side. Costs, gaps, implications.'],
            ['📈 Stay', 'Increase your market value. Map the next level from where you are.'],
            ['🔀 Pivot', 'Target a specific role. See the exact gaps between now and there.'],
          ].map(([label, desc]) => (
            <div key={label} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: DARK, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}