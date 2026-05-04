// components/offer-negotiation/OfferEngine.js
// Command center — two panels, one state
// Left: step form | Right: context accumulator + results
// Designed to inlay inside the Anvil tile system
import { useState, useCallback, useEffect } from 'react';

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
  width: '100%',
  padding: '8px 11px',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 9,
  fontSize: 12,
  color: DARK,
  background: 'rgba(255,255,255,0.90)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const LABEL = {
  display: 'block',
  fontWeight: 700,
  fontSize: 11,
  color: '#475569',
  marginBottom: 4,
};

const SECTION_HDR = {
  padding: '9px 14px',
  background: 'linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))',
  color: 'white',
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: 0.4,
  borderRadius: '12px 12px 0 0',
};

const priorityOptions = [
  { value: '', label: 'Select priority' },
  { value: 'base_salary', label: 'Base salary' },
  { value: 'total_comp', label: 'Total compensation' },
  { value: 'equity', label: 'Equity / ownership' },
  { value: 'sign_on', label: 'Sign-on bonus' },
  { value: 'bonus', label: 'Annual bonus' },
  { value: 'remote_flex', label: 'Remote / flexibility' },
  { value: 'title_level', label: 'Title / level' },
  { value: 'growth', label: 'Growth / mentorship' },
  { value: 'benefits', label: 'Benefits (health, PTO)' },
  { value: 'start_date', label: 'Start date' },
  { value: 'stability', label: 'Stability / risk profile' },
];

const INITIAL_FORM = {
  jobDescription: '', currentJobTitle: '', currentSalary: '', isNewJob: 'yes',
  location: '', targetSalaryMin: '', targetSalaryMax: '', desiredBenefits: '',
  jobType: '', industry: '', skillsCertsExperience: '', yearsRelevantExperience: '',
  portfolioLinks: '', notableProjectsEvidence: '', hasOffer: 'no',
  offerCompany: '', offerRoleTitle: '', offerBaseSalary: '', offerBonus: '',
  offerSignOn: '', offerEquity: '', offerBenefitsNotes: '', offerDeadline: '',
  offerWorkMode: '', offerOtherComp: '', competingOffers: 'no',
  competingOffersCount: '', bestAlternativeNotes: '', preferredWorkMode: '',
  willingnessToRelocate: 'no', mustHaves: '', dealBreakers: '',
  topPriority: '', secondPriority: '', thirdPriority: '', desiredStartDate: '',
  confidenceLevel: '',
};

// ─── Micro-insight engine ─────────────────────────────────────────────────────
function getMicroInsight(step, form) {
  if (step === 1) {
    const role = (form.jobDescription || '').trim();
    const loc = (form.location || '').trim();
    if (!role && !loc) return null;
    const parts = [];
    if (role) parts.push(`targeting a role in ${role.split(' ').slice(0, 4).join(' ')}`);
    if (loc) parts.push(`based in ${loc}`);
    return `You're ${parts.join(', ')}. We'll factor market conditions for this context into your strategy.`;
  }
  if (step === 2) {
    const base = Number(form.offerBaseSalary || 0);
    const current = Number(form.currentSalary || 0);
    if (form.hasOffer === 'yes' && base > 0 && current > 0) {
      const delta = Math.round(((base - current) / current) * 100);
      if (delta > 15) return `This offer is ${delta}% above your current salary — negotiate from confidence.`;
      if (delta > 0) return `This offer is ${delta}% above your current salary. Room to push — framing matters.`;
      if (delta === 0) return `The offer matches your current salary. Lateral move — lead with your evidence.`;
      return `This offer is ${Math.abs(delta)}% below your current salary. We'll build your pushback.`;
    }
    if (form.hasOffer === 'no') return `No offer yet — building a proactive target based on your position.`;
    return null;
  }
  if (step === 3) {
    const years = Number(form.yearsRelevantExperience || 0);
    const hasCompeting = form.competingOffers === 'yes';
    const hasImpact = (form.notableProjectsEvidence || '').trim().length > 30;
    let score = 0;
    if (years >= 8) score += 3;
    else if (years >= 4) score += 2;
    else if (years >= 1) score += 1;
    if (hasCompeting) score += 3;
    if (hasImpact) score += 2;
    if (score >= 6) return `Strong leverage. Competing offers and proven impact give you real negotiating power.`;
    if (score >= 3) return `Moderate leverage. Evidence and framing will be your strongest tools going in.`;
    return `Developing leverage. We'll build the most honest path forward from what you have.`;
  }
  if (step === 4) {
    const confidence = form.confidenceLevel;
    if (confidence === 'low') return `Low confidence noted — we'll build a clear anchor and script so you know exactly what to say.`;
    if (confidence === 'high') return `High confidence. Optimizing your ambitious path with language to hold firm.`;
    if (form.topPriority) {
      const map = { base_salary: 'base salary', total_comp: 'total comp', equity: 'equity', sign_on: 'sign-on', remote_flex: 'remote flexibility', growth: 'growth' };
      if (map[form.topPriority]) return `Optimizing for ${map[form.topPriority]}. Ready to generate your strategy.`;
    }
    return `Decision rules set. Hit Generate Strategy when ready.`;
  }
  return null;
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      {label && <label style={LABEL}>{label}</label>}
      {children}
    </div>
  );
}

function ChoiceCard({ value, current, name, onChange, emoji, label, sub }) {
  const active = current === value;
  return (
    <button type="button"
      onClick={() => onChange({ target: { name, value } })}
      style={{
        padding: '12px 10px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
        border: `2px solid ${active ? ORANGE : 'rgba(0,0,0,0.10)'}`,
        background: active ? 'rgba(255,112,67,0.07)' : 'rgba(255,255,255,0.80)',
        transition: 'all 0.15s',
      }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontWeight: 900, fontSize: 12, color: active ? '#C2410C' : DARK }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
    </button>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────
function Step1({ form, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div>
        <div style={{ fontWeight: 900, fontSize: 13, color: DARK, marginBottom: 8 }}>What are we negotiating?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ChoiceCard value="yes" current={form.isNewJob} name="isNewJob" onChange={onChange} emoji="🆕" label="New Job Offer" sub="I received or expect an offer" />
          <ChoiceCard value="no" current={form.isNewJob} name="isNewJob" onChange={onChange} emoji="📈" label="Raise / Promotion" sub="I want more in my current role" />
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 12, color: DARK, marginBottom: 4 }}>Tell me about the role</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>Paste the JD or describe what you are targeting</div>
        <textarea name="jobDescription" value={form.jobDescription} onChange={onChange} rows={4}
          placeholder="e.g. Strategic Advisory Services Manager at CrowdStrike — leads consultants, manages engagements, executive stakeholder communication..."
          style={{ ...INPUT, resize: 'vertical', lineHeight: 1.55 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Location"><input name="location" value={form.location} onChange={onChange} placeholder="City, State or Remote" style={INPUT} /></Field>
        <Field label="Industry">
          <select name="industry" value={form.industry} onChange={onChange} style={INPUT}>
            <option value="">Industry (optional)</option>
            {['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Government', 'Nonprofit', 'Other'].map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
}

function Step2({ form, onChange }) {
  const hasOffer = form.hasOffer === 'yes';
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div>
        <div style={{ fontWeight: 900, fontSize: 13, color: DARK, marginBottom: 8 }}>Do you have an offer in hand?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ChoiceCard value="yes" current={form.hasOffer} name="hasOffer" onChange={onChange} emoji="📄" label="Yes — offer in hand" sub="I have written or verbal terms" />
          <ChoiceCard value="no" current={form.hasOffer} name="hasOffer" onChange={onChange} emoji="🎯" label="Not yet" sub="Building strategy in advance" />
        </div>
      </div>
      {hasOffer && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: SLATE, borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: 6 }}>What did they offer?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Company"><input name="offerCompany" value={form.offerCompany} onChange={onChange} placeholder="Company name" style={INPUT} /></Field>
            <Field label="Offered Title"><input name="offerRoleTitle" value={form.offerRoleTitle} onChange={onChange} placeholder="e.g. Senior Manager" style={INPUT} /></Field>
            <Field label="Base Salary ($)"><input name="offerBaseSalary" value={form.offerBaseSalary} onChange={onChange} type="number" min="0" placeholder="120000" style={INPUT} /></Field>
            <Field label="Annual Bonus"><input name="offerBonus" value={form.offerBonus} onChange={onChange} placeholder="10% or $12,000" style={INPUT} /></Field>
            <Field label="Sign-on ($) optional"><input name="offerSignOn" value={form.offerSignOn} onChange={onChange} type="number" min="0" placeholder="0" style={INPUT} /></Field>
            <Field label="Equity optional"><input name="offerEquity" value={form.offerEquity} onChange={onChange} placeholder="0.05%, 10k RSUs..." style={INPUT} /></Field>
            <Field label="Work Mode">
              <select name="offerWorkMode" value={form.offerWorkMode} onChange={onChange} style={INPUT}>
                <option value="">Select</option>
                <option value="on-site">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </Field>
            <Field label="Deadline optional"><input name="offerDeadline" value={form.offerDeadline} onChange={onChange} placeholder="Friday EOD, Jan 15..." style={INPUT} /></Field>
          </div>
          <Field label="Benefits and Other Terms optional">
            <textarea name="offerBenefitsNotes" value={form.offerBenefitsNotes} onChange={onChange} rows={2}
              placeholder="PTO, health coverage, 401k match, remote stipend..." style={{ ...INPUT, resize: 'vertical' }} />
          </Field>
        </div>
      )}
      {!hasOffer && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: SLATE, borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: 6 }}>What are you targeting?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label="Target Min ($)"><input name="targetSalaryMin" value={form.targetSalaryMin} onChange={onChange} type="number" min="0" placeholder="100000" style={INPUT} /></Field>
            <Field label="Target Max ($)"><input name="targetSalaryMax" value={form.targetSalaryMax} onChange={onChange} type="number" min="0" placeholder="130000" style={INPUT} /></Field>
          </div>
        </div>
      )}
      <Field label="Your Current Salary ($)">
        <input name="currentSalary" value={form.currentSalary} onChange={onChange} type="number" min="0" placeholder="95000" style={INPUT} />
      </Field>
    </div>
  );
}

function Step3({ form, onChange }) {
  const hasCompeting = form.competingOffers === 'yes';
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="Current Job Title"><input name="currentJobTitle" value={form.currentJobTitle} onChange={onChange} placeholder="e.g. Director, Advisory" style={INPUT} /></Field>
        <Field label="Years Experience"><input name="yearsRelevantExperience" value={form.yearsRelevantExperience} onChange={onChange} type="number" min="0" placeholder="8" style={INPUT} /></Field>
      </div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 12, color: DARK, marginBottom: 4 }}>What have you actually delivered?</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>Your strongest proof of impact — be specific</div>
        <textarea name="notableProjectsEvidence" value={form.notableProjectsEvidence} onChange={onChange} rows={3}
          placeholder="e.g. Led 50+ agents managing $25M accounts. Built SOP library cutting onboarding 40%. SLA from 78% to 94%..."
          style={{ ...INPUT, resize: 'vertical', lineHeight: 1.55 }} />
      </div>
      <Field label="Credentials and Certifications optional">
        <input name="skillsCertsExperience" value={form.skillsCertsExperience} onChange={onChange} placeholder="e.g. CISSP, PMP, ITIL V4, MBA..." style={INPUT} />
      </Field>
      <div>
        <div style={{ fontWeight: 900, fontSize: 12, color: DARK, marginBottom: 8 }}>Competing offers?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <ChoiceCard value="yes" current={form.competingOffers} name="competingOffers" onChange={onChange} emoji="⚡" label="Yes — I have alternatives" sub="This gives you real leverage" />
          <ChoiceCard value="no" current={form.competingOffers} name="competingOffers" onChange={onChange} emoji="🎯" label="No competing offers" sub="We'll build from evidence" />
        </div>
      </div>
      {hasCompeting && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Field label="How many?"><input name="competingOffersCount" value={form.competingOffersCount} onChange={onChange} type="number" min="1" placeholder="2" style={INPUT} /></Field>
          <Field label="Best alternative"><input name="bestAlternativeNotes" value={form.bestAlternativeNotes} onChange={onChange} placeholder="e.g. $130k, remote, Series B" style={INPUT} /></Field>
        </div>
      )}
    </div>
  );
}

function Step4({ form, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div>
        <div style={{ fontWeight: 900, fontSize: 12, color: DARK, marginBottom: 4 }}>What matters most?</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>Pick your top 3 in order</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {['topPriority', 'secondPriority', 'thirdPriority'].map((name, i) => (
            <div key={name}>
              <label style={{ ...LABEL, fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>#{i + 1}</label>
              <select name={name} value={form[name]} onChange={onChange} style={{ ...INPUT, fontSize: 11 }}>
                {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 12, color: DARK, marginBottom: 4 }}>What must this offer include?</div>
        <textarea name="mustHaves" value={form.mustHaves} onChange={onChange} rows={2}
          placeholder="e.g. minimum $115k base, remote 3+ days/week, health coverage..." style={{ ...INPUT, resize: 'vertical' }} />
      </div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 12, color: DARK, marginBottom: 4 }}>What would you refuse even if everything else was perfect?</div>
        <textarea name="dealBreakers" value={form.dealBreakers} onChange={onChange} rows={2}
          placeholder="e.g. mandatory relocation, on-call requirements, below $95k..." style={{ ...INPUT, resize: 'vertical' }} />
      </div>
      <div>
        <div style={{ fontWeight: 900, fontSize: 12, color: DARK, marginBottom: 4 }}>What would make this a great offer?</div>
        <input name="desiredBenefits" value={form.desiredBenefits} onChange={onChange}
          placeholder="Remote stipend, extra PTO, education budget, equity upside..." style={INPUT} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#475569', marginBottom: 5 }}>Willing to relocate?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
            {[{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }].map(o => (
              <button key={o.v} type="button" onClick={() => onChange({ target: { name: 'willingnessToRelocate', value: o.v } })}
                style={{ padding: '7px 4px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
                  border: `1.5px solid ${form.willingnessToRelocate === o.v ? ORANGE : 'rgba(0,0,0,0.10)'}`,
                  background: form.willingnessToRelocate === o.v ? 'rgba(255,112,67,0.08)' : 'rgba(255,255,255,0.80)',
                  color: form.willingnessToRelocate === o.v ? '#C2410C' : SLATE }}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
        <Field label="Desired start date">
          <input name="desiredStartDate" value={form.desiredStartDate} onChange={onChange} placeholder="ASAP, 2 weeks..." style={INPUT} />
        </Field>
      </div>
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 12 }}>
        <div style={{ fontWeight: 900, fontSize: 12, color: DARK, marginBottom: 8 }}>How confident are you going in?</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[
            { value: 'low', emoji: '😬', label: 'Not confident', sub: 'Need all the help I can get' },
            { value: 'medium', emoji: '🤔', label: 'Somewhat', sub: 'Know my value, feel unsure' },
            { value: 'high', emoji: '💪', label: 'Very confident', sub: 'Know exactly what I want' },
          ].map(opt => (
            <button key={opt.value} type="button"
              onClick={() => onChange({ target: { name: 'confidenceLevel', value: opt.value } })}
              style={{ padding: '10px 6px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                border: `2px solid ${form.confidenceLevel === opt.value ? ORANGE : 'rgba(0,0,0,0.10)'}`,
                background: form.confidenceLevel === opt.value ? 'rgba(255,112,67,0.07)' : 'rgba(255,255,255,0.80)',
                transition: 'all 0.15s' }}>
              <div style={{ fontSize: 18, marginBottom: 3 }}>{opt.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 10, color: form.confidenceLevel === opt.value ? '#C2410C' : DARK }}>{opt.label}</div>
              <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 2, lineHeight: 1.3 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step }) {
  const steps = [{ n: 1, label: 'Target' }, { n: 2, label: 'Situation' }, { n: 3, label: 'Leverage' }, { n: 4, label: 'Rules' }];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: step >= s.n ? ORANGE : 'rgba(255,255,255,0.25)',
              border: `2px solid ${step >= s.n ? ORANGE : 'rgba(255,255,255,0.20)'}`,
              color: step >= s.n ? 'white' : 'rgba(255,255,255,0.40)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 10, transition: 'all 0.3s ease',
              boxShadow: step === s.n ? `0 0 0 3px rgba(255,112,67,0.25)` : 'none',
            }}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: step >= s.n ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, margin: '0 3px', marginBottom: 14, background: step > s.n ? ORANGE : 'rgba(255,255,255,0.18)', transition: 'background 0.3s ease' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Results renderer ─────────────────────────────────────────────────────────
function ResultsPanel({ plan, onReset }) {
  function safeArr(v) { return Array.isArray(v) ? v.filter(Boolean) : []; }
  const BulletList = ({ items }) => (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
      {safeArr(items).map((x, i) => (
        <li key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11, color: SLATE, lineHeight: 1.45 }}>
          <span style={{ color: ORANGE, fontWeight: 900, flexShrink: 0 }}>•</span><span>{x}</span>
        </li>
      ))}
    </ul>
  );
  const Sec = ({ title, children }) => (
    <div style={{ ...WHITE_CARD, overflow: 'hidden', marginBottom: 8 }}>
      <div style={SECTION_HDR}>{title}</div>
      <div style={{ padding: '10px 12px' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 0 }}>
      <style>{`@keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Decision card */}
      {plan?.decision && (
        <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 6px 20px rgba(255,112,67,0.22)', marginBottom: 8 }}>
          <div style={{ padding: '12px 14px', background: 'linear-gradient(135deg, rgba(255,112,67,0.95), rgba(234,88,12,0.90))', color: 'white' }}>
            <div style={{ fontWeight: 900, fontSize: 9, letterSpacing: 0.5, opacity: 0.80, marginBottom: 3 }}>RECOMMENDED MOVE</div>
            <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: -0.5, marginBottom: 4 }}>{plan.decision.recommendedMove}</div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.92, lineHeight: 1.5 }}>{plan.decision.oneLineSummary}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.96)', padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', marginBottom: 2, letterSpacing: 0.5 }}>LEVERAGE</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: plan.decision.leverageBand === 'Strong' ? '#16A34A' : plan.decision.leverageBand === 'Moderate' ? '#D97706' : '#DC2626' }}>
                {plan.decision.leverageBand}
                {plan.decision.leverageScore != null && <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', marginLeft: 3 }}>({plan.decision.leverageScore}/10)</span>}
              </div>
            </div>
            {[['RISK', plan.decision.riskLevel, '#64748B'], ['TARGET', plan.decision.targetAsk, ORANGE], ['FLOOR', plan.decision.fallbackFloor, '#475569']].map(([l, v, c]) => (
              <div key={l}><div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', marginBottom: 2, letterSpacing: 0.5 }}>{l}</div><div style={{ fontSize: 12, fontWeight: 900, color: c }}>{v || '—'}</div></div>
            ))}
          </div>
          {safeArr(plan.decision.leverageDrivers).length > 0 && (
            <div style={{ background: 'rgba(248,250,252,0.96)', padding: '7px 12px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B' }}>DRIVEN BY:</span>
              {plan.decision.leverageDrivers.map((d, i) => <span key={i} style={{ fontSize: 10, fontWeight: 600, color: '#475569', background: 'white', padding: '1px 7px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.10)' }}>{d}</span>)}
            </div>
          )}
          {safeArr(plan.decision.doNotTradeAway).length > 0 && (
            <div style={{ background: 'rgba(254,243,199,0.90)', padding: '7px 12px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#92400E' }}>PROTECT:</span>
              {plan.decision.doNotTradeAway.map((item, i) => <span key={i} style={{ fontSize: 10, fontWeight: 700, color: '#78350F', background: 'rgba(255,255,255,0.60)', padding: '1px 7px', borderRadius: 999, border: '1px solid rgba(146,64,14,0.20)' }}>{item}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ ...WHITE_CARD, padding: '7px 11px', marginBottom: 8, borderLeft: `3px solid #F59E0B`, background: 'rgba(254,243,199,0.70)', fontSize: 10, color: '#78350F', lineHeight: 1.5 }}>
        {plan?.disclaimer?.summary || 'Guidance only — not legal, financial, or tax advice.'}
      </div>

      {/* Risk Snapshot */}
      {plan?.negotiationRiskSnapshot && (
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 8, ...WHITE_CARD }}>
          <div style={{ ...SECTION_HDR, borderRadius: 0 }}>NEGOTIATION RISK SNAPSHOT</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.92)' }}>
            {[
              { label: 'Biggest Strength', value: plan.negotiationRiskSnapshot.biggestStrength, color: '#16A34A', emoji: '💪' },
              { label: 'Biggest Weakness', value: plan.negotiationRiskSnapshot.biggestWeakness, color: '#DC2626', emoji: '⚠️' },
              { label: 'Biggest Opportunity', value: plan.negotiationRiskSnapshot.biggestOpportunity, color: '#0EA5E9', emoji: '🎯' },
              { label: 'Biggest Risk', value: plan.negotiationRiskSnapshot.biggestRisk, color: '#D97706', emoji: '🔥' },
            ].map((item, i) => (
              <div key={item.label} style={{ padding: '9px 11px', borderRight: i % 2 === 0 ? '1px solid rgba(0,0,0,0.06)' : 'none', borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: item.color, marginBottom: 3 }}>{item.emoji} {item.label.toUpperCase()}</div>
                <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.4, fontWeight: 600 }}>{item.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role + Market */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <Sec title="ROLE CONTEXT">
          {[['Role', plan?.roleContext?.interpretedRole], ['Seniority', plan?.roleContext?.seniorityBand], ['Context', plan?.roleContext?.workContext]].map(([k, v]) => v && (
            <div key={k} style={{ marginBottom: 6 }}><div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', marginBottom: 1 }}>{k.toUpperCase()}</div><div style={{ fontSize: 11, color: SLATE, fontWeight: 600 }}>{v}</div></div>
          ))}
        </Sec>
        <Sec title="MARKET REALITY">
          {[['Range', plan?.marketReality?.directionalRange], ['Tension', plan?.marketReality?.marketTension], ['Confidence', plan?.marketReality?.confidenceLevel]].map(([k, v]) => v && (
            <div key={k} style={{ marginBottom: 6 }}><div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', marginBottom: 1 }}>{k.toUpperCase()}</div><div style={{ fontSize: 11, color: SLATE, fontWeight: 600 }}>{v}</div></div>
          ))}
        </Sec>
      </div>

      {/* Assumption Check */}
      <Sec title="ASSUMPTION CHECK">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><div style={{ fontWeight: 800, fontSize: 10, color: '#DC2626', marginBottom: 5 }}>MISALIGNMENTS</div><BulletList items={plan?.assumptionCheck?.potentialMisalignments} /></div>
          <div><div style={{ fontWeight: 800, fontSize: 10, color: '#D97706', marginBottom: 5 }}>UNKNOWNS</div><BulletList items={plan?.assumptionCheck?.unknowns} /></div>
        </div>
      </Sec>

      {/* Leverage */}
      <Sec title="YOUR LEVERAGE">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><div style={{ fontWeight: 800, fontSize: 10, color: ORANGE, marginBottom: 5 }}>CORE LEVERAGE</div><BulletList items={plan?.valueJustification?.coreLeverage} /></div>
          <div><div style={{ fontWeight: 800, fontSize: 10, color: ORANGE, marginBottom: 5 }}>NON-SALARY LEVERS</div><BulletList items={plan?.valueJustification?.nonSalaryLevers} /></div>
        </div>
      </Sec>

      {/* Paths */}
      <Sec title="NEGOTIATION PATHS">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {safeArr(plan?.negotiationPaths).slice(0, 3).map((p, i) => {
            const colors = ['#16A34A', '#0EA5E9', '#DC2626'];
            return (
              <div key={i} style={{ ...WHITE_CARD, padding: 9, borderTop: `2px solid ${colors[i]}` }}>
                <div style={{ fontWeight: 900, fontSize: 10, color: colors[i], marginBottom: 6 }}>{p?.label}</div>
                {[['Ask', p?.askFraming], ['When', p?.bestWhen], ['Risk', p?.tradeoffs]].map(([k, v]) => v && (
                  <div key={k} style={{ marginBottom: 5 }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: '#94A3B8', marginBottom: 1 }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize: 10, color: SLATE, lineHeight: 1.4 }}>{v}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Sec>

      {/* Scripts */}
      <Sec title="CONVERSATION SCRIPTS">
        {[['Email', plan?.conversationScript?.emailVersion], ['Live', plan?.conversationScript?.liveConversationVersion]].map(([l, t]) => t && (
          <div key={l} style={{ ...WHITE_CARD, padding: 9, marginBottom: 7 }}>
            <div style={{ fontWeight: 800, fontSize: 10, color: SLATE, marginBottom: 5 }}>{l.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{t}</div>
          </div>
        ))}
      </Sec>

      {/* Next Steps */}
      <Sec title="NEXT STEPS">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[['Immediate', plan?.nextSteps?.immediate, '#16A34A'], ['Pushback', plan?.nextSteps?.prepareForPushback, '#D97706'], ['Walk Away', plan?.nextSteps?.walkAwaySignals, '#DC2626']].map(([label, items, color]) => (
            <div key={label}><div style={{ fontWeight: 800, fontSize: 9, color, marginBottom: 5 }}>{label.toUpperCase()}</div><BulletList items={items} /></div>
          ))}
        </div>
      </Sec>

      {/* Mentor CTA */}
      <div style={{ ...GLASS, padding: '12px 14px', borderLeft: `3px solid ${ORANGE}`, marginBottom: 8 }}>
        <div style={{ fontWeight: 900, fontSize: 12, color: ORANGE, marginBottom: 5 }}>Bring a Human Mentor In</div>
        <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.5, marginBottom: 8 }}>{plan?.mentorEscalation?.whyItHelps || 'A coach can spot leverage, sharpen phrasing, and help you hold firm without burning goodwill.'}</div>
        <a href="/the-hearth?module=mentorship" style={{ display: 'inline-block', padding: '7px 14px', background: ORANGE, color: 'white', borderRadius: 8, fontWeight: 900, fontSize: 11, textDecoration: 'none' }}>
          {plan?.mentorEscalation?.spotlightCTA || 'Find a Negotiation Coach on The Hearth'}
        </a>
      </div>

      <button type="button" onClick={onReset} style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.80)', color: SLATE, fontWeight: 800, fontSize: 11, cursor: 'pointer', width: 'fit-content' }}>
        Start Over
      </button>
    </div>
  );
}

// ─── Right panel — context accumulator ───────────────────────────────────────
function ContextPanel({ step, plan, loading, error, insights, onReset }) {
  if (loading) {
    return (
      <div style={{ ...GLASS, padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>⚡</div>
        <div style={{ fontWeight: 900, fontSize: 15, color: ORANGE, marginBottom: 5 }}>Building your strategy…</div>
        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 18 }}>Pressure-testing assumptions. Mapping leverage. Crafting paths.</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: ORANGE, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
      </div>
    );
  }

  if (plan) {
    return <div style={{ overflowY: 'auto' }}><ResultsPanel plan={plan} onReset={onReset} /></div>;
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {/* Progress */}
      <div style={{ ...GLASS, padding: '12px 14px', background: 'rgba(30,41,59,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div style={{ marginBottom: 10 }}><ProgressBar step={step} /></div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>Step {step} of 4 — complete all steps to generate your strategy</div>
      </div>

      {/* Accumulated insights */}
      {insights.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          {insights.map((insight, i) => (
            <div key={i} style={{ ...GLASS, padding: '9px 12px', borderLeft: `3px solid ${ORANGE}`, borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 7, animation: 'fadeSlideIn 0.3s ease' }}>
              <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <span style={{ fontSize: 12, flexShrink: 0 }}>⚡</span>
              <span style={{ fontSize: 11, color: SLATE, fontWeight: 600, lineHeight: 1.5 }}>{insight}</span>
            </div>
          ))}
        </div>
      )}

      {/* Placeholder */}
      {insights.length === 0 && (
        <div style={{ ...GLASS, padding: '18px 14px', textAlign: 'center', opacity: 0.75 }}>
          <div style={{ fontSize: 22, marginBottom: 7 }}>🧠</div>
          <div style={{ fontSize: 12, color: SLATE, fontWeight: 700, marginBottom: 4 }}>Your insights appear here</div>
          <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>As you complete each step, we surface real-time signals about your position and leverage.</div>
        </div>
      )}

      {/* Preview of what is coming */}
      {step < 4 && (
        <div style={{ ...WHITE_CARD, padding: '10px 12px' }}>
          <div style={{ fontWeight: 800, fontSize: 10, color: SLATE, marginBottom: 7, letterSpacing: 0.3 }}>YOUR STRATEGY WILL INCLUDE</div>
          {['⚡ Recommended move + target ask', '📊 Leverage score + drivers', '🧠 Risk snapshot (strength, weakness, opportunity)', '🛤 3 negotiation paths', '✍️ Email + live conversation scripts', '🚀 Immediate next steps', '🤝 Mentor escalation if needed'].map((item, i) => (
            <div key={i} style={{ fontSize: 10, color: '#64748B', padding: '3px 0', borderBottom: i < 6 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>{item}</div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ padding: '9px 12px', background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, fontSize: 11, color: '#DC2626', fontWeight: 700 }}>{error}</div>
      )}
    </div>
  );
}

// ─── Main export — two-panel command center ───────────────────────────────────
const STEP_META = [
  { title: 'The Target', sub: 'What are we negotiating?' },
  { title: 'The Situation', sub: 'What did they offer?' },
  { title: 'Your Leverage', sub: 'How strong are you?' },
  { title: 'Decision Rules', sub: 'Your line in the sand' },
];

export default function OfferEngine({ onBack }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);
  const [insights, setInsights] = useState([]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  useEffect(() => {
    const insight = getMicroInsight(step, form);
    if (!insight) return;
    const timer = setTimeout(() => {
      setInsights(prev => prev.includes(insight) ? prev : [...prev, insight]);
    }, 500);
    return () => clearTimeout(timer);
  }, [step, form.location, form.jobDescription, form.offerBaseSalary, form.currentSalary, form.hasOffer, form.yearsRelevantExperience, form.competingOffers, form.notableProjectsEvidence, form.confidenceLevel, form.topPriority]);

  const goNext = () => {
    if (step < 4) {
      setAnimating(true);
      setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 180);
    } else handleSubmit();
  };

  const goBack = () => {
    if (step > 1) {
      setAnimating(true);
      setTimeout(() => { setStep(s => s - 1); setAnimating(false); }, 180);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/offer-negotiation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: { ...form, confidenceLevel: form.confidenceLevel || 'medium' } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to generate plan');
      setPlan(json?.plan || null);
    } catch (e) {
      setError(String(e?.message || 'Something went wrong. Please try again.'));
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setPlan(null); setForm(INITIAL_FORM); setStep(1); setError(''); setInsights([]); };

  const meta = STEP_META[step - 1];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,380px)', gap: 12, alignItems: 'start', width: '100%' }}>

      {/* LEFT: Step form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...GLASS, padding: '11px 14px', background: 'rgba(30,41,59,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: 'white', marginBottom: 1 }}>
            {['🎯', '💼', '⚡', '🎖'][step - 1]} {meta.title}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>{meta.sub}</div>
        </div>

        <div style={{ ...GLASS, overflow: 'hidden', opacity: animating ? 0 : 1, transform: animating ? 'translateX(5px)' : 'translateX(0)', transition: 'opacity 0.18s ease, transform 0.18s ease' }}>
          <div style={SECTION_HDR}>{['🎯', '💼', '⚡', '🎖'][step - 1]} {meta.title}</div>
          <div style={{ padding: '14px' }}>
            {step === 1 && <Step1 form={form} onChange={handleChange} />}
            {step === 2 && <Step2 form={form} onChange={handleChange} />}
            {step === 3 && <Step3 form={form} onChange={handleChange} />}
            {step === 4 && <Step4 form={form} onChange={handleChange} />}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button"
            onClick={step === 1 ? onBack : goBack}
            disabled={step === 1 && !onBack}
            style={{ padding: '8px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.22)', background: (step === 1 && !onBack) ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.14)', color: (step === 1 && !onBack) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)', fontWeight: 800, fontSize: 12, cursor: (step === 1 && !onBack) ? 'not-allowed' : 'pointer', backdropFilter: 'blur(8px)' }}>
            {step === 1 && onBack ? '← Back to Anvil' : '← Back'}
          </button>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4].map(n => <div key={n} style={{ width: n === step ? 16 : 5, height: 5, borderRadius: 3, background: n <= step ? ORANGE : 'rgba(255,255,255,0.22)', transition: 'all 0.3s ease' }} />)}
          </div>
          <button type="button" onClick={goNext}
            style={{ padding: '8px 20px', borderRadius: 999, background: step === 4 ? ORANGE : 'rgba(255,255,255,0.90)', color: step === 4 ? 'white' : SLATE, fontWeight: 900, fontSize: 12, border: 'none', cursor: 'pointer', boxShadow: step === 4 ? '0 4px 14px rgba(255,112,67,0.40)' : '0 2px 8px rgba(0,0,0,0.12)', transition: 'all 0.2s ease' }}>
            {step === 4 ? '⚡ Generate Strategy' : 'Next →'}
          </button>
        </div>
      </div>

      {/* RIGHT: Context + results */}
      <div style={{ position: 'sticky', top: 16, alignSelf: 'start' }}>
        <ContextPanel step={step} plan={plan} loading={loading} error={error} insights={insights} onReset={handleReset} />
      </div>
    </div>
  );
}