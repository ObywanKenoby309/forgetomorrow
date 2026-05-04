// components/offer-negotiation/OfferEngine.js
// Premium B — single-page progressive decision engine
// 4 steps + inline results. Animated transitions. Live micro-insights.
import { useState, useRef, useCallback, useEffect } from 'react';

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
  padding: '9px 12px',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 9,
  fontSize: 13,
  color: DARK,
  background: 'rgba(255,255,255,0.90)',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const LABEL = {
  display: 'block',
  fontWeight: 700,
  fontSize: 12,
  color: '#475569',
  marginBottom: 5,
};

const SECTION_HEADER = {
  padding: '10px 16px',
  background: 'linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))',
  color: 'white',
  fontWeight: 900,
  fontSize: 13,
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
      if (delta > 15) return `This offer represents a ${delta}% increase over your current salary — strong position to negotiate from confidence.`;
      if (delta > 0) return `This offer is ${delta}% above your current salary. Room to push, but framing matters.`;
      if (delta === 0) return `The offer matches your current salary. This is a lateral move — leverage your evidence hard.`;
      return `This offer is ${Math.abs(delta)}% below your current salary. That's a red flag — we'll build your pushback.`;
    }
    if (form.hasOffer === 'no') {
      return `No offer yet — we'll build a proactive compensation target based on your situation.`;
    }
    return null;
  }
  if (step === 3) {
    const years = Number(form.yearsRelevantExperience || 0);
    const hasCompeting = form.competingOffers === 'yes';
    const hasSkills = (form.skillsCertsExperience || '').trim().length > 20;
    let score = 0;
    if (years >= 5) score += 2;
    else if (years >= 2) score += 1;
    if (hasCompeting) score += 3;
    if (hasSkills) score += 1;
    if (score >= 4) return `You're in a strong leverage position. Competing offers and strong experience give you real negotiating power.`;
    if (score >= 2) return `You're in a moderate leverage position. Evidence and framing will be your strongest tools.`;
    if (score >= 1) return `Your leverage is developing. We'll focus on what you can control — evidence and positioning.`;
    return `Limited leverage signals detected. We'll build the most honest path forward from here.`;
  }
  if (step === 4) {
    const confidence = form.confidenceLevel;
    const priority = form.topPriority;
    const priorityMap = {
      base_salary: 'base salary', total_comp: 'total compensation',
      equity: 'equity', sign_on: 'sign-on bonus',
      remote_flex: 'remote flexibility', growth: 'growth opportunities',
    };
    if (confidence === 'low') return `You flagged low confidence — we'll build you a conservative anchor and a clear script so you know exactly what to say.`;
    if (confidence === 'high') return `High confidence noted. We'll optimize for the ambitious path and give you language to hold firm.`;
    if (priority && priorityMap[priority]) return `Optimizing for ${priorityMap[priority]}. One more step and we'll generate your full strategy.`;
    return `Decision rules set. Hit Generate Strategy when you're ready.`;
  }
  return null;
}

// ─── Toggle button ────────────────────────────────────────────────────────────
function Toggle({ name, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange({ target: { name, value: opt.value } })}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 9,
            border: `1.5px solid ${value === opt.value ? ORANGE : 'rgba(0,0,0,0.12)'}`,
            background: value === opt.value ? `rgba(255,112,67,0.10)` : 'rgba(255,255,255,0.80)',
            color: value === opt.value ? '#C2410C' : SLATE,
            fontWeight: 800,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, children, span = 1 }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      {label && <label style={LABEL}>{label}</label>}
      {children}
    </div>
  );
}

// ─── Step 1: Intent + Role ────────────────────────────────────────────────────
function Step1({ form, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div>
        <div style={{ fontWeight: 900, fontSize: 16, color: DARK, marginBottom: 12 }}>
          What are we negotiating today?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { value: 'yes', emoji: '🆕', label: 'New Job Offer', sub: 'I received or expect an offer' },
            { value: 'no', emoji: '📈', label: 'Raise / Promotion', sub: 'I want more in my current role' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ target: { name: 'isNewJob', value: opt.value } })}
              style={{
                padding: '16px 14px',
                borderRadius: 12,
                border: `2px solid ${form.isNewJob === opt.value ? ORANGE : 'rgba(0,0,0,0.10)'}`,
                background: form.isNewJob === opt.value ? 'rgba(255,112,67,0.07)' : 'rgba(255,255,255,0.80)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 14, color: form.isNewJob === opt.value ? '#C2410C' : DARK }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 900, fontSize: 15, color: DARK, marginBottom: 4 }}>
          Tell me about the role
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>
          Paste the job description or describe what you're going for
        </div>
        <textarea
          name="jobDescription"
          value={form.jobDescription}
          onChange={onChange}
          rows={5}
          placeholder={form.isNewJob === 'no'
            ? 'e.g. Senior Manager at Acme Corp — I want to negotiate a raise from $95k to $110k based on my performance this year...'
            : 'e.g. Strategic Advisory Services Manager at CrowdStrike — leads a team of consultants, manages engagements, executive stakeholder communication...'}
          style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Location">
          <input name="location" value={form.location} onChange={onChange}
            placeholder="City, State or Remote" style={INPUT} />
        </Field>
        <Field label="Industry">
          <select name="industry" value={form.industry} onChange={onChange} style={INPUT}>
            <option value="">Select industry (optional)</option>
            {['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Government', 'Nonprofit', 'Other'].map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

// ─── Step 2: The Situation (branching) ───────────────────────────────────────
function Step2({ form, onChange }) {
  const hasOffer = form.hasOffer === 'yes';
  return (
    <div style={{ display: 'grid', gap: 20 }}>

      {/* Branch question — always first */}
      <div>
        <div style={{ fontWeight: 900, fontSize: 16, color: DARK, marginBottom: 12 }}>
          Do you already have an offer?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { value: 'yes', emoji: '📄', label: 'Yes — offer in hand', sub: 'I have written or verbal terms' },
            { value: 'no', emoji: '🎯', label: 'Not yet', sub: 'Building my strategy in advance' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ target: { name: 'hasOffer', value: opt.value } })}
              style={{
                padding: '16px 14px',
                borderRadius: 12,
                border: `2px solid ${form.hasOffer === opt.value ? ORANGE : 'rgba(0,0,0,0.10)'}`,
                background: form.hasOffer === opt.value ? 'rgba(255,112,67,0.07)' : 'rgba(255,255,255,0.80)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{opt.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 14, color: form.hasOffer === opt.value ? '#C2410C' : DARK }}>{opt.label}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 3 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Branch: YES — show offer details */}
      {hasOffer && (
        <div style={{ display: 'grid', gap: 12, animation: 'fadeSlideIn 0.25s ease' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: SLATE, borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: 8 }}>
            Tell me what they offered
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Company">
              <input name="offerCompany" value={form.offerCompany} onChange={onChange} placeholder="Company name" style={INPUT} />
            </Field>
            <Field label="Offered Title">
              <input name="offerRoleTitle" value={form.offerRoleTitle} onChange={onChange} placeholder="e.g. Senior Manager" style={INPUT} />
            </Field>
            <Field label="Base Salary ($)">
              <input name="offerBaseSalary" value={form.offerBaseSalary} onChange={onChange} type="number" min="0" placeholder="120000" style={INPUT} />
            </Field>
            <Field label="Annual Bonus">
              <input name="offerBonus" value={form.offerBonus} onChange={onChange} placeholder="10% or $12,000" style={INPUT} />
            </Field>
            <Field label="Sign-on ($) optional">
              <input name="offerSignOn" value={form.offerSignOn} onChange={onChange} type="number" min="0" placeholder="0" style={INPUT} />
            </Field>
            <Field label="Equity optional">
              <input name="offerEquity" value={form.offerEquity} onChange={onChange} placeholder="0.05%, 10k RSUs..." style={INPUT} />
            </Field>
            <Field label="Work Mode">
              <select name="offerWorkMode" value={form.offerWorkMode} onChange={onChange} style={INPUT}>
                <option value="">Select</option>
                <option value="on-site">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </Field>
            <Field label="Offer Deadline optional">
              <input name="offerDeadline" value={form.offerDeadline} onChange={onChange} placeholder="Friday EOD, Jan 15..." style={INPUT} />
            </Field>
          </div>
          <Field label="Benefits & Other Terms optional">
            <textarea name="offerBenefitsNotes" value={form.offerBenefitsNotes} onChange={onChange}
              rows={2} placeholder="PTO, health coverage, 401k match, remote stipend, relocation, etc."
              style={{ ...INPUT, resize: 'vertical' }} />
          </Field>
        </div>
      )}

      {/* Branch: NO — show target range */}
      {!hasOffer && (
        <div style={{ display: 'grid', gap: 12, animation: 'fadeSlideIn 0.25s ease' }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: SLATE, borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: 8 }}>
            What are you targeting?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Target Salary — Min ($)">
              <input name="targetSalaryMin" value={form.targetSalaryMin} onChange={onChange} type="number" min="0" placeholder="100000" style={INPUT} />
            </Field>
            <Field label="Target Salary — Max ($)">
              <input name="targetSalaryMax" value={form.targetSalaryMax} onChange={onChange} type="number" min="0" placeholder="130000" style={INPUT} />
            </Field>
          </div>
        </div>
      )}

      {/* Always: current salary */}
      <Field label="Your Current Salary ($)">
        <input name="currentSalary" value={form.currentSalary} onChange={onChange} type="number" min="0" placeholder="95000" style={INPUT} />
      </Field>
    </div>
  );
}

// ─── Step 3: Your Leverage ───────────────────────────────────────────────────
function Step3({ form, onChange }) {
  const hasCompeting = form.competingOffers === 'yes';
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Current Job Title">
          <input name="currentJobTitle" value={form.currentJobTitle} onChange={onChange}
            placeholder="e.g. Director, Advisory Services" style={INPUT} />
        </Field>
        <Field label="Years of Relevant Experience">
          <input name="yearsRelevantExperience" value={form.yearsRelevantExperience} onChange={onChange}
            type="number" min="0" placeholder="8" style={INPUT} />
        </Field>
      </div>

      <div>
        <div style={{ fontWeight: 900, fontSize: 15, color: DARK, marginBottom: 4 }}>
          What have you actually delivered?
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>
          Your strongest proof of impact — outcomes, scale, transformation. Be specific.
        </div>
        <textarea name="notableProjectsEvidence" value={form.notableProjectsEvidence} onChange={onChange}
          rows={4} placeholder="e.g. Led a team of 50+ agents managing $25M accounts. Built SOP library that cut onboarding time by 40%. Improved SLA compliance from 78% to 94%..."
          style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }} />
      </div>

      <Field label="Credentials & Certifications (optional)">
        <input name="skillsCertsExperience" value={form.skillsCertsExperience} onChange={onChange}
          placeholder="e.g. CISSP, PMP, ITIL V4, MBA, AWS cert..." style={INPUT} />
      </Field>

      <div>
        <div style={{ fontWeight: 900, fontSize: 15, color: DARK, marginBottom: 12 }}>
          Do you have competing offers?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { value: 'yes', emoji: '⚡', label: 'Yes — I have alternatives', sub: 'This gives you real leverage' },
            { value: 'no', emoji: '🎯', label: 'No competing offers', sub: "We'll build leverage from evidence" },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ target: { name: 'competingOffers', value: opt.value } })}
              style={{
                padding: '14px 12px',
                borderRadius: 12,
                border: `2px solid ${form.competingOffers === opt.value ? ORANGE : 'rgba(0,0,0,0.10)'}`,
                background: form.competingOffers === opt.value ? 'rgba(255,112,67,0.07)' : 'rgba(255,255,255,0.80)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 5 }}>{opt.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 13, color: form.competingOffers === opt.value ? '#C2410C' : DARK }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {hasCompeting && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'fadeSlideIn 0.25s ease' }}>
          <Field label="How many?">
            <input name="competingOffersCount" value={form.competingOffersCount} onChange={onChange}
              type="number" min="1" placeholder="2" style={INPUT} />
          </Field>
          <Field label="Best alternative">
            <input name="bestAlternativeNotes" value={form.bestAlternativeNotes} onChange={onChange}
              placeholder="e.g. $130k, remote, Series B" style={INPUT} />
          </Field>
        </div>
      )}
    </div>
  );
}

// ─── Step 4: Decision Rules ──────────────────────────────────────────────────
function Step4({ form, onChange }) {
  return (
    <div style={{ display: 'grid', gap: 20 }}>

      <div>
        <div style={{ fontWeight: 900, fontSize: 15, color: DARK, marginBottom: 4 }}>
          What matters most in this decision?
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>Pick your top 3 — in order</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {['topPriority', 'secondPriority', 'thirdPriority'].map((name, i) => (
            <div key={name}>
              <label style={{ ...LABEL, fontSize: 11, color: '#94A3B8', marginBottom: 3 }}>#{i + 1} Priority</label>
              <select name={name} value={form[name]} onChange={onChange} style={INPUT}>
                {priorityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 900, fontSize: 15, color: DARK, marginBottom: 4 }}>
          What must this offer include?
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>
          Things the offer needs to have — your hard floor
        </div>
        <textarea name="mustHaves" value={form.mustHaves} onChange={onChange}
          rows={2} placeholder="e.g. minimum $115k base, remote at least 3 days/week, health coverage..."
          style={{ ...INPUT, resize: 'vertical' }} />
      </div>

      <div>
        <div style={{ fontWeight: 900, fontSize: 15, color: DARK, marginBottom: 4 }}>
          What would you refuse even if everything else was perfect?
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>
          Things that kill the deal regardless — be honest
        </div>
        <textarea name="dealBreakers" value={form.dealBreakers} onChange={onChange}
          rows={2} placeholder="e.g. mandatory relocation, on-call requirements, micromanagement culture..."
          style={{ ...INPUT, resize: 'vertical' }} />
      </div>

      <div>
        <div style={{ fontWeight: 900, fontSize: 15, color: DARK, marginBottom: 4 }}>
          What would make this a great offer?
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>
          Beyond salary — perks, flexibility, growth
        </div>
        <input name="desiredBenefits" value={form.desiredBenefits} onChange={onChange}
          placeholder="e.g. remote stipend, extra PTO, education budget, equity upside..."
          style={INPUT} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Willing to relocate?">
          <Toggle name="willingnessToRelocate" value={form.willingnessToRelocate} onChange={onChange}
            options={[{ value: 'yes', label: '✈️ Yes' }, { value: 'no', label: '🏠 No' }]} />
        </Field>
        <Field label="Desired start date (optional)">
          <input name="desiredStartDate" value={form.desiredStartDate} onChange={onChange}
            placeholder="ASAP, 2 weeks, March 1..." style={INPUT} />
        </Field>
      </div>

      {/* Confidence checkpoint */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 18 }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: DARK, marginBottom: 4 }}>
          How confident are you going into this negotiation?
        </div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>
          Be honest — this shapes how we frame your strategy
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { value: 'low', emoji: '😬', label: 'Not confident', sub: 'I need all the help I can get' },
            { value: 'medium', emoji: '🤔', label: 'Somewhat confident', sub: 'I know my value but feel unsure' },
            { value: 'high', emoji: '💪', label: 'Very confident', sub: 'I know exactly what I want' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ target: { name: 'confidenceLevel', value: opt.value } })}
              style={{
                padding: '14px 10px',
                borderRadius: 12,
                border: `2px solid ${form.confidenceLevel === opt.value ? ORANGE : 'rgba(0,0,0,0.10)'}`,
                background: form.confidenceLevel === opt.value ? 'rgba(255,112,67,0.07)' : 'rgba(255,255,255,0.80)',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{opt.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 12, color: form.confidenceLevel === opt.value ? '#C2410C' : DARK, marginBottom: 3 }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', lineHeight: 1.4 }}>{opt.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Micro-insight card ───────────────────────────────────────────────────────
function MicroInsight({ text, visible }) {
  return (
    <div style={{
      overflow: 'hidden',
      maxHeight: visible && text ? 80 : 0,
      opacity: visible && text ? 1 : 0,
      transition: 'max-height 0.4s ease, opacity 0.4s ease',
      marginBottom: visible && text ? 8 : 0,
    }}>
      <div style={{
        ...GLASS,
        padding: '12px 16px',
        borderLeft: `3px solid ${ORANGE}`,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>⚡</span>
        <span style={{ fontSize: 13, color: SLATE, fontWeight: 600, lineHeight: 1.5 }}>{text}</span>
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total = 4 }) {
  const steps = [
    { n: 1, label: 'Target' },
    { n: 2, label: 'Situation' },
    { n: 3, label: 'Leverage' },
    { n: 4, label: 'Rules' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {steps.map((s, i) => (
        <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: step >= s.n ? ORANGE : 'rgba(255,255,255,0.40)',
              border: `2px solid ${step >= s.n ? ORANGE : 'rgba(255,255,255,0.30)'}`,
              color: step >= s.n ? 'white' : 'rgba(255,255,255,0.60)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 13,
              transition: 'all 0.3s ease',
              boxShadow: step === s.n ? `0 0 0 4px rgba(255,112,67,0.25)` : 'none',
            }}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: step >= s.n ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: '0 4px', marginBottom: 18,
              background: step > s.n ? ORANGE : 'rgba(255,255,255,0.20)',
              transition: 'background 0.3s ease',
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Results component ────────────────────────────────────────────────────────
function Results({ plan, formData, onReset }) {
  function safeArr(v) { return Array.isArray(v) ? v.filter(Boolean) : []; }

  const Section = ({ title, children, accent }) => (
    <div style={{ ...WHITE_CARD, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ ...SECTION_HEADER, background: accent || 'linear-gradient(180deg, rgba(38,50,56,0.92), rgba(38,50,56,0.70))' }}>
        {title}
      </div>
      <div style={{ padding: '16px 18px' }}>{children}</div>
    </div>
  );

  const Pill = ({ children, color }) => (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 999,
      background: color || `rgba(255,112,67,0.12)`,
      color: color ? 'white' : ORANGE,
      fontWeight: 800, fontSize: 12, margin: '2px 3px',
    }}>{children}</span>
  );

  const BulletList = ({ items }) => (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
      {safeArr(items).map((x, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: SLATE, lineHeight: 1.5 }}>
          <span style={{ color: ORANGE, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>•</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div style={{ animation: 'fadeSlideIn 0.4s ease forwards' }}>
      <style>{`@keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ ...GLASS, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 17, color: ORANGE }}>⚡ Your Negotiation Strategy</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Here is your move. Review the full breakdown below.</div>
        </div>
        <button type="button" onClick={onReset} style={{ padding: '7px 14px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.12)', background: 'rgba(255,255,255,0.80)', color: SLATE, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
          ← Start Over
        </button>
      </div>

      {/* DECISION CARD — always first, always prominent */}
      {plan?.decision && (
        <div style={{ marginBottom: 12, borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 24px rgba(255,112,67,0.20)' }}>
          <div style={{ padding: '14px 18px', background: 'linear-gradient(135deg, rgba(255,112,67,0.95), rgba(234,88,12,0.90))', color: 'white' }}>
            <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: 0.5, opacity: 0.85, marginBottom: 6 }}>⚡ RECOMMENDED MOVE</div>
            <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: -0.5, marginBottom: 6 }}>
              {plan.decision.recommendedMove}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.92, lineHeight: 1.5 }}>
              {plan.decision.oneLineSummary}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.95)', padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', marginBottom: 4, letterSpacing: 0.5 }}>LEVERAGE</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: plan.decision.leverageBand === 'Strong' ? '#16A34A' : plan.decision.leverageBand === 'Moderate' ? '#D97706' : '#DC2626' }}>
                {plan.decision.leverageBand}
                {plan.decision.leverageScore && <span style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginLeft: 6 }}>({plan.decision.leverageScore}/10)</span>}
              </div>
            </div>
            {[
              ['Risk Level', plan.decision.riskLevel, '#64748B'],
              ['Target Ask', plan.decision.targetAsk, ORANGE],
              ['Fallback Floor', plan.decision.fallbackFloor, '#475569'],
            ].map(([label, value, color]) => (
              <div key={label}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', marginBottom: 4, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color }}>{value || '—'}</div>
              </div>
            ))}
          </div>
          {Array.isArray(plan.decision.leverageDrivers) && plan.decision.leverageDrivers.length > 0 && (
            <div style={{ background: 'rgba(248,250,252,0.95)', padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', flexShrink: 0, paddingTop: 1 }}>DRIVEN BY:</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {plan.decision.leverageDrivers.map((d, i) => (
                  <span key={i} style={{ fontSize: 12, fontWeight: 600, color: '#475569', background: 'white', padding: '2px 10px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.10)' }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
          {Array.isArray(plan.decision.doNotTradeAway) && plan.decision.doNotTradeAway.length > 0 && (
            <div style={{ background: 'rgba(254,243,199,0.90)', padding: '10px 18px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#92400E' }}>🔒 DO NOT TRADE AWAY:</span>
              {plan.decision.doNotTradeAway.map((item, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 700, color: '#78350F', background: 'rgba(255,255,255,0.60)', padding: '2px 10px', borderRadius: 999, border: '1px solid rgba(146,64,14,0.20)' }}>
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ ...WHITE_CARD, padding: '10px 14px', marginBottom: 10, borderLeft: `3px solid #F59E0B`, background: 'rgba(254,243,199,0.80)' }}>
        <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.5 }}>
          ⚠️ {plan?.disclaimer?.summary || 'Guidance only — not legal, financial, or tax advice. Outcomes are not guaranteed.'}
        </div>
      </div>

      {/* Role + Market */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <Section title="🎯 ROLE CONTEXT">
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              ['Interpreted Role', plan?.roleContext?.interpretedRole],
              ['Seniority Band', plan?.roleContext?.seniorityBand],
              ['Work Context', plan?.roleContext?.workContext],
            ].map(([k, v]) => v && (
              <div key={k}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, color: SLATE, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="📊 MARKET REALITY">
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              ['Directional Range', plan?.marketReality?.directionalRange],
              ['Market Tension', plan?.marketReality?.marketTension],
              ['Confidence Level', plan?.marketReality?.confidenceLevel],
            ].map(([k, v]) => v && (
              <div key={k}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 2 }}>{k}</div>
                <div style={{ fontSize: 13, color: SLATE, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Assumption Check — decision risk only */}
      <Section title="🔍 ASSUMPTION CHECK">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 12, color: '#DC2626', marginBottom: 8 }}>⚠ Potential misalignments</div>
            <BulletList items={plan?.assumptionCheck?.potentialMisalignments} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 12, color: '#D97706', marginBottom: 8 }}>? Unknowns to clarify</div>
            <BulletList items={plan?.assumptionCheck?.unknowns} />
          </div>
        </div>
      </Section>

      {/* Value */}
      <Section title="💪 YOUR LEVERAGE">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 12, color: ORANGE, marginBottom: 8 }}>Core leverage</div>
            <BulletList items={plan?.valueJustification?.coreLeverage} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 12, color: ORANGE, marginBottom: 8 }}>Non-salary levers</div>
            <BulletList items={plan?.valueJustification?.nonSalaryLevers} />
          </div>
        </div>
      </Section>

      {/* Negotiation Risk Snapshot */}
      {plan?.negotiationRiskSnapshot && (
        <div style={{ marginBottom: 12, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.22)', boxShadow: '0 10px 24px rgba(0,0,0,0.12)' }}>
          <div style={{ padding: '10px 16px', background: 'linear-gradient(180deg, rgba(15,23,42,0.92), rgba(30,41,59,0.85))', color: 'white', fontWeight: 900, fontSize: 13, letterSpacing: 0.4 }}>
            🧠 NEGOTIATION RISK SNAPSHOT
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: 'rgba(255,255,255,0.92)' }}>
            {[
              { label: 'Biggest Strength', value: plan.negotiationRiskSnapshot.biggestStrength, color: '#16A34A', emoji: '💪' },
              { label: 'Biggest Weakness', value: plan.negotiationRiskSnapshot.biggestWeakness, color: '#DC2626', emoji: '⚠️' },
              { label: 'Biggest Opportunity', value: plan.negotiationRiskSnapshot.biggestOpportunity, color: '#0EA5E9', emoji: '🎯' },
              { label: 'Biggest Risk', value: plan.negotiationRiskSnapshot.biggestRisk, color: '#D97706', emoji: '🔥' },
            ].map((item, i) => (
              <div key={item.label} style={{
                padding: '14px 16px',
                borderRight: i % 2 === 0 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                borderBottom: i < 2 ? '1px solid rgba(0,0,0,0.06)' : 'none',
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: item.color, marginBottom: 5, letterSpacing: 0.3 }}>
                  {item.emoji} {item.label.toUpperCase()}
                </div>
                <div style={{ fontSize: 13, color: SLATE, lineHeight: 1.5, fontWeight: 600 }}>{item.value || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Negotiation Paths */}
      <Section title="🛤 NEGOTIATION PATHS">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {safeArr(plan?.negotiationPaths).slice(0, 3).map((p, i) => {
            const colors = ['#16A34A', '#0EA5E9', '#DC2626'];
            const labels = ['Conservative', 'Balanced', 'Ambitious'];
            return (
              <div key={i} style={{ ...WHITE_CARD, padding: 14, borderTop: `3px solid ${colors[i]}` }}>
                <div style={{ fontWeight: 900, fontSize: 13, color: colors[i], marginBottom: 10 }}>
                  {p?.label || labels[i]}
                </div>
                {[
                  ['Ask framing', p?.askFraming],
                  ['Best when', p?.bestWhen],
                  ['Tradeoffs', p?.tradeoffs],
                ].map(([k, v]) => v && (
                  <div key={k} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', marginBottom: 2 }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: SLATE, lineHeight: 1.45 }}>{v}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Scripts */}
      <Section title="✍️ CONVERSATION SCRIPTS">
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            ['📧 Email Version', plan?.conversationScript?.emailVersion],
            ['🗣 Live Conversation', plan?.conversationScript?.liveConversationVersion],
          ].map(([label, text]) => text && (
            <div key={label} style={{ ...WHITE_CARD, padding: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: SLATE, marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{text}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Next Steps */}
      <Section title="🚀 NEXT STEPS">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            ['Immediate', plan?.nextSteps?.immediate, '#16A34A'],
            ['Prepare for pushback', plan?.nextSteps?.prepareForPushback, '#D97706'],
            ['Walk-away signals', plan?.nextSteps?.walkAwaySignals, '#DC2626'],
          ].map(([label, items, color]) => (
            <div key={label}>
              <div style={{ fontWeight: 800, fontSize: 12, color, marginBottom: 8 }}>{label}</div>
              <BulletList items={items} />
            </div>
          ))}
        </div>
      </Section>

      {/* Mentor CTA */}
      <div style={{ ...GLASS, padding: '18px 20px', borderLeft: `3px solid ${ORANGE}` }}>
        <div style={{ fontWeight: 900, fontSize: 15, color: ORANGE, marginBottom: 8 }}>🤝 Bring a Human Mentor In</div>
        <div style={{ fontSize: 13, color: SLATE, lineHeight: 1.6, marginBottom: 12 }}>
          {plan?.mentorEscalation?.whyItHelps || 'A coach can spot leverage, sharpen phrasing, and help you stay firm without burning goodwill.'}
        </div>
        {plan?.mentorEscalation?.whatToBring && (
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12, lineHeight: 1.5 }}>
            <strong>What to bring:</strong> {plan.mentorEscalation.whatToBring}
          </div>
        )}
        <a href="/the-hearth?module=mentorship" style={{ display: 'inline-block', padding: '10px 20px', background: ORANGE, color: 'white', borderRadius: 10, fontWeight: 900, fontSize: 13, textDecoration: 'none' }}>
          {plan?.mentorEscalation?.spotlightCTA || 'Find a Negotiation Coach on The Hearth →'}
        </a>
      </div>
    </div>
  );
}

// ─── Main OfferEngine ─────────────────────────────────────────────────────────
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
  topPriority: '', secondPriority: '', thirdPriority: '', desiredStartDate: '', confidenceLevel: '',
};

const STEP_TITLES = [
  { n: 1, title: '🎯 The Target', sub: 'What are we negotiating?' },
  { n: 2, title: '💼 The Situation', sub: 'What did they offer?' },
  { n: 3, title: '⚡ Your Leverage', sub: 'How strong are you?' },
  { n: 4, title: '🎖 Decision Rules', sub: 'Your line in the sand' },
];

export default function OfferEngine() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInsight, setShowInsight] = useState(false);
  const [animating, setAnimating] = useState(false);
  const topRef = useRef(null);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const microInsight = getMicroInsight(step, form);

  // Show insight with delay after step change
  useEffect(() => {
    setShowInsight(false);
    const t = setTimeout(() => setShowInsight(true), 600);
    return () => clearTimeout(t);
  }, [step]);

  const goNext = () => {
    if (step < 4) {
      setAnimating(true);
      setTimeout(() => {
        setStep(s => s + 1);
        setAnimating(false);
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (step > 1) {
      setAnimating(true);
      setTimeout(() => {
        setStep(s => s - 1);
        setAnimating(false);
      }, 200);
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
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      setError(String(e?.message || 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPlan(null);
    setForm(INITIAL_FORM);
    setStep(1);
    setError('');
  };

  const currentStepMeta = STEP_TITLES[step - 1];

  // Loading state
  if (loading) {
    return (
      <div style={{ ...GLASS, padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚡</div>
        <div style={{ fontWeight: 900, fontSize: 20, color: ORANGE, marginBottom: 8 }}>
          Building your negotiation strategy…
        </div>
        <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
          Pressure-testing your assumptions. Mapping your leverage. Crafting your paths.
        </div>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: ORANGE,
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
      </div>
    );
  }

  // Results
  if (plan) {
    return <Results plan={plan} formData={form} onReset={handleReset} />;
  }

  // Step form
  return (
    <div ref={topRef}>
      {/* Progress + step header */}
      <div style={{ ...GLASS, padding: '16px 20px', marginBottom: 8, background: 'rgba(30,41,59,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div style={{ marginBottom: 14 }}>
          <ProgressBar step={step} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, color: 'white' }}>{currentStepMeta.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{currentStepMeta.sub}</div>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>
            Step {step} of 4
          </div>
        </div>
      </div>

      {/* Micro insight */}
      <MicroInsight text={microInsight} visible={showInsight} />

      {/* Step content */}
      <div style={{
        ...GLASS,
        overflow: 'hidden',
        opacity: animating ? 0 : 1,
        transform: animating ? 'translateX(8px)' : 'translateX(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      }}>
        <div style={SECTION_HEADER}>
          {currentStepMeta.title}
        </div>
        <div style={{ padding: '20px 20px' }}>
          {step === 1 && <Step1 form={form} onChange={handleChange} />}
          {step === 2 && <Step2 form={form} onChange={handleChange} />}
          {step === 3 && <Step3 form={form} onChange={handleChange} />}
          {step === 4 && <Step4 form={form} onChange={handleChange} />}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.10)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 10, marginTop: 8, fontSize: 13, color: '#DC2626', fontWeight: 700 }}>
          {error}
        </div>
      )}

      {/* Nav buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          style={{
            padding: '10px 20px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)',
            background: step === 1 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
            color: step === 1 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)',
            fontWeight: 800, fontSize: 13, cursor: step === 1 ? 'not-allowed' : 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          ← Back
        </button>

        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={{
              width: n === step ? 20 : 6, height: 6, borderRadius: 3,
              background: n <= step ? ORANGE : 'rgba(255,255,255,0.25)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          style={{
            padding: '10px 24px', borderRadius: 999,
            background: step === 4 ? ORANGE : 'rgba(255,255,255,0.90)',
            color: step === 4 ? 'white' : SLATE,
            fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer',
            boxShadow: step === 4 ? '0 4px 14px rgba(255,112,67,0.40)' : '0 2px 8px rgba(0,0,0,0.12)',
            transition: 'all 0.2s ease',
          }}
        >
          {step === 4 ? '⚡ Generate Strategy' : 'Next →'}
        </button>
      </div>
    </div>
  );
}