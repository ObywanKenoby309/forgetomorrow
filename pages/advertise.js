// pages/advertise.js
import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';
import RecruiterLayout from '@/components/layouts/RecruiterLayout';
import CoachingLayout from '@/components/layouts/CoachingLayout';
import LandingHeader from '@/components/LandingHeader';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const ORANGE = '#FF7043';
const DARK   = '#0a0f1a';
const GLASS  = {
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.06)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

const SURFACES = [
  {
    id: 'seeker',
    label: 'Seeker',
    icon: '🧭',
    description: 'Career builders, job hunters, professionals leveling up.',
  },
  {
    id: 'recruiter',
    label: 'Recruiter',
    icon: '♟️',
    description: 'HR teams, hiring managers, talent acquisition leaders.',
  },
  {
    id: 'coaching',
    label: 'Coaching',
    icon: '⚡',
    description: 'Career coaches, mentors, and certification seekers.',
  },
  {
    id: 'community',
    label: 'Community',
    icon: '🌐',
    description: 'All three audiences together — The Hearth and Feed.',
  },
];

const BUDGET_RANGES = [
  'Under $500/mo',
  '$500–$1,000/mo',
  '$1,000–$2,500/mo',
  '$2,500–$5,000/mo',
  '$5,000+/mo',
  'Let\'s talk',
];

// ─── Audience stat cards ────────────────────────────────────────────────────────
const STATS = [
  { value: '3', label: 'High-intent environments', sub: 'Seeker · Recruiter · Coach' },
  { value: '0', label: 'User data sold. Ever.', sub: 'Context without surveillance' },
  { value: '100%', label: 'Placement by intent', sub: 'Built around what people are doing now' },
];

// ─── Page content (shared between public and internal shells) ──────────────────
function AdvertiseContent({ isInternal }) {
  const [form, setForm] = useState({
    contactName: '',
    contactEmail: '',
    companyName: '',
    companyWebsite: '',
    surfaces: [],
    budgetRange: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);

  function toggleSurface(id) {
    setForm((prev) => ({
      ...prev,
      surfaces: prev.surfaces.includes(id)
        ? prev.surfaces.filter((s) => s !== id)
        : [...prev.surfaces, id],
    }));
  }

  async function handleSubmit() {
    setError('');

    if (!form.contactName.trim() || !form.contactEmail.trim() || !form.companyName.trim()) {
      setError('Please fill in your name, email, and company name.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/ads/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Submission failed');
      }

      setSubmitted(true);
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please email sales@forgetomorrow.com directly.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ color: isInternal ? '#112033' : '#ffffff' }}>

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative',
          minHeight: isInternal ? 420 : '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundImage: [
            'linear-gradient(180deg, rgba(10,15,26,0.30) 0%, rgba(10,15,26,0.62) 55%, rgba(10,15,26,0.96) 100%)',
            "url('/images/advertise-hero.png')",
          ].join(', '),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* orange radial pulse */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 50% 80%, rgba(255,112,67,0.18) 0%, transparent 60%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            maxWidth: 860,
            padding: '0 24px',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              marginBottom: 20,
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid rgba(255,112,67,0.40)',
              background: 'rgba(255,112,67,0.12)',
              color: ORANGE,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
            }}
          >
            Advertise with ForgeTomorrow
          </div>

          <h1
            style={{
              margin: '0 0 20px',
              fontSize: 'clamp(38px, 7vw, 80px)',
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              color: '#ffffff',
              textShadow: '0 8px 40px rgba(0,0,0,0.50)',
            }}
          >
            Be seen where<br />
            <span style={{ color: ORANGE }}>decisions are made.</span>
          </h1>

          <p
            style={{
              margin: '0 auto 36px',
              maxWidth: 600,
              fontSize: 'clamp(16px, 2.2vw, 20px)',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.78)',
              fontWeight: 400,
            }}
          >
            ForgeTomorrow places your brand inside real career moments - 
            not passive scrolling, not surveillance, just intent.
          </p>

          <a
            href="#inquire"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              borderRadius: 14,
              background: ORANGE,
              color: '#ffffff',
              fontSize: 15,
              fontWeight: 800,
              textDecoration: 'none',
              letterSpacing: '0.02em',
              boxShadow: '0 8px 28px rgba(255,112,67,0.40)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 12px 36px rgba(255,112,67,0.52)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,112,67,0.40)';
            }}
          >
            Claim Your Place →
          </a>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section
        style={{
          background: isInternal ? '#f0f4f8' : DARK,
          borderTop: `1px solid rgba(255,112,67,0.20)`,
          borderBottom: `1px solid rgba(255,112,67,0.20)`,
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 32,
            textAlign: 'center',
          }}
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontSize: 'clamp(36px, 5vw, 52px)',
                  fontWeight: 900,
                  color: ORANGE,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isInternal ? '#334155' : '#ffffff',
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: isInternal ? '#64748b' : 'rgba(255,255,255,0.45)',
                }}
              >
                {s.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY FORGETOMORROW ── */}
      <section
        style={{
          background: isInternal ? '#ffffff' : '#0d1320',
          padding: '80px 24px',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: ORANGE,
              marginBottom: 16,
            }}
          >
            Why us
          </div>
          <h2
            style={{
              margin: '0 0 20px',
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: isInternal ? '#0a0f1a' : '#ffffff',
            }}
          >
            Your brand belongs<br />where momentum lives.
          </h2>
          <p
            style={{
              maxWidth: 620,
              fontSize: 17,
              lineHeight: 1.7,
              color: isInternal ? '#334155' : 'rgba(255,255,255,0.70)',
              marginBottom: 48,
            }}
          >
            Most platforms chase attention. ForgeTomorrow meets people in motion.
			Your brand appears beside real decisions, real progress, and real professional momentum.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 20,
            }}
          >
            {[
              {
    title: 'Show up with purpose',
    body: 'Your brand appears inside moments of action, not beside idle scrolling.',
  },
  {
    title: 'Be part of the experience',
    body: 'ForgeTomorrow placements feel native, premium, and aligned with the platform.',
  },
  {
    title: 'Reach the right mindset',
    body: 'Seeker, Recruiter, and Coach surfaces let you align to intent without surveillance.',
  },
  {
    title: 'Stand where momentum is',
    body: 'This is a platform for movement, clarity, and next steps - and your brand can live inside that energy.',
  },
            ].map((card) => (
              <div
                key={card.title}
                style={{
                  borderRadius: 16,
                  padding: '22px 20px',
                  border: isInternal
                    ? '1px solid rgba(51,65,85,0.16)'
                    : '1px solid rgba(255,255,255,0.12)',
                  background: isInternal
                    ? 'rgba(248,250,252,0.9)'
                    : 'rgba(255,255,255,0.05)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 3,
                    borderRadius: 999,
                    background: ORANGE,
                    marginBottom: 14,
                  }}
                />
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: isInternal ? '#0a0f1a' : '#ffffff',
                    marginBottom: 8,
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: isInternal ? '#475569' : 'rgba(255,255,255,0.60)',
                  }}
                >
                  {card.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SURFACES ── */}
      <section
        style={{
          background: isInternal ? '#f0f4f8' : DARK,
          padding: '80px 24px',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: ORANGE,
              marginBottom: 16,
            }}
          >
            Ad surfaces
          </div>
          <h2
            style={{
              margin: '0 0 40px',
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: isInternal ? '#0a0f1a' : '#ffffff',
            }}
          >
            Choose where your brand belongs.
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {SURFACES.map((s) => (
              <div
                key={s.id}
                style={{
                  borderRadius: 16,
                  padding: '24px 20px',
                  border: isInternal
                    ? '1px solid rgba(51,65,85,0.16)'
                    : '1px solid rgba(255,255,255,0.12)',
                  background: isInternal ? '#ffffff' : 'rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: isInternal ? '#0a0f1a' : '#ffffff',
                    marginBottom: 8,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: isInternal ? '#475569' : 'rgba(255,255,255,0.55)',
                  }}
                >
                  {s.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ── */}
      <section
        id="inquire"
        style={{
          background: isInternal ? '#ffffff' : '#0d1320',
          padding: '80px 24px 100px',
        }}
        ref={formRef}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: ORANGE,
              marginBottom: 16,
            }}
          >
            Get started
          </div>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: isInternal ? '#0a0f1a' : '#ffffff',
            }}
          >
            Let's talk.
          </h2>
          <p
            style={{
              margin: '0 0 40px',
              fontSize: 15,
              color: isInternal ? '#475569' : 'rgba(255,255,255,0.55)',
              lineHeight: 1.6,
            }}
          >
            Tell us where you want to show up, and we’ll help you build the right presence on ForgeTomorrow.
          </p>

          {submitted ? (
            <div
              style={{
                borderRadius: 18,
                padding: '40px 32px',
                textAlign: 'center',
                border: `1px solid rgba(255,112,67,0.30)`,
                background: isInternal ? 'rgba(255,112,67,0.06)' : 'rgba(255,112,67,0.08)',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>🔥</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  color: isInternal ? '#0a0f1a' : '#ffffff',
                  marginBottom: 10,
                }}
              >
                We've got your inquiry.
              </div>
              <p
                style={{
                  fontSize: 15,
                  color: isInternal ? '#475569' : 'rgba(255,255,255,0.60)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Someone from the ForgeTomorrow sales team will reach out to{' '}
                <strong style={{ color: ORANGE }}>{form.contactEmail}</strong>{' '}
                within one business day.
              </p>
            </div>
          ) : (
            <div
              style={{
                borderRadius: 20,
                padding: '32px 28px',
                border: isInternal
                  ? '1px solid rgba(51,65,85,0.16)'
                  : '1px solid rgba(255,255,255,0.12)',
                background: isInternal ? '#f8fafc' : 'rgba(255,255,255,0.04)',
                display: 'grid',
                gap: 18,
              }}
            >
              {/* Row: Name + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field
                  label="Contact Name *"
                  value={form.contactName}
                  onChange={(v) => setForm((p) => ({ ...p, contactName: v }))}
                  placeholder="Jane Smith"
                  isInternal={isInternal}
                />
                <Field
                  label="Contact Email *"
                  value={form.contactEmail}
                  onChange={(v) => setForm((p) => ({ ...p, contactEmail: v }))}
                  placeholder="jane@company.com"
                  type="email"
                  isInternal={isInternal}
                />
              </div>

              {/* Row: Company + Website */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field
                  label="Company Name *"
                  value={form.companyName}
                  onChange={(v) => setForm((p) => ({ ...p, companyName: v }))}
                  placeholder="Acme Corp"
                  isInternal={isInternal}
                />
                <Field
                  label="Company Website"
                  value={form.companyWebsite}
                  onChange={(v) => setForm((p) => ({ ...p, companyWebsite: v }))}
                  placeholder="https://acme.com"
                  type="url"
                  isInternal={isInternal}
                />
              </div>

              {/* Surfaces multi-select */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isInternal ? '#334155' : 'rgba(255,255,255,0.60)',
                    marginBottom: 10,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Which surfaces interest you?
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SURFACES.map((s) => {
                    const active = form.surfaces.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSurface(s.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 999,
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          border: active
                            ? `1px solid ${ORANGE}`
                            : isInternal
                            ? '1px solid rgba(51,65,85,0.25)'
                            : '1px solid rgba(255,255,255,0.18)',
                          background: active
                            ? ORANGE
                            : isInternal
                            ? 'rgba(51,65,85,0.06)'
                            : 'rgba(255,255,255,0.06)',
                          color: active
                            ? '#ffffff'
                            : isInternal
                            ? '#334155'
                            : 'rgba(255,255,255,0.70)',
                        }}
                      >
                        {s.icon} {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget range */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isInternal ? '#334155' : 'rgba(255,255,255,0.60)',
                    marginBottom: 10,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Estimated Monthly Budget
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {BUDGET_RANGES.map((b) => {
                    const active = form.budgetRange === b;
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, budgetRange: b }))}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          border: active
                            ? `1px solid ${ORANGE}`
                            : isInternal
                            ? '1px solid rgba(51,65,85,0.25)'
                            : '1px solid rgba(255,255,255,0.18)',
                          background: active
                            ? ORANGE
                            : isInternal
                            ? 'rgba(51,65,85,0.06)'
                            : 'rgba(255,255,255,0.06)',
                          color: active
                            ? '#ffffff'
                            : isInternal
                            ? '#334155'
                            : 'rgba(255,255,255,0.70)',
                        }}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isInternal ? '#334155' : 'rgba(255,255,255,0.60)',
                    marginBottom: 8,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Notes or Message
                </div>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Tell us about your campaign goals, timeline, or any questions you have..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: isInternal
                      ? '1px solid rgba(51,65,85,0.25)'
                      : '1px solid rgba(255,255,255,0.14)',
                    background: isInternal ? '#ffffff' : 'rgba(255,255,255,0.06)',
                    color: isInternal ? '#112033' : '#ffffff',
                    fontSize: 14,
                    lineHeight: 1.6,
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.30)',
                    color: '#ef4444',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '14px 28px',
                  borderRadius: 12,
                  background: submitting ? 'rgba(255,112,67,0.50)' : ORANGE,
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 800,
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.02em',
                  boxShadow: submitting ? 'none' : '0 6px 20px rgba(255,112,67,0.35)',
                  transition: 'all 0.15s ease',
                  width: '100%',
                }}
              >
                {submitting ? 'Sending…' : 'Start the Conversation →'}
              </button>

              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  textAlign: 'center',
                  color: isInternal ? '#94a3b8' : 'rgba(255,255,255,0.35)',
                }}
              >
                Or email us directly at{' '}
                <a
                  href="mailto:sales@forgetomorrow.com"
                  style={{ color: ORANGE, textDecoration: 'none', fontWeight: 600 }}
                >
                  sales@forgetomorrow.com
                </a>
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Reusable field ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text', isInternal }) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: isInternal ? '#334155' : 'rgba(255,255,255,0.60)',
          marginBottom: 6,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '11px 13px',
          borderRadius: 10,
          border: isInternal
            ? '1px solid rgba(51,65,85,0.25)'
            : '1px solid rgba(255,255,255,0.14)',
          background: isInternal ? '#ffffff' : 'rgba(255,255,255,0.06)',
          color: isInternal ? '#112033' : '#ffffff',
          fontSize: 14,
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────────
export default function Advertise() {
  const router = useRouter();
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'public' | 'seeker' | 'recruiter' | 'coach'

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('not authed');
        return r.json();
      })
      .then((data) => {
  if (!alive) return;

  // me.js returns 200 with user: null when logged out
  if (!data?.user) {
    setAuthState('public');
    return;
  }

  const role = String(data?.user?.role || data?.role || '').toUpperCase();
  const plan = String(data?.user?.plan || data?.plan || '').toUpperCase();

        if (role === 'COACH') {
          setAuthState('coach');
        } else if (
          role === 'RECRUITER' ||
          role === 'OWNER' ||
          role === 'ADMIN' ||
          role === 'BILLING' ||
          plan === 'SMALL_BIZ' ||
          plan === 'ENTERPRISE'
        ) {
          setAuthState('recruiter');
        } else {
          setAuthState('seeker');
        }
      })
      .catch(() => {
        if (alive) setAuthState('public');
      });

    return () => {
      alive = false;
    };
  }, []);

  // ── Still detecting auth — render nothing to avoid flash ──
  if (authState === 'loading') {
    return (
      <Head>
        <title>Advertise — ForgeTomorrow</title>
      </Head>
    );
  }

  // ── Public visitor — _app.js provides LandingHeader + LandingFooter ──
  if (authState === 'public') {
  return (
    <>
      <Head>
        <title>Advertise — ForgeTomorrow</title>
        <meta
          name="description"
          content="Reach job seekers, recruiters, and career coaches on ForgeTomorrow. Intent-based advertising with zero user data sold."
        />
      </Head>
      <LandingHeader />
      <AdvertiseContent isInternal={false} />
    </>
  );
}

  // ── Logged-in coach ──
  if (authState === 'coach') {
    return (
      <CoachingLayout
        title="Advertise - ForgeTomorrow"
        activeNav=""
      >
        <AdvertiseContent isInternal={true} />
      </CoachingLayout>
    );
  }

  // ── Logged-in recruiter ──
  if (authState === 'recruiter') {
    return (
      <RecruiterLayout
        title="Advertise - ForgeTomorrow"
        activeNav=""
      >
        <AdvertiseContent isInternal={true} />
      </RecruiterLayout>
    );
  }

  // ── Logged-in seeker (default for all other auth states) ──
  return (
    <SeekerLayout
      title="Advertise - ForgeTomorrow"
      activeNav=""
    >
      <AdvertiseContent isInternal={true} />
    </SeekerLayout>
  );
}