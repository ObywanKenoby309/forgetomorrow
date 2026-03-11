// pages/settings.js
import Head from 'next/head';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import InternalLayout from '@/components/layouts/InternalLayout';

const DEFAULT_WALLPAPER = '/images/profile-fallbacks/profile-default-wallpaper.png';

// ── Style tokens ─────────────────────────────────────────────
const GLASS = {
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(13,27,42,0.62)',
  boxShadow: '0 10px 32px rgba(0,0,0,0.38)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const GLASS_LIGHT = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const GLASS_DANGER = {
  borderRadius: 16,
  border: '1px solid rgba(239,154,154,0.18)',
  background: 'rgba(40,10,10,0.65)',
  boxShadow: '0 10px 32px rgba(0,0,0,0.38)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const DIVIDER = {
  border: 'none',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  margin: '4px 0',
};

const DANGER_DIVIDER = {
  border: 'none',
  borderTop: '1px solid rgba(239,154,154,0.12)',
  margin: '4px 0',
};

const LABEL = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#90A4AE',
  marginBottom: 6, display: 'block',
};

// ── SSR-safe mobile hook ─────────────────────────────────────
function useIsMobile(bp = 768) {
  const [val, setVal] = useState(null);
  useEffect(() => {
    const check = () => setVal(window.innerWidth < bp);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [bp]);
  return val;
}

// ── Locked field ─────────────────────────────────────────────
function LockedField({ label, value }) {
  return (
    <div>
      <label style={LABEL}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div style={{
          padding: '10px 36px 10px 14px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.04)',
          fontSize: 14, color: '#78909C',
          cursor: 'not-allowed', userSelect: 'none',
        }}>
          {value}
        </div>
        <span aria-hidden="true" style={{
          position: 'absolute', right: 12, top: '50%',
          transform: 'translateY(-50%)', fontSize: 12, opacity: 0.4,
        }}>🔒</span>
      </div>
    </div>
  );
}

// ── Pill button ───────────────────────────────────────────────
function PillBtn({ children, onClick, variant = 'ghost', type = 'button', disabled, loading, fullWidth }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: '10px 20px', borderRadius: 999, fontSize: 13,
    fontWeight: 700, cursor: disabled || loading ? 'default' : 'pointer',
    transition: 'all 0.18s ease', border: 'none', outline: 'none',
    opacity: disabled || loading ? 0.6 : 1, whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : undefined, boxSizing: 'border-box',
  };
  const variants = {
    primary: { background: 'linear-gradient(135deg,#FF7043,#F4511E)', color: '#fff', boxShadow: '0 4px 16px rgba(255,112,67,0.45)' },
    ghost:   { background: 'rgba(255,255,255,0.08)', color: '#CFD8DC', border: '1px solid rgba(255,255,255,0.16)' },
    danger:  { background: 'rgba(183,28,28,0.25)', color: '#EF9A9A', border: '1px solid rgba(239,154,154,0.35)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      style={{ ...base, ...variants[variant] }}>
      {loading ? '…' : children}
    </button>
  );
}

// ── Section label (orange, uppercase, line) ───────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
      textTransform: 'uppercase', color: '#FF7043', marginBottom: 16,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,112,67,0.3), transparent)', borderRadius: 1 }} />
    </div>
  );
}

// ── Settings row ─────────────────────────────────────────────
function SettingsRow({ title, description, children, last, danger }) {
  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
        flexWrap: 'wrap', padding: '6px 0',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: danger ? '#FFCDD2' : '#ECEFF1' }}>{title}</p>
          {description && (
            <p style={{ margin: '3px 0 0', fontSize: 12, color: danger ? '#EF9A9A' : '#78909C', lineHeight: 1.55, opacity: 0.85 }}>
              {description}
            </p>
          )}
        </div>
        <div style={{ flexShrink: 0 }}>{children}</div>
      </div>
      {!last && <hr style={danger ? DANGER_DIVIDER : DIVIDER} />}
    </>
  );
}

// ── Password change row ───────────────────────────────────────
function PasswordChangeRow({ email }) {
  const [status, setStatus] = useState('idle');
  async function handle() {
    if (!email || status === 'loading' || status === 'sent') return;
    setStatus('loading');
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus('sent');
    } catch { setStatus('error'); }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <PillBtn variant="ghost" onClick={handle} loading={status === 'loading'} disabled={status === 'sent'}>
        {status === 'sent' ? '✓ Reset email sent' : '🔑 Change password'}
      </PillBtn>
      {status === 'sent' && (
        <p style={{ margin: 0, fontSize: 12, color: '#80CBC4', background: 'rgba(0,150,136,0.12)', border: '1px solid rgba(0,150,136,0.25)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.55 }}>
          ✓ A reset link has been sent to <strong>{email}</strong>. It expires in 15 minutes.
        </p>
      )}
      {status === 'error' && (
        <p style={{ margin: 0, fontSize: 12, color: '#EF9A9A', background: 'rgba(183,28,28,0.12)', border: '1px solid rgba(239,154,154,0.25)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.55 }}>
          Something went wrong. Please try again or contact support@forgetomorrow.com.
        </p>
      )}
    </div>
  );
}

// ── Delete account confirm ────────────────────────────────────
function DeleteAccountConfirm() {
  const [step, setStep] = useState('idle');
  if (step === 'confirm') {
    return (
      <div style={{ background: 'rgba(183,28,28,0.18)', border: '1px solid rgba(239,154,154,0.30)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#FFCDD2', fontWeight: 600, lineHeight: 1.5 }}>
          ⚠️ This cannot be undone. Your profile, resume, and all data will be permanently deleted.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <PillBtn variant="danger" onClick={() => { alert('Please contact support@forgetomorrow.com to delete your account.'); setStep('idle'); }}>
            ✕ Yes, delete my account
          </PillBtn>
          <PillBtn variant="ghost" onClick={() => setStep('idle')}>Cancel</PillBtn>
        </div>
      </div>
    );
  }
  return (
    <SettingsRow title="Delete my account" description="Permanently delete your account and all personal data, subject to legal retention requirements." last danger>
      <PillBtn variant="danger" onClick={() => setStep('confirm')}>✕ Delete account</PillBtn>
    </SettingsRow>
  );
}

// ── The 4 carousel card contents ─────────────────────────────

function BillingCard({ plan, onManageBilling }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <SectionLabel>Current plan</SectionLabel>
      <div style={{ ...GLASS_LIGHT, padding: '16px 20px', borderLeft: '3px solid #FF7043' }}>
        <p style={{ margin: 0, fontSize: 11, color: '#78909C', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Plan</p>
        <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 900, color: '#FF7043', letterSpacing: '-0.01em' }}>{plan}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <PillBtn variant="primary" onClick={onManageBilling} fullWidth>💳 Manage billing</PillBtn>
        <PillBtn variant="ghost" onClick={() => (window.location.href = '/pricing')} fullWidth>View plans</PillBtn>
      </div>
      <hr style={DIVIDER} />
      <div>
        <p style={{ margin: '0 0 5px', fontSize: 13, fontWeight: 600, color: '#ECEFF1' }}>Invoices &amp; receipts</p>
        <p style={{ margin: 0, fontSize: 12, color: '#78909C', lineHeight: 1.6 }}>
          Your billing history will appear here once fully connected. Reach out to{' '}
          <a href="mailto:support@forgetomorrow.com" style={{ color: '#FF7043', textDecoration: 'none', fontWeight: 600 }}>
            support@forgetomorrow.com
          </a>{' '}
          if you need help with a payment.
        </p>
      </div>
    </div>
  );
}

function PrivacyCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <SectionLabel>Your data</SectionLabel>
      <SettingsRow
        title="Download my data"
        description="Request a copy of the personal data associated with your ForgeTomorrow account."
      >
        <PillBtn variant="ghost">↓ Request export</PillBtn>
      </SettingsRow>
      <hr style={DIVIDER} />
      <SectionLabel>Danger zone</SectionLabel>
      <DeleteAccountConfirm />
    </div>
  );
}

function SecurityCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <SectionLabel>Security</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* MFA placeholder */}
        <div style={{ ...GLASS_LIGHT, padding: '16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#ECEFF1' }}>Two-factor authentication</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#78909C', lineHeight: 1.5 }}>Add an extra layer of security to your account.</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', color: '#78909C', background: 'rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
            Coming soon
          </span>
        </div>
        {/* Google sync placeholder */}
        <div style={{ ...GLASS_LIGHT, padding: '16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#ECEFF1' }}>Sign-in methods</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#78909C', lineHeight: 1.5 }}>Manage how you sign in to ForgeTomorrow.</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', color: '#78909C', background: 'rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}

function NotificationsCard() {
  const [emailUpdates, setEmailUpdates] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <SectionLabel>Notifications</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Email updates toggle */}
        <div style={{ ...GLASS_LIGHT, padding: '16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#ECEFF1' }}>Email updates &amp; product news</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#78909C', lineHeight: 1.5 }}>New features, product changes, and important account notices.</p>
          </div>
          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={emailUpdates}
            onClick={() => setEmailUpdates(v => !v)}
            style={{
              flexShrink: 0,
              width: 44, height: 24, borderRadius: 999,
              background: emailUpdates ? 'linear-gradient(135deg,#FF7043,#F4511E)' : 'rgba(255,255,255,0.12)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background 0.2s ease', boxShadow: emailUpdates ? '0 2px 8px rgba(255,112,67,0.4)' : 'none',
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: emailUpdates ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </button>
        </div>
        {/* Mobile notifications placeholder */}
        <div style={{ ...GLASS_LIGHT, padding: '16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#ECEFF1' }}>Mobile push notifications</p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#78909C', lineHeight: 1.5 }}>Get notified on your phone for messages and activity.</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', color: '#78909C', background: 'rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Carousel ─────────────────────────────────────────────────
const CARDS = [
  { id: 'billing',       label: 'Billing & subscription' },
  { id: 'privacy',       label: 'Privacy & data' },
  { id: 'security',      label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
];

function Carousel({ plan, onManageBilling }) {
  const [active, setActive]   = useState(0);
  const [animDir, setAnimDir] = useState(null); // 'left' | 'right' | null
  const [display, setDisplay] = useState(0);    // the index actually rendered
  const trackRef  = useRef(null);
  const touchStart = useRef(null);
  const animating  = useRef(false);

  function navigate(dir) {
    if (animating.current) return;
    const next = active + dir;
    if (next < 0 || next >= CARDS.length) return;
    animating.current = true;
    setAnimDir(dir > 0 ? 'left' : 'right');
    setTimeout(() => {
      setActive(next);
      setDisplay(next);
      setAnimDir(null);
      animating.current = false;
    }, 320);
  }

  // Touch / swipe
  function onTouchStart(e) { touchStart.current = e.touches[0].clientX; }
  function onTouchEnd(e) {
    if (touchStart.current === null) return;
    const dx = touchStart.current - e.changedTouches[0].clientX;
    touchStart.current = null;
    if (Math.abs(dx) < 40) return;
    navigate(dx > 0 ? 1 : -1);
  }

  const cardContent = (idx) => {
    switch (CARDS[idx].id) {
      case 'billing':       return <BillingCard plan={plan} onManageBilling={onManageBilling} />;
      case 'privacy':       return <PrivacyCard />;
      case 'security':      return <SecurityCard />;
      case 'notifications': return <NotificationsCard />;
      default:              return null;
    }
  };

  const slideStyle = {
    transform: animDir === 'left'  ? 'translateX(-60px)' :
               animDir === 'right' ? 'translateX(60px)'  : 'translateX(0)',
    opacity:   animDir ? 0 : 1,
    transition: 'transform 0.30s cubic-bezier(0.4,0,0.2,1), opacity 0.30s ease',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Carousel viewport — overflow hidden with peek */}
      <div style={{ position: 'relative' }}>
        {/* Left arrow */}
        <button
          type="button"
          aria-label="Previous"
          onClick={() => navigate(-1)}
          disabled={active === 0}
          style={{
            position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, width: 36, height: 36, borderRadius: '50%',
            background: active === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.14)', color: active === 0 ? '#546E7A' : '#ECEFF1',
            cursor: active === 0 ? 'default' : 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s', backdropFilter: 'blur(8px)',
          }}
        >‹</button>

        {/* Right arrow */}
        <button
          type="button"
          aria-label="Next"
          onClick={() => navigate(1)}
          disabled={active === CARDS.length - 1}
          style={{
            position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, width: 36, height: 36, borderRadius: '50%',
            background: active === CARDS.length - 1 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.14)', color: active === CARDS.length - 1 ? '#546E7A' : '#ECEFF1',
            cursor: active === CARDS.length - 1 ? 'default' : 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s', backdropFilter: 'blur(8px)',
          }}
        >›</button>

        {/* Track with overflow + peek */}
        <div
          ref={trackRef}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{ overflow: 'hidden', borderRadius: 16, padding: '0 32px 0 0' }}
        >
          <div style={{ ...slideStyle }}>
            {/* Current card */}
            <div style={{
              ...GLASS,
              padding: '24px 28px',
              minHeight: 320,
              boxSizing: 'border-box',
            }}>
              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#ECEFF1', letterSpacing: '-0.01em' }}>
                  {CARDS[display].label}
                </h2>
                <span style={{ fontSize: 12, color: '#546E7A', fontWeight: 500 }}>
                  {display + 1} of {CARDS.length}
                </span>
              </div>
              {cardContent(display)}
            </div>
          </div>
        </div>

        {/* Peek ghost of next card */}
        {active < CARDS.length - 1 && (
          <div aria-hidden="true" style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: 28,
            background: 'rgba(13,27,42,0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            borderRadius: '0 16px 16px 0',
            border: '1px solid rgba(255,255,255,0.10)',
            borderLeft: 'none',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, paddingTop: 4 }}>
        {CARDS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-label={`Go to ${c.label}`}
            onClick={() => {
              if (i === active || animating.current) return;
              const dir = i > active ? 1 : -1;
              animating.current = true;
              setAnimDir(dir > 0 ? 'left' : 'right');
              setTimeout(() => {
                setActive(i);
                setDisplay(i);
                setAnimDir(null);
                animating.current = false;
              }, 320);
            }}
            style={{
              width: i === active ? 24 : 8,
              height: 8, borderRadius: 999, border: 'none',
              background: i === active ? '#FF7043' : 'rgba(255,255,255,0.20)',
              cursor: i === active ? 'default' : 'pointer',
              transition: 'all 0.25s ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// PAGE CONTENT
// ────────────────────────────────────────────────────────────────
function SettingsContent() {
  const router    = useRouter();
  const chrome    = String(router.query.chrome || '').toLowerCase();
  const isMobile  = useIsMobile(768);

  const [meLoading, setMeLoading] = useState(true);
  const [me, setMe]               = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res  = await fetch('/api/auth/me', { method: 'GET' });
        if (!res.ok) { if (!cancelled) { setMe(null); setMeLoading(false); } return; }
        const json = await res.json();
        if (!cancelled) { setMe(json?.user || null); setMeLoading(false); }
      } catch { if (!cancelled) { setMe(null); setMeLoading(false); } }
    }
    loadMe();
    return () => { cancelled = true; };
  }, []);

  const email = useMemo(() => meLoading ? 'Loading…' : (me?.email || 'Unknown'), [meLoading, me]);
  const name  = useMemo(() => meLoading ? 'Loading…' : (me?.name || me?.fullName || me?.displayName || 'Unnamed'), [meLoading, me]);
  const plan  = useMemo(() => meLoading ? 'Loading…' : (me?.plan || 'Unknown'), [meLoading, me]);

  async function handleManageBilling() {
    try {
      const res  = await fetch('/api/billing/portal', { method: 'POST' });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d?.error || 'Could not open billing portal. Please contact support.'); return; }
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else alert('Could not open billing portal. Please contact support@forgetomorrow.com.');
    } catch { alert('Something went wrong. Please contact support@forgetomorrow.com.'); }
  }

  function handleLogout() {
    window.location.href = chrome ? `/logout?chrome=${chrome}` : '/logout';
  }

  if (isMobile === null) return null;

  return (
    <>
      <Head><title>Settings • ForgeTomorrow</title></Head>

      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        paddingBottom: isMobile ? 100 : 48,
        // On mobile, allow carousel to bleed to edge for peek effect
        overflow: isMobile ? 'hidden' : 'visible',
      }}>

        {/* ── Title card — centered, orange title, no icon ── */}
        <header style={{
          ...GLASS,
          padding: isMobile ? '20px 18px' : '24px 32px',
          textAlign: 'center',
          borderTop: '2px solid rgba(255,112,67,0.55)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
            width: 300, height: 150, borderRadius: '50%', pointerEvents: 'none',
            background: 'radial-gradient(ellipse, rgba(255,112,67,0.15) 0%, transparent 70%)',
          }} />
          <h1 style={{
            margin: 0, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1,
            fontSize: isMobile ? 26 : 32,
            color: '#FF7043',
          }}>
            Settings
          </h1>
          <p style={{ margin: '6px 0 0', color: '#78909C', fontSize: isMobile ? 12 : 14 }}>
            Manage your account, privacy, and billing in one place.
          </p>
        </header>

        {/* ── Account card ─────────────────────────────────── */}
        <section style={{
          ...GLASS,
          padding: isMobile ? '20px 18px' : '24px 28px',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 800, color: '#ECEFF1', letterSpacing: '-0.01em' }}>
              Account
            </h2>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(255,112,67,0.40)', color: '#FF7043', background: 'rgba(255,112,67,0.12)' }}>
              Core
            </span>
          </div>

          {/* Locked fields */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 12 : 16 }}>
            <LockedField label="Email" value={email} />
            <LockedField label="Name"  value={name} />
          </div>

          {/* Security note */}
          <p style={{
            margin: 0, fontSize: 12, color: '#546E7A', lineHeight: 1.6,
            background: 'rgba(255,255,255,0.04)', borderRadius: 8,
            padding: '10px 14px', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            🔒 To help reduce fraud, your name and email are set during account creation and cannot be changed here. Need to update either? Submit a support ticket to{' '}
            <a href="mailto:support@forgetomorrow.com" style={{ color: '#FF7043', textDecoration: 'none', fontWeight: 600 }}>
              support@forgetomorrow.com
            </a>
          </p>

          <hr style={DIVIDER} />

          {/* Password + logout row */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 10,
          }}>
            <PasswordChangeRow email={email} />
            <PillBtn variant="primary" onClick={handleLogout} fullWidth={isMobile}>
              → Log out
            </PillBtn>
          </div>
        </section>

        {/* ── Carousel ─────────────────────────────────────── */}
        <div style={{ position: 'relative', margin: isMobile ? '0 -4px' : '0 20px' }}>
          <Carousel plan={plan} onManageBilling={handleManageBilling} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#546E7A', marginTop: 4 }}>
          ForgeTomorrow · Building Human-First Career Infrastructure
        </p>
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// EXPORT
// ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <InternalLayout
      title="Settings • ForgeTomorrow"
      activeNav=""
      backgroundOverrideUrl={DEFAULT_WALLPAPER}
    >
      <SettingsContent />
    </InternalLayout>
  );
}