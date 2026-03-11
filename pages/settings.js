// pages/settings.js
import Head from 'next/head';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import SeekerLayout from '@/components/layouts/SeekerLayout';

// ── Style tokens ─────────────────────────────────────────────
const GLASS = {
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.20)',
  background: 'rgba(255,255,255,0.42)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const GLASS_LIGHT = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.20)',
  background: 'rgba(255,255,255,0.28)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
};

const DIVIDER = {
  border: 'none',
  borderTop: '1px solid rgba(15,23,42,0.10)',
  margin: '4px 0',
};

const DANGER_DIVIDER = {
  border: 'none',
  borderTop: '1px solid rgba(239,154,154,0.12)',
  margin: '4px 0',
};

const LABEL = {
  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#425466',
  marginBottom: 6, display: 'block',
};

const SETTINGS_BACKGROUND_IMAGE = '/images/profile-fallbacks/profile-default-wallpaper.png';

// Fixed height for ALL carousel cards — no jumping arrows
const CARD_HEIGHT = 360;

// ── Support URL — respects chrome param ─────────────────────
function getSupportUrl() {
  if (typeof window === 'undefined') return '/support';
  const params = new URLSearchParams(window.location.search);
  const chrome = params.get('chrome');
  return chrome ? `/support?chrome=${chrome}` : '/support';
}

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
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(255,255,255,0.14)',
          fontSize: 14, color: '#485B6D',
          cursor: 'not-allowed', userSelect: 'none',
        }}>
          {value}
        </div>
        <span aria-hidden="true" style={{
          position: 'absolute', right: 12, top: '50%',
          transform: 'translateY(-50%)', fontSize: 12, opacity: 0.45,
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
    ghost:   { background: 'rgba(255,255,255,0.22)', color: '#1C2A38', border: '1px solid rgba(15,23,42,0.12)' },
    danger:  { background: 'rgba(183,28,28,0.25)', color: '#EF9A9A', border: '1px solid rgba(239,154,154,0.35)' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      style={{ ...base, ...variants[variant] }}>
      {loading ? '…' : children}
    </button>
  );
}

// ── Toggle switch ─────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button
      type="button" role="switch" aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        flexShrink: 0, width: 44, height: 24, borderRadius: 999,
        background: value ? 'linear-gradient(135deg,#FF7043,#F4511E)' : 'rgba(0,0,0,0.12)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s ease',
        boxShadow: value ? '0 2px 8px rgba(255,112,67,0.4)' : 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: value ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

// ── Section label ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
      textTransform: 'uppercase', color: '#8F4D32', marginBottom: 12,
    }}>
      {children}
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right,rgba(166,90,58,0.45),transparent)', borderRadius: 1 }} />
    </div>
  );
}

// ── Coming soon row ───────────────────────────────────────────
function ComingSoonRow({ title, description }) {
  return (
    <div style={{ ...GLASS_LIGHT, padding: '14px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#162433' }}>{title}</p>
        {description && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#485B6D', lineHeight: 1.5 }}>{description}</p>}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(15,23,42,0.10)', color: '#55687A', background: 'rgba(255,255,255,0.18)', whiteSpace: 'nowrap' }}>
        Coming soon
      </span>
    </div>
  );
}

// ── Password change ───────────────────────────────────────────
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
          ✓ A reset link has been sent to <strong>{email}</strong>. Expires in 15 minutes.
        </p>
      )}
      {status === 'error' && (
        <p style={{ margin: 0, fontSize: 12, color: '#EF9A9A', background: 'rgba(183,28,28,0.12)', border: '1px solid rgba(239,154,154,0.25)', borderRadius: 8, padding: '8px 12px', lineHeight: 1.55 }}>
          Something went wrong.{' '}
          <a href={getSupportUrl()} style={{ color: '#EF9A9A', fontWeight: 600 }}>Submit a ticket</a> and we'll help you out.
        </p>
      )}
    </div>
  );
}

// ── Delete account ────────────────────────────────────────────
function DeleteAccountRow() {
  const [step, setStep] = useState('idle');
  if (step === 'confirm') {
    return (
      <div style={{ background: 'rgba(183,28,28,0.18)', border: '1px solid rgba(239,154,154,0.30)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#FFCDD2', fontWeight: 600, lineHeight: 1.5 }}>
          ⚠️ This cannot be undone. Your profile, resume, and all data will be permanently deleted.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <PillBtn variant="danger" onClick={() => { window.location.href = getSupportUrl(); setStep('idle'); }}>
            ✕ Yes, delete my account
          </PillBtn>
          <PillBtn variant="ghost" onClick={() => setStep('idle')}>Cancel</PillBtn>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '4px 0' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#FFCDD2' }}>Delete my account</p>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: '#EF9A9A', lineHeight: 1.55, opacity: 0.85 }}>
          Permanently delete your account and all personal data, subject to legal retention requirements.
        </p>
      </div>
      <PillBtn variant="danger" onClick={() => setStep('confirm')}>✕ Delete account</PillBtn>
    </div>
  );
}

// ── The 4 card contents — all rendered at CARD_HEIGHT ─────────

function BillingCard({ plan, onManageBilling }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Current plan</SectionLabel>
      <div style={{ ...GLASS_LIGHT, padding: '14px 18px', borderLeft: '3px solid #C86A43' }}>
        <p style={{ margin: 0, fontSize: 11, color: '#485B6D', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Plan</p>
        <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 900, color: '#1B2937', letterSpacing: '-0.01em' }}>{plan}</p>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <PillBtn variant="primary" onClick={onManageBilling}>💳 Manage billing</PillBtn>
        <PillBtn variant="ghost" onClick={() => (window.location.href = '/pricing')}>View plans</PillBtn>
      </div>
      <hr style={DIVIDER} />
      <div>
        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#162433' }}>Invoices &amp; receipts</p>
        <p style={{ margin: 0, fontSize: 12, color: '#485B6D', lineHeight: 1.6 }}>
          Billing history will appear here once fully connected.{' '}
          <a href={getSupportUrl()} style={{ color: '#C86A43', textDecoration: 'none', fontWeight: 600 }}>
            Submit a ticket
          </a>{' '}
          if you need help with a payment.
        </p>
      </div>
    </div>
  );
}

function PrivacyCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Your data</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '4px 0' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#162433' }}>Download my data</p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#485B6D', lineHeight: 1.55 }}>
            Request a copy of the personal data associated with your ForgeTomorrow account.
          </p>
        </div>
        <PillBtn variant="ghost">↓ Request export</PillBtn>
      </div>
      <hr style={DIVIDER} />
      <SectionLabel>Danger zone</SectionLabel>
      <div style={{ borderRadius: 12, border: '1px solid rgba(239,154,154,0.15)', background: 'rgba(40,10,10,0.40)', padding: '14px 16px' }}>
        <DeleteAccountRow />
      </div>
    </div>
  );
}

function SecurityCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Security</SectionLabel>
      <ComingSoonRow
        title="Two-factor authentication"
        description="Add an extra layer of security to your account."
      />
      <ComingSoonRow
        title="Sign-in methods"
        description="Manage how you sign in to ForgeTomorrow."
      />
    </div>
  );
}

function NotificationsCard() {
  const [emailUpdates, setEmailUpdates] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionLabel>Notifications</SectionLabel>
      <div style={{ ...GLASS_LIGHT, padding: '14px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#162433' }}>Email updates &amp; product news</p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#485B6D', lineHeight: 1.5 }}>
            New features, product changes, and important account notices.
          </p>
        </div>
        <Toggle value={emailUpdates} onChange={setEmailUpdates} />
      </div>
      <ComingSoonRow
        title="Mobile push notifications"
        description="Get notified on your phone for messages and activity."
      />
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
  const [active, setActive] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [direction, setDirection] = useState(null); // 'left' | 'right'
  const [displayed, setDisplayed] = useState(0);
  const touchStartX = useRef(null);

  function wrapIndex(idx) {
    return (idx + CARDS.length) % CARDS.length;
  }

  function goTo(next, dirOverride = null) {
    const wrappedNext = wrapIndex(next);
    if (sliding || wrappedNext === active) return;

    let dir = dirOverride;
    if (!dir) dir = wrappedNext > active ? 'left' : 'right';

    setDirection(dir);
    setSliding(true);

    setTimeout(() => {
      setDisplayed(wrappedNext);
      setActive(wrappedNext);
      setDirection(dir === 'left' ? 'from-right' : 'from-left');
      setTimeout(() => {
        setSliding(false);
        setDirection(null);
      }, 300);
    }, 280);
  }

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e) {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    touchStartX.current = null;
    if (Math.abs(dx) < 44) return;
    if (dx > 0) goTo(active + 1, 'left');
    if (dx < 0) goTo(active - 1, 'right');
  }

  const getSlideStyle = () => {
    if (!sliding && !direction) {
      return {
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease',
      };
    }
    if (direction === 'left') {
      return {
        transform: 'translateX(-48px)',
        opacity: 0,
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease',
      };
    }
    if (direction === 'right') {
      return {
        transform: 'translateX(48px)',
        opacity: 0,
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease',
      };
    }
    if (direction === 'from-right') {
      return {
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease',
      };
    }
    if (direction === 'from-left') {
      return {
        transform: 'translateX(0)',
        opacity: 1,
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease',
      };
    }
    return {};
  };

  const cardContent = (idx) => {
    switch (CARDS[idx].id) {
      case 'billing':       return <BillingCard plan={plan} onManageBilling={onManageBilling} />;
      case 'privacy':       return <PrivacyCard />;
      case 'security':      return <SecurityCard />;
      case 'notifications': return <NotificationsCard />;
      default:              return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          aria-label="Previous"
          onClick={() => goTo(active - 1, 'right')}
          style={{
            flexShrink: 0,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.58)',
            border: '1px solid rgba(255,255,255,0.16)',
            color: '#1C2A38',
            cursor: 'pointer',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >‹</button>

        <div
          style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div style={{ ...getSlideStyle(), paddingLeft: 32, paddingRight: 32 }}>
            <div style={{
              ...GLASS,
              padding: '22px 24px',
              height: CARD_HEIGHT,
              boxSizing: 'border-box',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexShrink: 0 }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#162433', letterSpacing: '-0.01em' }}>
                  {CARDS[displayed].label}
                </h2>
                <span style={{ fontSize: 12, color: '#485B6D', fontWeight: 500 }}>
                  {active + 1} / {CARDS.length}
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: 2 }}>
                {cardContent(displayed)}
              </div>
            </div>
          </div>

          <div
            aria-hidden="true"
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, width: 28,
              background: 'rgba(255,255,255,0.30)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              borderRadius: '16px 0 0 16px',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRight: 'none',
              pointerEvents: 'none',
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: 28,
              background: 'rgba(255,255,255,0.30)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              borderRadius: '0 16px 16px 0',
              border: '1px solid rgba(255,255,255,0.10)',
              borderLeft: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        <button
          type="button"
          aria-label="Next"
          onClick={() => goTo(active + 1, 'left')}
          style={{
            flexShrink: 0,
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.58)',
            border: '1px solid rgba(255,255,255,0.16)',
            color: '#1C2A38',
            cursor: 'pointer',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.18s', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >›</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        {CARDS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-label={`Go to ${c.label}`}
            onClick={() => goTo(i, i > active ? 'left' : 'right')}
            style={{
              width: i === active ? 24 : 8,
              height: 8, borderRadius: 999, border: 'none', padding: 0,
              background: i === active ? '#C86A43' : 'rgba(15,23,42,0.18)',
              cursor: i === active ? 'default' : 'pointer',
              transition: 'all 0.25s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SettingsContent() {
  const router = useRouter();
  const chrome = String(router.query.chrome || '').toLowerCase();
  const isMobile = useIsMobile(768);

  const [meLoading, setMeLoading] = useState(true);
  const [me, setMe] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me', { method: 'GET' });
        if (!res.ok) {
          if (!cancelled) {
            setMe(null);
            setMeLoading(false);
          }
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          setMe(json?.user || null);
          setMeLoading(false);
        }
      } catch {
        if (!cancelled) {
          setMe(null);
          setMeLoading(false);
        }
      }
    }
    loadMe();
    return () => { cancelled = true; };
  }, []);

  const email = useMemo(() => meLoading ? 'Loading…' : (me?.email || 'Unknown'), [meLoading, me]);
  const name = useMemo(() => meLoading ? 'Loading…' : (me?.name || me?.fullName || me?.displayName || 'Unnamed'), [meLoading, me]);
  const plan = useMemo(() => meLoading ? 'Loading…' : (me?.plan || 'Unknown'), [meLoading, me]);

  async function handleManageBilling() {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        alert(d?.error || 'Could not open billing portal.');
        return;
      }
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else { window.location.href = getSupportUrl(); }
    } catch {
      window.location.href = getSupportUrl();
    }
  }

  function handleLogout() {
    window.location.href = chrome ? `/logout?chrome=${chrome}` : '/logout';
  }

  if (isMobile === null) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: isMobile ? 100 : 40 }}>
      <header style={{
        ...GLASS,
        padding: isMobile ? '20px 18px' : '22px 32px',
        textAlign: 'center',
        borderTop: '2px solid rgba(200,106,67,0.42)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
          width: 300, height: 150, borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(ellipse, rgba(200,106,67,0.10) 0%, transparent 70%)',
        }} />
        <h1 style={{
          margin: 0, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1,
          fontSize: isMobile ? 24 : 30, color: '#1B2937',
        }}>
          Settings
        </h1>
        <p style={{ margin: '6px 0 0', color: '#485B6D', fontSize: isMobile ? 12 : 14 }}>
          Manage your account, privacy, and billing in one place.
        </p>
      </header>

      <section style={{ ...GLASS, padding: isMobile ? '20px 18px' : '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? 15 : 17, fontWeight: 800, color: '#162433', letterSpacing: '-0.01em' }}>Account</h2>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(200,106,67,0.34)', color: '#8F4D32', background: 'rgba(200,106,67,0.10)' }}>Core</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: isMobile ? 10 : 14 }}>
          <LockedField label="Email" value={email} />
          <LockedField label="Name" value={name} />
        </div>

        <p style={{ margin: 0, fontSize: 12, color: '#223043', lineHeight: 1.6, background: 'rgba(255,255,255,0.16)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.10)' }}>
          🔒 To help prevent fraud, your name and email are set during account creation and cannot be changed here. To update either, please{' '}
          <a href={getSupportUrl()} style={{ color: '#C86A43', textDecoration: 'none', fontWeight: 600 }}>submit a ticket through the Support Center</a>.
        </p>

        <hr style={DIVIDER} />

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 10, alignItems: isMobile ? 'stretch' : 'center' }}>
          <PasswordChangeRow email={email} />
          <PillBtn variant="primary" onClick={handleLogout} fullWidth={isMobile}>→ Log out</PillBtn>
        </div>
      </section>

      <Carousel plan={plan} onManageBilling={handleManageBilling} />

      <p style={{ textAlign: 'center', fontSize: 12, color: '#55687A', marginTop: 4 }}>
        ForgeTomorrow · The future of careers and networking.
      </p>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <SeekerLayout
      title="Settings • ForgeTomorrow"
      activeNav=""
      right={<div />}
      rightVariant="light"
      disableUserWallpaper
      backgroundImageOverride={SETTINGS_BACKGROUND_IMAGE}
    >
      <SettingsContent />
    </SeekerLayout>
  );
}