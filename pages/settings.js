// pages/settings.js
import Head from 'next/head';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import InternalLayout from '@/components/layouts/InternalLayout';

// ── Default wallpaper — same fallback used on profile pages ──
const DEFAULT_WALLPAPER = '/images/profile-fallbacks/profile-default-wallpaper.png';

// ── Shared style tokens ──────────────────────────────────────
const GLASS = {
  borderRadius: 16,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(13, 27, 42, 0.62)',
  boxShadow: '0 10px 32px rgba(0,0,0,0.38)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
};

const GLASS_LIGHT = {
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.07)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.20)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const FIELD = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.07)',
  fontSize: 14,
  color: '#ECEFF1',
  width: '100%',
  boxSizing: 'border-box',
};

const LABEL = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#90A4AE',
  marginBottom: 6,
  display: 'block',
};

const DIVIDER = {
  border: 'none',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  margin: '4px 0',
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

// ── Section chip ─────────────────────────────────────────────
function SectionChip({ label }) {
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      padding: '3px 10px',
      borderRadius: 999,
      border: '1px solid rgba(255,112,67,0.40)',
      color: '#FF7043',
      background: 'rgba(255,112,67,0.12)',
    }}>
      {label}
    </span>
  );
}

// ── Button variants ───────────────────────────────────────────
function PillBtn({ children, onClick, variant = 'ghost', type = 'button', disabled, fullWidth }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '10px 20px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    transition: 'all 0.18s ease',
    border: 'none',
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
    width: fullWidth ? '100%' : undefined,
  };

  const variants = {
    primary: {
      background: 'linear-gradient(135deg, #FF7043, #F4511E)',
      color: '#fff',
      boxShadow: '0 4px 16px rgba(255,112,67,0.45)',
    },
    ghost: {
      background: 'rgba(255,255,255,0.08)',
      color: '#CFD8DC',
      border: '1px solid rgba(255,255,255,0.16)',
    },
    danger: {
      background: 'rgba(183,28,28,0.18)',
      color: '#EF9A9A',
      border: '1px solid rgba(239,154,154,0.32)',
    },
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

// ── Settings row ─────────────────────────────────────────────
function SettingsRow({ title, description, children, last, isMobile }) {
  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        gap: isMobile ? 12 : 16,
        flexWrap: 'wrap',
        padding: '4px 0',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#ECEFF1' }}>{title}</p>
          {description && (
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#78909C', lineHeight: 1.55 }}>{description}</p>
          )}
        </div>
        <div style={{ width: isMobile ? '100%' : undefined, flexShrink: 0 }}>
          {/* On mobile, stretch buttons to full width */}
          {isMobile
            ? <div style={{ width: '100%' }}>{children}</div>
            : children
          }
        </div>
      </div>
      {!last && <hr style={DIVIDER} />}
    </>
  );
}

// ── Glass section card ────────────────────────────────────────
function SettingsSection({ title, chip, children, isMobile }) {
  return (
    <section style={{
      ...GLASS,
      padding: isMobile ? '20px 18px' : '24px 28px',
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? 16 : 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{
          margin: 0,
          fontSize: isMobile ? 16 : 18,
          fontWeight: 800,
          color: '#ECEFF1',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
        {chip && <SectionChip label={chip} />}
      </div>
      {children}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────
// INNER PAGE CONTENT
// ────────────────────────────────────────────────────────────────
function SettingsContent() {
  const router  = useRouter();
  const chrome  = String(router.query.chrome || '').toLowerCase();
  const isMobile = useIsMobile(768);

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
      } catch {
        if (!cancelled) { setMe(null); setMeLoading(false); }
      }
    }
    loadMe();
    return () => { cancelled = true; };
  }, []);

  const email = useMemo(() => {
    if (meLoading) return 'Loading…';
    return me?.email || 'Unknown';
  }, [meLoading, me]);

  const name = useMemo(() => {
    if (meLoading) return 'Loading…';
    return me?.name || me?.fullName || me?.displayName || 'Unnamed (set during signup)';
  }, [meLoading, me]);

  const plan = useMemo(() => {
    if (meLoading) return 'Loading…';
    return me?.plan || 'Unknown';
  }, [meLoading, me]);

  async function handleManageBillingClick() {
    try {
      const res  = await fetch('/api/billing/portal', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error || 'We could not open the billing portal right now. Please contact support.');
        return;
      }
      const data = await res.json();
      if (data?.url) { window.location.href = data.url; }
      else alert('We were unable to open the billing portal. Please contact support@forgetomorrow.com.');
    } catch (err) {
      console.error('[Settings] Billing portal error:', err);
      alert('Something went wrong opening billing. Please contact support@forgetomorrow.com.');
    }
  }

  function handleLogoutClick() {
    window.location.href = chrome ? `/logout?chrome=${chrome}` : '/logout';
  }

  // Wait for mobile detection before rendering to avoid SSR mismatch
  if (isMobile === null) return null;

  return (
    <>
      <Head>
        <title>Settings • ForgeTomorrow</title>
      </Head>

      <div style={{
        maxWidth: isMobile ? '100%' : 780,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 10 : 12,
        // Extra bottom padding on mobile so site toolbar doesn't overlap content
        paddingBottom: isMobile ? 100 : 40,
        padding: isMobile ? '0 0 100px' : undefined,
      }}>

        {/* ── Hero header ──────────────────────────────────── */}
        <header style={{
          ...GLASS,
          padding: isMobile ? '20px 18px' : '28px 32px',
          background: 'rgba(10, 14, 20, 0.72)',
          borderTop: '2px solid rgba(255,112,67,0.55)',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: isMobile ? 14 : 16,
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute', top: -40, right: -40,
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,112,67,0.20) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 18 }}>
            <div style={{
              width: isMobile ? 44 : 52,
              height: isMobile ? 44 : 52,
              borderRadius: 14,
              flexShrink: 0,
              background: 'linear-gradient(135deg, #FF7043, #F4511E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isMobile ? 20 : 24,
              boxShadow: '0 4px 20px rgba(255,112,67,0.45)',
            }}>
              ⚙️
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: isMobile ? 22 : 28,
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}>
                Settings
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: isMobile ? 12 : 14, color: '#78909C' }}>
                {isMobile ? 'Account, privacy & billing.' : 'Manage your account, privacy, and billing in one place.'}
              </p>
            </div>
          </div>
        </header>

        {/* ── Account ──────────────────────────────────────── */}
        <SettingsSection title="Account" chip="Core" isMobile={isMobile}>
          {/* Fields — stack on mobile, side by side on desktop */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: isMobile ? 12 : 16,
          }}>
            <div>
              <label style={LABEL}>Email</label>
              <div style={{ ...FIELD, cursor: 'default', fontSize: isMobile ? 13 : 14 }}>{email}</div>
            </div>
            <div>
              <label style={LABEL}>Name</label>
              <div style={{ ...FIELD, cursor: 'default', fontSize: isMobile ? 13 : 14 }}>{name}</div>
            </div>
          </div>
          <hr style={DIVIDER} />
          {/* Actions — full width on mobile, pill row on desktop */}
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <PillBtn variant="ghost" fullWidth>🔑 Change password</PillBtn>
              <PillBtn variant="primary" onClick={handleLogoutClick} fullWidth>→ Log out</PillBtn>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <PillBtn variant="ghost">🔑 Change password</PillBtn>
              <PillBtn variant="primary" onClick={handleLogoutClick}>→ Log out</PillBtn>
            </div>
          )}
        </SettingsSection>

        {/* ── Privacy & data ───────────────────────────────── */}
        <SettingsSection title="Privacy &amp; data" chip="Compliance" isMobile={isMobile}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SettingsRow
              isMobile={isMobile}
              title="Email updates &amp; product news"
              description="Get occasional updates about new features, product changes, and important account notices."
            >
              <PillBtn variant="ghost" fullWidth={isMobile}>Manage</PillBtn>
            </SettingsRow>
            <SettingsRow
              isMobile={isMobile}
              title="Download my data"
              description="Request a copy of the personal data associated with your ForgeTomorrow account."
            >
              <PillBtn variant="ghost" fullWidth={isMobile}>↓ Request export</PillBtn>
            </SettingsRow>
            <SettingsRow
              isMobile={isMobile}
              title="Delete my account"
              description="Permanently delete your account and all personal data, subject to legal retention requirements."
              last
            >
              <PillBtn variant="danger" fullWidth={isMobile}>✕ Delete account</PillBtn>
            </SettingsRow>
          </div>
        </SettingsSection>

        {/* ── Billing & subscription ───────────────────────── */}
        <SettingsSection title="Billing &amp; subscription" chip="Plan" isMobile={isMobile}>
          {/* Plan highlight */}
          <div style={{
            ...GLASS_LIGHT,
            padding: isMobile ? '14px 16px' : '16px 20px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: isMobile ? 14 : 14,
            borderLeft: '3px solid #FF7043',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: '#78909C', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Current plan
              </p>
              <p style={{ margin: '4px 0 0', fontSize: isMobile ? 20 : 22, fontWeight: 900, color: '#FF7043', letterSpacing: '-0.01em' }}>
                {plan}
              </p>
            </div>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                <PillBtn variant="primary" onClick={handleManageBillingClick} fullWidth>
                  💳 Manage billing
                </PillBtn>
                <PillBtn variant="ghost" onClick={() => (window.location.href = '/pricing')} fullWidth>
                  View plans
                </PillBtn>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <PillBtn variant="primary" onClick={handleManageBillingClick}>
                  💳 Manage billing
                </PillBtn>
                <PillBtn variant="ghost" onClick={() => (window.location.href = '/pricing')}>
                  View plans
                </PillBtn>
              </div>
            )}
          </div>
          <hr style={DIVIDER} />
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#ECEFF1' }}>
              Invoices &amp; receipts
            </p>
            <p style={{ margin: 0, fontSize: 13, color: '#78909C', lineHeight: 1.6 }}>
              Your billing history will appear here once fully connected. In the meantime, reach out to{' '}
              <a href="mailto:support@forgetomorrow.com" style={{ color: '#FF7043', textDecoration: 'none', fontWeight: 600 }}>
                support@forgetomorrow.com
              </a>{' '}
              if you need help with a payment.
            </p>
          </div>
        </SettingsSection>

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