// components/offer-negotiation/OfferEngine.js
// 10/10 Negotiation Command Center
// Left: guided step form | Right: cockpit — insights → tabbed results
// Glass cards sit directly over wallpaper. No backing. No narrow column.
import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import { ResumeContext } from '@/context/ResumeContext';
import jsPDF from 'jspdf';

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

const LABEL = { display: 'block', fontWeight: 700, fontSize: 11, color: '#475569', marginBottom: 4 };

const SECTION_HDR = {
  padding: '9px 14px',
  background: 'linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))',
  color: 'white', fontWeight: 900, fontSize: 12, letterSpacing: 0.4,
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
    if (role) parts.push(`targeting ${role.split(' ').slice(0, 4).join(' ')}`);
    if (loc) parts.push(`in ${loc}`);
    return `You're ${parts.join(', ')}. Market conditions for this context will factor into your strategy.`;
  }
  if (step === 2) {
    const base = Number(form.offerBaseSalary || 0);
    const current = Number(form.currentSalary || 0);
    if (form.hasOffer === 'yes' && base > 0 && current > 0) {
      const delta = Math.round(((base - current) / current) * 100);
      if (delta > 15) return `This offer is ${delta}% above your current salary — negotiate from confidence.`;
      if (delta > 0) return `This offer is ${delta}% above your current salary. Room to push — framing matters.`;
      if (delta === 0) return `Lateral move. Lead hard with your evidence.`;
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
    if (years >= 8) score += 3; else if (years >= 4) score += 2; else if (years >= 1) score += 1;
    if (hasCompeting) score += 3;
    if (hasImpact) score += 2;
    if (score >= 6) return `Strong leverage. Competing offers and proven impact give you real negotiating power.`;
    if (score >= 3) return `Moderate leverage. Evidence and framing will be your strongest tools.`;
    return `Developing leverage. We'll build the most honest path forward.`;
  }
  if (step === 4) {
    const confidence = form.confidenceLevel;
    if (confidence === 'low') return `Low confidence noted — we'll build a clear anchor and script so you know exactly what to say.`;
    if (confidence === 'high') return `High confidence. Optimizing for your ambitious path with language to hold firm.`;
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
  return <div>{label && <label style={LABEL}>{label}</label>}{children}</div>;
}

function ChoiceCard({ value, current, name, onChange, emoji, label, sub }) {
  const active = current === value;
  return (
    <button type="button" onClick={() => onChange({ target: { name, value } })}
      style={{ padding: '11px 10px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
        border: `2px solid ${active ? ORANGE : 'rgba(0,0,0,0.10)'}`,
        background: active ? 'rgba(255,112,67,0.07)' : 'rgba(255,255,255,0.80)', transition: 'all 0.15s' }}>
      <div style={{ fontSize: 16, marginBottom: 3 }}>{emoji}</div>
      <div style={{ fontWeight: 900, fontSize: 12, color: active ? '#C2410C' : DARK }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, lineHeight: 1.3 }}>{sub}</div>}
    </button>
  );
}

function BulletList({ items }) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : [];
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
      {arr.map((x, i) => (
        <li key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 11, color: SLATE, lineHeight: 1.45 }}>
          <span style={{ color: ORANGE, fontWeight: 900, flexShrink: 0 }}>•</span><span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────
function Step1({ form, onChange, hasResume }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {/* Resume connection status — always visible, never silent */}
      {hasResume ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 10,
          background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.25)' }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>✅</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#15803D', lineHeight: 1.4 }}>
            Leverage based on verified experience and impact evidence.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 13px', borderRadius: 10,
          background: 'rgba(234,179,8,0.10)', border: '1px solid rgba(234,179,8,0.30)' }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', lineHeight: 1.4 }}>
              Using self-reported inputs only. Connect your resume to strengthen negotiation accuracy.
            </div>
            <a href="/resume/create" style={{ fontSize: 10, color: '#FF7043', fontWeight: 800, textDecoration: 'underline' }}>
              Open Resume Builder →
            </a>
          </div>
        </div>
      )}
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
            {['Technology','Healthcare','Finance','Education','Manufacturing','Retail','Government','Nonprofit','Other'].map(i => <option key={i} value={i}>{i}</option>)}
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
          <div style={{ fontWeight: 700, fontSize: 11, color: SLATE, borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: 5 }}>What did they offer?</div>
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
          <div style={{ fontWeight: 700, fontSize: 11, color: SLATE, borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: 5 }}>What are you targeting?</div>
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
          {['topPriority','secondPriority','thirdPriority'].map((name, i) => (
            <div key={name}>
              <label style={{ ...LABEL, fontSize: 10, color: '#94A3B8', marginBottom: 3 }}>#{i+1}</label>
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
            {[{v:'yes',l:'Yes'},{v:'no',l:'No'}].map(o => (
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
  const steps = [{n:1,label:'Target'},{n:2,label:'Situation'},{n:3,label:'Leverage'},{n:4,label:'Rules'}];
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length-1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%',
              background: step >= s.n ? ORANGE : 'rgba(255,255,255,0.25)',
              border: `2px solid ${step >= s.n ? ORANGE : 'rgba(255,255,255,0.18)'}`,
              color: step >= s.n ? 'white' : 'rgba(255,255,255,0.40)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 10, transition: 'all 0.3s ease',
              boxShadow: step === s.n ? `0 0 0 3px rgba(255,112,67,0.25)` : 'none' }}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap',
              color: step >= s.n ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.35)' }}>{s.label}</span>
          </div>
          {i < steps.length-1 && (
            <div style={{ flex: 1, height: 2, margin: '0 3px', marginBottom: 14,
              background: step > s.n ? ORANGE : 'rgba(255,255,255,0.18)', transition: 'background 0.3s ease' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── PDF export ───────────────────────────────────────────────────────────────
function downloadBrief(plan, form) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 44;
  const maxW = 524;
  let yPos = margin;

  const write = (text, size = 11, bold = false, color = [30, 41, 59]) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text || ''), maxW);
    lines.forEach(line => {
      if (yPos > 750) { doc.addPage(); yPos = margin; }
      doc.text(line, margin, yPos);
      yPos += size * 1.5;
    });
  };

  const gap = (n = 10) => { yPos += n; };

  write('ForgeTomorrow Negotiation Brief', 18, true, [255, 112, 67]);
  gap(4);
  write(`${form.currentJobTitle || 'Candidate'} — ${form.location || ''}`, 12, false, [100, 116, 139]);
  write(new Date().toLocaleDateString(), 10, false, [148, 163, 184]);
  gap(16);

  if (plan?.decision) {
    write('RECOMMENDED MOVE', 10, true, [255, 112, 67]);
    write(plan.decision.recommendedMove, 16, true);
    write(plan.decision.oneLineSummary || '', 11);
    gap(8);
    write(`Leverage: ${plan.decision.leverageBand || ''}${plan.decision.leverageScore != null ? ` (${plan.decision.leverageScore}/10)` : ''}`, 11, true);
    write(`Risk Level: ${plan.decision.riskLevel || ''}`, 11);
    write(`Target Ask: ${plan.decision.targetAsk || ''}`, 11);
    write(`Fallback Floor: ${plan.decision.fallbackFloor || ''}`, 11);
    if (plan.decision.doNotTradeAway?.length) write(`Do Not Trade Away: ${plan.decision.doNotTradeAway.join(', ')}`, 11);
    gap(12);
  }

  if (plan?.negotiationRiskSnapshot) {
    write('NEGOTIATION RISK SNAPSHOT', 10, true, [255, 112, 67]);
    const snap = plan.negotiationRiskSnapshot;
    [['Biggest Strength', snap.biggestStrength], ['Biggest Weakness', snap.biggestWeakness], ['Biggest Opportunity', snap.biggestOpportunity], ['Biggest Risk', snap.biggestRisk]].forEach(([k, v]) => {
      if (v) { write(`${k}: ${v}`, 11); gap(2); }
    });
    gap(12);
  }

  if (plan?.marketReality) {
    write('MARKET REALITY', 10, true, [255, 112, 67]);
    write(plan.marketReality.directionalRange || '', 11);
    write(plan.marketReality.marketTension || '', 11);
    gap(12);
  }

  if (plan?.negotiationPaths?.length) {
    write('NEGOTIATION PATHS', 10, true, [255, 112, 67]);
    plan.negotiationPaths.slice(0, 3).forEach(p => {
      gap(4);
      write(p.label, 11, true);
      write(`Ask: ${p.askFraming || ''}`, 11);
      write(`Best when: ${p.bestWhen || ''}`, 11);
    });
    gap(12);
  }

  if (plan?.conversationScript) {
    write('EMAIL SCRIPT', 10, true, [255, 112, 67]);
    write(plan.conversationScript.emailVersion || '', 11);
    gap(12);
    write('LIVE CONVERSATION', 10, true, [255, 112, 67]);
    write(plan.conversationScript.liveConversationVersion || '', 11);
    gap(12);
  }

  if (plan?.nextSteps) {
    write('NEXT STEPS', 10, true, [255, 112, 67]);
    (plan.nextSteps.immediate || []).forEach(s => write(`• ${s}`, 11));
    gap(12);
  }

  if (plan?.mentorEscalation?.whyItHelps) {
    write('MENTOR ESCALATION', 10, true, [255, 112, 67]);
    write(plan.mentorEscalation.whyItHelps, 11);
  }

  gap(16);
  write('ForgeTomorrow — Guidance only. Not legal, financial, or tax advice.', 9, false, [148, 163, 184]);

  doc.save('ForgeTomorrow-Negotiation-Brief.pdf');
}

// ─── Result tabs ──────────────────────────────────────────────────────────────
const RESULT_TABS = [
  { id: 'decision', label: 'Decision' },
  { id: 'leverage', label: 'Leverage' },
  { id: 'market', label: 'Market' },
  { id: 'scripts', label: 'Scripts' },
  { id: 'plan', label: 'Plan' },
];

function ResultCockpit({ plan, form, onReset, mobileActiveTab, onMobileTabChange, onSaveStrategy, onDownloadBrief, printingBrief }) {
  const [_tab, _setTab] = useState('decision');
  const tab = mobileActiveTab || _tab;
  const setTab = onMobileTabChange || _setTab;
  const [scriptTab, setScriptTab] = useState('email');

  const recommendedPath = plan?.decision?.recommendedMove?.toLowerCase().includes('balanced') ? 1
    : plan?.decision?.recommendedMove?.toLowerCase().includes('ambit') ? 2 : 0;

  const [selectedPath, setSelectedPath] = useState(recommendedPath);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  function safeArr(v) { return Array.isArray(v) ? v.filter(Boolean) : []; }

  const copyEmail = () => {
    const text = plan?.conversationScript?.emailVersion || '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const saveStrategy = async () => {
    try {
      if (onSaveStrategy) await onSaveStrategy();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(String(err?.message || err || 'Could not save negotiation report'));
    }
  };

  // Action bar
  const ActionBar = () => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
      <button type="button" onClick={saveStrategy}
        style={{ padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer',
          background: saved ? '#16A34A' : 'rgba(255,255,255,0.85)', color: saved ? 'white' : SLATE,
          border: '1px solid rgba(0,0,0,0.12)', transition: 'all 0.2s' }}>
        {saved ? '✓ Saved' : '💾 Save'}
      </button>
      <button type="button" onClick={onDownloadBrief || (() => downloadBrief(plan, form))} disabled={printingBrief}
        style={{ padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: printingBrief ? 'not-allowed' : 'pointer',
          background: ORANGE, color: 'white', border: 'none', opacity: printingBrief ? 0.7 : 1 }}>
        {printingBrief ? 'Saving to Vault...' : '📄 Download Brief'}
      </button>
      <button type="button" onClick={copyEmail}
        style={{ padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer',
          background: copied ? '#16A34A' : 'rgba(255,255,255,0.85)', color: copied ? 'white' : SLATE,
          border: '1px solid rgba(0,0,0,0.12)', transition: 'all 0.2s' }}>
        {copied ? '✓ Copied' : '📋 Copy Script'}
      </button>
      <button type="button" onClick={onReset}
        style={{ padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          background: 'transparent', color: '#94A3B8', border: '1px solid rgba(0,0,0,0.08)', marginLeft: 'auto' }}>
        Start Over
      </button>
    </div>
  );

  // Tab bar
  const TabBar = () => (
    <div style={{ display: 'flex', gap: 2, marginBottom: 12, background: 'rgba(0,0,0,0.06)', borderRadius: 10, padding: 3 }}>
      {RESULT_TABS.map(t => (
        <button key={t.id} type="button" onClick={() => setTab(t.id)}
          style={{ flex: 1, padding: '7px 8px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer',
            border: 'none', transition: 'all 0.15s',
            background: tab === t.id ? 'white' : 'transparent',
            color: tab === t.id ? ORANGE : '#64748B',
            boxShadow: tab === t.id ? '0 2px 6px rgba(0,0,0,0.10)' : 'none' }}>
          {t.label}
        </button>
      ))}
    </div>
  );

  // DECISION tab
  const DecisionTab = () => (
    <div style={{ display: 'grid', gap: 8 }}>
      {/* Main decision card */}
      {plan?.decision && (
        <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 6px 20px rgba(255,112,67,0.22)' }}>
          <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, rgba(255,112,67,0.95), rgba(234,88,12,0.90))', color: 'white' }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 0.6, opacity: 0.80, marginBottom: 3 }}>RECOMMENDED MOVE</div>
            <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: -0.5, marginBottom: 5 }}>{plan.decision.recommendedMove}</div>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.92, lineHeight: 1.5 }}>{plan.decision.oneLineSummary}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.96)', padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', marginBottom: 2, letterSpacing: 0.5 }}>LEVERAGE</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: plan.decision.leverageBand === 'Strong' ? '#16A34A' : plan.decision.leverageBand === 'Moderate' ? '#D97706' : '#DC2626' }}>
                {plan.decision.leverageBand}
                {plan.decision.leverageScore != null && <span style={{ fontSize: 9, color: '#94A3B8', marginLeft: 3 }}>({plan.decision.leverageScore}/10)</span>}
              </div>
            </div>
            {[['RISK', plan.decision.riskLevel, '#64748B'], ['TARGET', plan.decision.targetAsk, ORANGE], ['FLOOR', plan.decision.fallbackFloor, '#475569']].map(([l, v, c]) => (
              <div key={l}><div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', marginBottom: 2, letterSpacing: 0.5 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 900, color: c }}>{v || '—'}</div></div>
            ))}
          </div>
          {safeArr(plan.decision.leverageDrivers).length > 0 && (
            <div style={{ background: 'rgba(248,250,252,0.96)', padding: '7px 14px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#64748B' }}>DRIVEN BY:</span>
              {plan.decision.leverageDrivers.map((d, i) => <span key={i} style={{ fontSize: 10, fontWeight: 600, color: '#475569', background: 'white', padding: '1px 7px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.10)' }}>{d}</span>)}
            </div>
          )}
          {safeArr(plan.decision.doNotTradeAway).length > 0 && (
            <div style={{ background: 'rgba(254,243,199,0.90)', padding: '7px 14px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#92400E' }}>🔒 DO NOT TRADE:</span>
              {plan.decision.doNotTradeAway.map((item, i) => <span key={i} style={{ fontSize: 10, fontWeight: 700, color: '#78350F', background: 'rgba(255,255,255,0.60)', padding: '1px 7px', borderRadius: 999, border: '1px solid rgba(146,64,14,0.20)' }}>{item}</span>)}
            </div>
          )}
        </div>
      )}

      {/* Risk snapshot directly under decision */}
      {plan?.negotiationRiskSnapshot && (
        <div style={{ borderRadius: 12, overflow: 'hidden', ...WHITE_CARD }}>
          <div style={{ ...SECTION_HDR, borderRadius: 0 }}>🧠 NEGOTIATION RISK SNAPSHOT</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'rgba(255,255,255,0.92)' }}>
            {[
              { label: 'Biggest Strength', value: plan.negotiationRiskSnapshot.biggestStrength, color: '#16A34A', emoji: '💪' },
              { label: 'Biggest Weakness', value: plan.negotiationRiskSnapshot.biggestWeakness, color: '#DC2626', emoji: '⚠️' },
              { label: 'Biggest Opportunity', value: plan.negotiationRiskSnapshot.biggestOpportunity, color: '#0EA5E9', emoji: '🎯' },
              { label: 'Biggest Risk', value: plan.negotiationRiskSnapshot.biggestRisk, color: '#D97706', emoji: '🔥' },
            ].map((item, i) => (
              <div key={item.label} style={{ padding: '10px 12px', borderRight: i%2===0 ? '1px solid rgba(0,0,0,0.06)' : 'none', borderBottom: i<2 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: item.color, marginBottom: 3 }}>{item.emoji} {item.label.toUpperCase()}</div>
                <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.4, fontWeight: 600 }}>{item.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resume connection status in results */}
      {form && (form.summary || form.experiences?.length || form.skills?.length || form.formData?.fullName) ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 8,
          background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.20)', marginBottom: 6 }}>
          <span style={{ fontSize: 11 }}>✅</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#15803D' }}>Leverage based on verified experience and impact evidence.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 11px', borderRadius: 8,
          background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', marginBottom: 6 }}>
          <span style={{ fontSize: 11 }}>⚠️</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E' }}>Using self-reported inputs only. Connect your resume to strengthen negotiation accuracy.</span>
        </div>
      )}
      {/* Disclaimer compact */}
      <div style={{ padding: '7px 11px', borderRadius: 8, borderLeft: `3px solid #F59E0B`, background: 'rgba(254,243,199,0.70)', fontSize: 10, color: '#78350F', lineHeight: 1.5 }}>
        {plan?.disclaimer?.summary || 'Guidance only — not legal, financial, or tax advice.'}
      </div>
    </div>
  );

  // LEVERAGE tab
  const LeverageTab = () => (
    <div style={{ display: 'grid', gap: 8 }}>
      {plan?.valueJustification && (
        <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={SECTION_HDR}>YOUR LEVERAGE</div>
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 10, color: ORANGE, marginBottom: 6 }}>CORE LEVERAGE</div>
              <BulletList items={plan.valueJustification.coreLeverage} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 10, color: ORANGE, marginBottom: 6 }}>NON-SALARY LEVERS</div>
              <BulletList items={plan.valueJustification.nonSalaryLevers} />
            </div>
          </div>
        </div>
      )}
      {plan?.assumptionCheck && (
        <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={SECTION_HDR}>ASSUMPTION CHECK</div>
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 10, color: '#DC2626', marginBottom: 6 }}>MISALIGNMENTS</div>
              <BulletList items={plan.assumptionCheck.potentialMisalignments} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 10, color: '#D97706', marginBottom: 6 }}>UNKNOWNS</div>
              <BulletList items={plan.assumptionCheck.unknowns} />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // MARKET tab
  const MarketTab = () => (
    <div style={{ display: 'grid', gap: 8 }}>
      {plan?.roleContext && (
        <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={SECTION_HDR}>ROLE CONTEXT</div>
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['Interpreted Role', plan.roleContext.interpretedRole], ['Seniority Band', plan.roleContext.seniorityBand], ['Work Context', plan.roleContext.workContext]].map(([k, v]) => v && (
              <div key={k}><div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', marginBottom: 3, letterSpacing: 0.4 }}>{k.toUpperCase()}</div><div style={{ fontSize: 12, color: SLATE, fontWeight: 600 }}>{v}</div></div>
            ))}
          </div>
        </div>
      )}
      {plan?.marketReality && (
        <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={SECTION_HDR}>MARKET REALITY</div>
          <div style={{ padding: '12px 14px', display: 'grid', gap: 10 }}>
            {[['Directional Range', plan.marketReality.directionalRange], ['Market Tension', plan.marketReality.marketTension], ['Confidence Level', plan.marketReality.confidenceLevel]].map(([k, v]) => v && (
              <div key={k} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, alignItems: 'start' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', paddingTop: 2, letterSpacing: 0.4 }}>{k.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: SLATE, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // SCRIPTS tab — tabbed Email / Live
  const ScriptsTab = () => (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.06)', borderRadius: 8, padding: 3 }}>
        {[{id:'email',label:'📧 Email'},{id:'live',label:'🗣 Live Conversation'}].map(t => (
          <button key={t.id} type="button" onClick={() => setScriptTab(t.id)}
            style={{ flex: 1, padding: '7px 10px', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer',
              border: 'none', background: scriptTab === t.id ? 'white' : 'transparent',
              color: scriptTab === t.id ? ORANGE : '#64748B',
              boxShadow: scriptTab === t.id ? '0 2px 6px rgba(0,0,0,0.10)' : 'none',
              transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>
      {scriptTab === 'email' && plan?.conversationScript?.emailVersion && (
        <div style={{ ...WHITE_CARD, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {plan.conversationScript.emailVersion}
          </div>
          <button type="button" onClick={copyEmail}
            style={{ marginTop: 10, padding: '6px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer',
              background: copied ? '#16A34A' : 'rgba(255,112,67,0.10)', color: copied ? 'white' : ORANGE,
              border: `1px solid ${copied ? '#16A34A' : 'rgba(255,112,67,0.25)'}`, transition: 'all 0.2s' }}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      )}
      {scriptTab === 'live' && plan?.conversationScript?.liveConversationVersion && (
        <div style={{ ...WHITE_CARD, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {plan.conversationScript.liveConversationVersion}
          </div>
        </div>
      )}
    </div>
  );

  // PLAN tab — paths + next steps + mentor
  const PlanTab = () => (
    <div style={{ display: 'grid', gap: 8 }}>
      {/* Negotiation paths — clickable selector cards + detail below */}
      <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
        <div style={SECTION_HDR}>NEGOTIATION PATHS — select to explore</div>
        <div style={{ padding: '12px 14px', display: 'grid', gap: 10 }}>
          {/* Selector cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {safeArr(plan?.negotiationPaths).slice(0, 3).map((p, i) => {
              const colors = ['#16A34A', '#0EA5E9', '#DC2626'];
              const isRec = i === recommendedPath;
              const isActive = i === selectedPath;
              return (
                <button key={i} type="button" onClick={() => setSelectedPath(i)}
                  style={{
                    borderRadius: 10, overflow: 'hidden', cursor: 'pointer', textAlign: 'left',
                    border: isActive ? `2px solid ${colors[i]}` : '1px solid rgba(0,0,0,0.08)',
                    boxShadow: isActive ? `0 4px 12px ${colors[i]}33` : 'none',
                    background: isActive ? `${colors[i]}0d` : 'rgba(255,255,255,0.86)',
                    padding: '10px 11px', transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontWeight: 900, fontSize: 11, color: isActive ? colors[i] : DARK }}>{p?.label}</span>
                    {isRec && <span style={{ fontSize: 8, fontWeight: 800, color: colors[i], background: `${colors[i]}18`, padding: '1px 6px', borderRadius: 999, border: `1px solid ${colors[i]}44` }}>RECOMMENDED</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B', lineHeight: 1.35 }}>{p?.askFraming?.slice(0, 60)}{p?.askFraming?.length > 60 ? '…' : ''}</div>
                </button>
              );
            })}
          </div>
          {/* Selected path detail */}
          {safeArr(plan?.negotiationPaths)[selectedPath] && (() => {
            const pathData = safeArr(plan.negotiationPaths)[selectedPath];
            const colors = ['#16A34A', '#0EA5E9', '#DC2626'];
            const pathColor = colors[selectedPath] || ORANGE;
            return (
              <div style={{ borderRadius: 10, padding: '12px 14px', background: `${pathColor}08`, border: `1px solid ${pathColor}28`, display: 'grid', gap: 8 }}>
                {[['Ask', pathData?.askFraming], ['Best when', pathData?.bestWhen], ['Tradeoffs', pathData?.tradeoffs]].map(([k, v]) => v && (
                  <div key={k}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: pathColor, marginBottom: 3, letterSpacing: 0.3 }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.5 }}>{v}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Next steps — compact 3-column */}
      {plan?.nextSteps && (
        <div style={{ ...WHITE_CARD, overflow: 'hidden' }}>
          <div style={SECTION_HDR}>NEXT STEPS</div>
          <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['Immediate', plan.nextSteps.immediate, '#16A34A'], ['Prepare for Pushback', plan.nextSteps.prepareForPushback, '#D97706'], ['Walk-Away Signals', plan.nextSteps.walkAwaySignals, '#DC2626']].map(([label, items, color]) => (
              <div key={label}>
                <div style={{ fontWeight: 800, fontSize: 9, color, marginBottom: 6, letterSpacing: 0.3 }}>{label.toUpperCase()}</div>
                <BulletList items={items} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mentor CTA */}
      <div style={{ ...GLASS, padding: '12px 14px', borderLeft: `3px solid ${ORANGE}` }}>
        <div style={{ fontWeight: 900, fontSize: 12, color: ORANGE, marginBottom: 5 }}>🤝 Bring a Human Mentor In</div>
        <div style={{ fontSize: 11, color: SLATE, lineHeight: 1.55, marginBottom: 8 }}>
          {plan?.mentorEscalation?.whyItHelps || 'A coach can spot leverage, sharpen phrasing, and help you hold firm without burning goodwill.'}
        </div>
        <a href="/the-hearth?module=mentorship"
          style={{ display: 'inline-block', padding: '7px 14px', background: ORANGE, color: 'white', borderRadius: 8, fontWeight: 900, fontSize: 11, textDecoration: 'none' }}>
          {plan?.mentorEscalation?.spotlightCTA || 'Find a Negotiation Coach on The Hearth'}
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, animation: 'fadeSlideIn 0.3s ease forwards', height: '100%', minHeight: 0 }}>
      <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {/* Action bar + tab bar — sticky, never scroll */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'transparent', paddingBottom: 8 }}>
        <ActionBar />
        <TabBar />
      </div>
      {/* Tab content — fills remaining height, scrolls if needed */}
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, paddingRight: 2 }}>
        {tab === 'decision' && <DecisionTab />}
        {tab === 'leverage' && <LeverageTab />}
        {tab === 'market' && <MarketTab />}
        {tab === 'scripts' && <ScriptsTab />}
        {tab === 'plan' && <PlanTab />}
      </div>
    </div>
  );
}

// ─── Right panel — context accumulator / results cockpit ─────────────────────
function RightPanel({ step, plan, loading, error, insights, onReset, form, mobileActiveTab, onMobileTabChange, onSaveStrategy, onDownloadBrief, printingBrief }) {
  if (loading) {
    return (
      <div style={{ ...GLASS, padding: '32px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>⚡</div>
        <div style={{ fontWeight: 900, fontSize: 15, color: ORANGE, marginBottom: 5 }}>Building your strategy…</div>
        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 18 }}>
          Pressure-testing assumptions. Mapping leverage. Crafting your paths.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: ORANGE, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
      </div>
    );
  }

  if (plan) {
    return <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}><ResultCockpit plan={plan} form={form} onReset={onReset} mobileActiveTab={mobileActiveTab} onMobileTabChange={onMobileTabChange} onSaveStrategy={onSaveStrategy} onDownloadBrief={onDownloadBrief} printingBrief={printingBrief} /></div>;
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {/* Progress */}
      <div style={{ borderRadius: 14, padding: '14px 16px', background: 'rgba(30,41,59,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 10px 24px rgba(0,0,0,0.18)' }}>
        <div style={{ marginBottom: 12 }}><ProgressBar step={step} /></div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', fontWeight: 700, letterSpacing: 0.3 }}>
          Complete all 4 steps to generate your negotiation strategy
        </div>
      </div>

      {/* Accumulated insights */}
      {insights.length > 0 && (
        <div style={{ display: 'grid', gap: 6 }}>
          {insights.map((insight, i) => (
            <div key={i} style={{ ...GLASS, padding: '9px 12px', borderLeft: `3px solid ${ORANGE}`, borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 7, animation: 'fadeIn 0.3s ease' }}>
              <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}`}</style>
              <span style={{ fontSize: 12, flexShrink: 0 }}>⚡</span>
              <span style={{ fontSize: 11, color: SLATE, fontWeight: 600, lineHeight: 1.5 }}>{insight}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {insights.length === 0 && (
        <div style={{ ...GLASS, padding: '18px 14px', textAlign: 'center', opacity: 0.75 }}>
          <div style={{ fontSize: 22, marginBottom: 7 }}>🧠</div>
          <div style={{ fontSize: 12, color: SLATE, fontWeight: 700, marginBottom: 4 }}>Your insights appear here</div>
          <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.5 }}>As you complete each step, we surface real-time signals about your position and leverage.</div>
        </div>
      )}

      {/* Preview */}
      {step < 4 && (
        <div style={{ ...WHITE_CARD, padding: '10px 12px' }}>
          <div style={{ fontWeight: 800, fontSize: 10, color: SLATE, marginBottom: 7, letterSpacing: 0.3 }}>YOUR STRATEGY INCLUDES</div>
          {['⚡ Recommended move + target ask', '📊 Leverage score + what drives it', '🧠 Risk snapshot — 4 critical signals', '🛤 3 negotiation paths, recommended highlighted', '✍️ Email + live scripts, tabbed', '🚀 Immediate next steps + walk-away signals', '🤝 Mentor escalation if needed'].map((item, i) => (
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

// ─── Main export ──────────────────────────────────────────────────────────────
const STEP_META = [
  { title: 'The Target', sub: 'What are we negotiating?' },
  { title: 'The Situation', sub: 'What did they offer?' },
  { title: 'Your Leverage', sub: 'How strong are you?' },
  { title: 'Decision Rules', sub: 'Your line in the sand' },
];

export default function OfferEngine() {
  // Pull live resume data from context — same source as Forge Hammer
  const {
    formData = {},
    summary = '',
    experiences = [],
    skills = [],
    educationList = [],
    primaryResume = null,
  } = useContext(ResumeContext) || {};

  // ResumeContext fields kept as fallback for submit payload only — not UI judgment

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [plan, setPlan] = useState(null);
  const [negotiationId, setNegotiationId] = useState(null);
  const [briefUrl, setBriefUrl] = useState('');
  const [printingBrief, setPrintingBrief] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animating, setAnimating] = useState(false);
  const [insights, setInsights] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState('form'); // 'form' | 'insights' during steps; tab name during results
  const [intelligence, setIntelligence] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [loadingResumes, setLoadingResumes] = useState(false);
  
  // Resume is connected if DB-resolved primary resume exists  
  const hasResume = Boolean(selectedResumeId);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fetch unified career intelligence on mount — non-fatal
  useEffect(() => {
    fetch('/api/intelligence/context')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.context) setIntelligence(d.context); })
      .catch(() => {});
  }, []);

  // Load saved resumes from DB — same pattern as Growth & Pivot.
  // This gives the API a real resumeId instead of relying on client context.
  useEffect(() => {
    let active = true;
    setLoadingResumes(true);

    fetch('/api/resume/list')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!active) return;

        const list = Array.isArray(data?.resumes) ? data.resumes : [];
        setResumes(list);

        const primary = list.find(r => r?.isPrimary);
        const first = list[0];
        setSelectedResumeId(String(primary?.id || first?.id || ''));
      })
      .catch(() => {
        if (active) {
          setResumes([]);
          setSelectedResumeId('');
        }
      })
      .finally(() => {
        if (active) setLoadingResumes(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Pre-fill Step 3 — fires when intelligence loads (not just on mount)
  // Credentials use intelligence.credentials.combined — canonical brain source.
  // Never prefills from raw skills array. Only degrees, certs, licenses, formal training.
  useEffect(() => {
    const prefill = {};
    if (!form.currentJobTitle && formData?.targetedRole)
      prefill.currentJobTitle = formData.targetedRole;
    if (!form.yearsRelevantExperience && experiences?.length)
      prefill.yearsRelevantExperience = String(experiences.length > 3 ? experiences.length + 2 : experiences.length);
    // Brain-wired: use intelligence.credentials.combined instead of raw skills
    if (!form.skillsCertsExperience && intelligence?.credentials?.combined?.length)
      prefill.skillsCertsExperience = intelligence.credentials.combined.join(', ');
    if (!form.notableProjectsEvidence && experiences?.length) {
      const bullets = experiences
        .slice(0, 2)
        .flatMap(e => (e.bullets || []).slice(0, 2))
        .filter(Boolean)
        .join('. ');
      if (bullets) prefill.notableProjectsEvidence = bullets;
    }
    if (Object.keys(prefill).length)
      setForm(prev => ({ ...prev, ...prefill }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intelligence]);  // re-runs when intelligence loads — ensures credentials are available

  // Insights fire only when step changes — not on every keystroke
  useEffect(() => {
    const insight = getMicroInsight(step, form);
    if (!insight) return;
    const timer = setTimeout(() => {
      setInsights(prev => prev.includes(insight) ? prev : [...prev, insight]);
    }, 300);
    return () => clearTimeout(timer);
  }, [step]);

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
        body: JSON.stringify({
          formData: { ...form, confidenceLevel: form.confidenceLevel || 'medium' },
          resumeId: selectedResumeId,
          // Keep client resume data only as fallback. Server loads the selected DB resume first.
          resumeData: {
            summary,
            skills,
            workExperiences: experiences,
            educationList,
            personalInfo: formData,
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || 'Failed to generate plan');
      setPlan(json?.plan || null);
      setNegotiationId(json?.negotiationId || null);
      setBriefUrl('');
    } catch (e) {
      setError(String(e?.message || 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const persistNegotiation = useCallback(async () => {
    if (!plan) return null;

    const res = await fetch('/api/offer-negotiation/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        negotiationId,
        formData: form,
        plan,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || 'Could not save negotiation report');

    const savedId = data?.negotiation?.id || negotiationId || null;
    if (savedId) setNegotiationId(savedId);
    return savedId;
  }, [form, negotiationId, plan]);

  // Save PDF to Vault and open it. Falls back to local jsPDF download if vault unavailable.
  const handleDownloadBrief = useCallback(async () => {
    if (!plan) return;

    // If already generated, just re-open
    if (briefUrl) {
      window.open(briefUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setPrintingBrief(true);
    try {
      // Ensure negotiation is saved first so render-pdf can find the record
      let id = negotiationId;
      if (!id) {
        id = await persistNegotiation();
      }

      if (!id) throw new Error('Could not save negotiation before generating PDF.');

      const res = await fetch('/api/vault/render-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docType: 'negotiation', docId: id }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Could not generate PDF.');
      if (!data?.downloadUrl) throw new Error('PDF generated but no download URL returned.');

      setBriefUrl(data.downloadUrl);
      window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('[OfferEngine] Download Brief failed — falling back to local PDF', err);
      // Fallback: local jsPDF download so the user never gets nothing
      downloadBrief(plan, form);
    } finally {
      setPrintingBrief(false);
    }
  }, [plan, briefUrl, negotiationId, persistNegotiation, form]);

  const handleReset = () => { setPlan(null); setNegotiationId(null); setForm(INITIAL_FORM); setStep(1); setError(''); setInsights([]); };

  const meta = STEP_META[step - 1];
  const icons = ['🎯', '💼', '⚡', '🎖'];

  // ─── Input summary (shared — left panel on desktop, collapsible on mobile) ──
  const InputSummary = ({ compact = false }) => (
    <div style={{ ...GLASS, overflow: 'hidden', height: compact ? 'auto' : '100%' }}>
      <div style={SECTION_HDR}>📋 YOUR INPUTS</div>
      <div style={{ padding: compact ? '10px 12px' : '14px', display: 'grid', gap: compact ? 6 : 10 }}>
        {[
          ['Negotiating', form.isNewJob === 'yes' ? 'New Job Offer' : 'Raise / Promotion'],
          ['Role / JD', (form.jobDescription || '').slice(0, 80) + ((form.jobDescription || '').length > 80 ? '…' : '')],
          ['Location', form.location],
          ['Has Offer', form.hasOffer === 'yes' ? `Yes — ${form.offerCompany || 'Company'} at ${form.offerRoleTitle || 'role'}` : 'No offer yet'],
          ['Offered Base', form.offerBaseSalary ? `$${Number(form.offerBaseSalary).toLocaleString()}` : form.targetSalaryMin ? `Target $${Number(form.targetSalaryMin).toLocaleString()}–$${Number(form.targetSalaryMax).toLocaleString()}` : '—'],
          ['Current Salary', form.currentSalary ? `$${Number(form.currentSalary).toLocaleString()}` : '—'],
          ['Title', form.currentJobTitle],
          ['Experience', form.yearsRelevantExperience ? `${form.yearsRelevantExperience} years` : '—'],
          ['Competing Offers', form.competingOffers === 'yes' ? `Yes (${form.competingOffersCount || '?'})` : 'No'],
          ['Top Priority', form.topPriority?.replace(/_/g, ' ') || '—'],
          ['Must Include', form.mustHaves],
          ['Deal-Breakers', form.dealBreakers],
          ['Confidence', form.confidenceLevel || 'medium'],
        ].filter(([, v]) => v).map(([k, v]) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 6, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: compact ? 5 : 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', paddingTop: 1, letterSpacing: 0.3 }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: SLATE, fontWeight: 600, lineHeight: 1.4 }}>{v}</div>
          </div>
        ))}
        <button type="button" onClick={handleReset}
          style={{ marginTop: 4, padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer',
            background: 'rgba(255,112,67,0.08)', color: ORANGE, border: `1px solid rgba(255,112,67,0.25)` }}>
          ✏️ Edit Inputs
        </button>
      </div>
    </div>
  );

  // ─── MOBILE LAYOUT ────────────────────────────────────────────────────────────
  if (isMobile) {
    const RESULT_TABS_MOBILE = [
      { id: 'decision', label: '⚡' },
      { id: 'leverage', label: '💪' },
      { id: 'market', label: '📊' },
      { id: 'scripts', label: '✍️' },
      { id: 'plan', label: '🛤' },
    ];

    // Mobile: results view
    if (plan || loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: 0 }}>
          <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Compact input summary — collapsible pill */}
          <details style={{ marginBottom: 8 }}>
            <summary style={{ ...GLASS, padding: '10px 14px', borderRadius: 12, cursor: 'pointer', listStyle: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontWeight: 800, fontSize: 12, color: SLATE }}>
              <span>📋 View your inputs</span>
              <span style={{ fontSize: 10, color: '#94A3B8' }}>tap to expand</span>
            </summary>
            <div style={{ marginTop: 6 }}><InputSummary compact /></div>
          </details>

          {/* Action row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => persistNegotiation().catch((err) => alert(String(err?.message || err || 'Could not save negotiation report')))}
              style={{ flex: 1, padding: '9px 8px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer', background: 'rgba(255,255,255,0.85)', color: SLATE, border: '1px solid rgba(0,0,0,0.12)' }}>
              💾 Save
            </button>
            <button type="button" onClick={() => handleDownloadBrief()} disabled={printingBrief}
              style={{ flex: 1, padding: '9px 8px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: printingBrief ? 'not-allowed' : 'pointer', background: ORANGE, color: 'white', border: 'none', opacity: printingBrief ? 0.7 : 1 }}>
              {printingBrief ? 'Saving...' : '📄 Download'}
            </button>
            <button type="button" onClick={() => navigator.clipboard?.writeText(plan?.conversationScript?.emailVersion || '')}
              style={{ flex: 1, padding: '9px 8px', borderRadius: 10, fontSize: 11, fontWeight: 800, cursor: 'pointer', background: 'rgba(255,255,255,0.85)', color: SLATE, border: '1px solid rgba(0,0,0,0.12)' }}>
              📋 Copy Script
            </button>
          </div>

          {/* Tab content — full width */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
            {loading ? (
              <div style={{ ...GLASS, padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
                <div style={{ fontWeight: 900, fontSize: 16, color: ORANGE, marginBottom: 6 }}>Building your strategy…</div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>Pressure-testing assumptions. Mapping leverage.</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                </div>
                <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}`}</style>
              </div>
            ) : (
              <RightPanel step={step} plan={plan} loading={false} error={error} insights={insights} onReset={handleReset} form={form} mobileActiveTab={mobileTab} onMobileTabChange={setMobileTab} onSaveStrategy={persistNegotiation} onDownloadBrief={handleDownloadBrief} printingBrief={printingBrief} />
            )}
          </div>

          {/* Sticky bottom tab bar */}
          {plan && (
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
              background: 'rgba(255,255,255,0.95)', borderTop: '1px solid rgba(0,0,0,0.10)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              display: 'flex', padding: '8px 16px 12px' }}>
              {[
                { id: 'decision', label: 'Decision', emoji: '⚡' },
                { id: 'leverage', label: 'Leverage', emoji: '💪' },
                { id: 'market', label: 'Market', emoji: '📊' },
                { id: 'scripts', label: 'Scripts', emoji: '✍️' },
                { id: 'plan', label: 'Plan', emoji: '🛤' },
              ].map(t => (
                <button key={t.id} type="button" onClick={() => setMobileTab(t.id)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '6px 4px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  <span style={{ fontSize: 18 }}>{t.emoji}</span>
                  <span style={{ fontSize: 9, fontWeight: 800,
                    color: mobileTab === t.id ? ORANGE : '#94A3B8' }}>{t.label}</span>
                  {mobileTab === t.id && <div style={{ width: 16, height: 2, borderRadius: 1, background: ORANGE }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Mobile: step form view
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 10 }}>
        <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Progress bar */}
        <div style={{ borderRadius: 12, padding: '12px 14px', background: 'rgba(30,41,59,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <div style={{ marginBottom: 10 }}><ProgressBar step={step} /></div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', fontWeight: 700 }}>Step {step} of 4 — complete all steps to generate your strategy</div>
        </div>

        {/* Insight if any */}
        {insights.length > 0 && (
          <div style={{ ...GLASS, padding: '10px 12px', borderLeft: `3px solid ${ORANGE}`, borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>⚡</span>
            <span style={{ fontSize: 12, color: SLATE, fontWeight: 600, lineHeight: 1.5 }}>{insights[insights.length - 1]}</span>
          </div>
        )}

        {/* Step card */}
        <div style={{ ...GLASS, overflow: 'hidden', opacity: animating ? 0 : 1, transform: animating ? 'translateX(5px)' : 'translateX(0)', transition: 'opacity 0.18s ease, transform 0.18s ease' }}>
          <div style={{ ...SECTION_HDR, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 13 }}>{icons[step-1]} {meta.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{meta.sub}</div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', fontWeight: 700 }}>Step {step} of 4</div>
          </div>
          <div style={{ padding: '14px' }}>
            {step === 1 && <Step1 form={form} onChange={handleChange} hasResume={hasResume} />}
            {step === 2 && <Step2 form={form} onChange={handleChange} />}
            {step === 3 && <Step3 form={form} onChange={handleChange} />}
            {step === 4 && <Step4 form={form} onChange={handleChange} />}
          </div>
        </div>

        {/* Sticky bottom nav */}
        <div style={{ position: 'sticky', bottom: 0, background: 'transparent', paddingBottom: 8, paddingTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={goBack} disabled={step === 1}
                style={{ padding: '10px 18px', borderRadius: 999,
                  border: step === 1 ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.50)',
                  background: step === 1 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
                  color: step === 1 ? 'rgba(255,255,255,0.25)' : SLATE,
                  fontWeight: 800, fontSize: 13, cursor: step === 1 ? 'not-allowed' : 'pointer' }}>
                ← Back
              </button>
              {step > 1 && (
                <button type="button" onClick={handleReset}
                  style={{ padding: '10px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    background: 'transparent', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.20)' }}>
                  Start Over
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1,2,3,4].map(n => <div key={n} style={{ width: n===step ? 16 : 5, height: 5, borderRadius: 3, background: n<=step ? ORANGE : 'rgba(255,255,255,0.22)', transition: 'all 0.3s ease' }} />)}
            </div>
            <button type="button" onClick={goNext}
              style={{ padding: '10px 22px', borderRadius: 999,
                background: step === 4 ? ORANGE : 'rgba(255,255,255,0.90)',
                color: step === 4 ? 'white' : SLATE,
                fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer',
                boxShadow: step === 4 ? '0 4px 14px rgba(255,112,67,0.40)' : '0 2px 8px rgba(0,0,0,0.12)' }}>
              {step === 4 ? '⚡ Generate' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── DESKTOP LAYOUT ───────────────────────────────────────────────────────────

  // Input summary for results view left panel
  const InputSummaryDesktop = () => (
    <div style={{ ...GLASS, overflow: 'hidden', height: '100%' }}>
      <div style={SECTION_HDR}>📋 YOUR INPUTS</div>
      <div style={{ padding: '14px', display: 'grid', gap: 10 }}>
        {[
          ['Negotiating', form.isNewJob === 'yes' ? 'New Job Offer' : 'Raise / Promotion'],
          ['Role / JD', (form.jobDescription || '').slice(0, 80) + ((form.jobDescription || '').length > 80 ? '…' : '')],
          ['Location', form.location],
          ['Has Offer', form.hasOffer === 'yes' ? `Yes — ${form.offerCompany || 'Company'} at ${form.offerRoleTitle || 'role'}` : 'No offer yet'],
          ['Offered Base', form.offerBaseSalary ? `$${Number(form.offerBaseSalary).toLocaleString()}` : form.targetSalaryMin ? `Target $${Number(form.targetSalaryMin).toLocaleString()}–$${Number(form.targetSalaryMax).toLocaleString()}` : '—'],
          ['Current Salary', form.currentSalary ? `$${Number(form.currentSalary).toLocaleString()}` : '—'],
          ['Title', form.currentJobTitle],
          ['Experience', form.yearsRelevantExperience ? `${form.yearsRelevantExperience} years` : '—'],
          ['Competing Offers', form.competingOffers === 'yes' ? `Yes (${form.competingOffersCount || '?'})` : 'No'],
          ['Top Priority', form.topPriority?.replace(/_/g, ' ') || '—'],
          ['Must Include', form.mustHaves],
          ['Deal-Breakers', form.dealBreakers],
          ['Confidence', form.confidenceLevel || 'medium'],
        ].filter(([, v]) => v).map(([k, v]) => (
          <div key={k} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 6, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', paddingTop: 1, letterSpacing: 0.3 }}>{k.toUpperCase()}</div>
            <div style={{ fontSize: 11, color: SLATE, fontWeight: 600, lineHeight: 1.4 }}>{v}</div>
          </div>
        ))}
        <button type="button" onClick={handleReset}
          style={{ marginTop: 4, padding: '7px 14px', borderRadius: 999, fontSize: 11, fontWeight: 800, cursor: 'pointer',
            background: 'rgba(255,112,67,0.08)', color: ORANGE, border: `1px solid rgba(255,112,67,0.25)` }}>
          ✏️ Edit Inputs
        </button>
      </div>
    </div>
  );

  // Results view — full width two-column
  if (plan || loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,280px) minmax(0,1fr)', gap: 12, alignItems: 'stretch', width: '100%', gridAutoRows: '1fr' }}>
        <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ position: 'sticky', top: 16, alignSelf: 'start' }}>
          <InputSummaryDesktop />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <RightPanel step={step} plan={plan} loading={loading} error={error} insights={insights} onReset={handleReset} form={form} onSaveStrategy={persistNegotiation} onDownloadBrief={handleDownloadBrief} printingBrief={printingBrief} />
        </div>
      </div>
    );
  }

  // Step form view — desktop
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,400px)', gap: 12, alignItems: 'start', width: '100%' }}>
      <style>{`@keyframes fadeSlideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* LEFT: Step form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ ...GLASS, overflow: 'hidden', opacity: animating ? 0 : 1, transform: animating ? 'translateX(5px)' : 'translateX(0)', transition: 'opacity 0.18s ease, transform 0.18s ease' }}>
          <div style={{ ...SECTION_HDR, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 13 }}>{icons[step-1]} {meta.title}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{meta.sub}</div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', fontWeight: 700 }}>Step {step} of 4</div>
          </div>
          <div style={{ padding: '14px' }}>
            {step === 1 && <Step1 form={form} onChange={handleChange} hasResume={hasResume} />}
            {step === 2 && <Step2 form={form} onChange={handleChange} />}
            {step === 3 && <Step3 form={form} onChange={handleChange} />}
            {step === 4 && <Step4 form={form} onChange={handleChange} />}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={goBack} disabled={step === 1}
              style={{ padding: '8px 16px', borderRadius: 999,
                border: step === 1 ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.50)',
                background: step === 1 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.80)',
                color: step === 1 ? 'rgba(255,255,255,0.25)' : SLATE,
                fontWeight: 800, fontSize: 12, cursor: step === 1 ? 'not-allowed' : 'pointer',
                backdropFilter: 'blur(8px)', boxShadow: step === 1 ? 'none' : '0 2px 8px rgba(0,0,0,0.15)' }}>
              ← Back
            </button>
            {step > 1 && (
              <button type="button" onClick={handleReset}
                style={{ padding: '8px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: 'transparent', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.20)' }}>
                Start Over
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4].map(n => <div key={n} style={{ width: n===step ? 16 : 5, height: 5, borderRadius: 3, background: n<=step ? ORANGE : 'rgba(255,255,255,0.22)', transition: 'all 0.3s ease' }} />)}
          </div>
          <button type="button" onClick={goNext}
            style={{ padding: '8px 20px', borderRadius: 999,
              background: step === 4 ? ORANGE : 'rgba(255,255,255,0.90)',
              color: step === 4 ? 'white' : SLATE,
              fontWeight: 900, fontSize: 12, border: 'none', cursor: 'pointer',
              boxShadow: step === 4 ? '0 4px 14px rgba(255,112,67,0.40)' : '0 2px 8px rgba(0,0,0,0.12)',
              transition: 'all 0.2s ease' }}>
            {step === 4 ? '⚡ Generate Strategy' : 'Next →'}
          </button>
        </div>
      </div>

      {/* RIGHT: Context accumulator */}
      <div style={{ position: 'sticky', top: 16, alignSelf: 'start' }}>
        <RightPanel step={step} plan={plan} loading={loading} error={error} insights={insights} onReset={handleReset} form={form} onSaveStrategy={persistNegotiation} onDownloadBrief={handleDownloadBrief} printingBrief={printingBrief} />
      </div>
    </div>
  );
}