// components/layouts/RecruiterLayout.js
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePlan } from '@/context/PlanContext';

import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

// ✅ Mobile bottom bar + support floating button
import MobileBottomBar from '@/components/mobile/MobileBottomBar';
import SupportFloatingButton from '@/components/SupportFloatingButton';

// Profile-standard glass
const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

function normalizeChrome(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return '';
  if (raw === 'recruiter-ent' || raw === 'recruiter_enterprise' || raw === 'enterprise' || raw === 'ent')
    return 'recruiter-ent';
  if (raw === 'recruiter-smb' || raw === 'recruiter_smb' || raw === 'smb' || raw === 'recruiter')
    return 'recruiter-smb';
  if (raw.startsWith('recruiter')) {
    if (raw.includes('ent') || raw.includes('enterprise')) return 'recruiter-ent';
    return 'recruiter-smb';
  }
  return '';
}

function setQueryChrome(router, chrome) {
  try {
    if (!router?.isReady) return;
    const nextChrome = normalizeChrome(chrome);
    if (!nextChrome) return;

    const current = normalizeChrome(router.query?.chrome);
    if (current === nextChrome) return;

    const nextQuery = { ...router.query, chrome: nextChrome };
    router.replace({ pathname: router.pathname, query: nextQuery }, undefined, {
      shallow: true,
      scroll: false,
    });
  } catch {
    // no-throw
  }
}

function chromeToVariant(chromeMode) {
  const c = normalizeChrome(chromeMode);
  if (c === 'recruiter-ent') return 'enterprise';
  if (c === 'recruiter-smb') return 'smb';
  return null;
}

export default function RecruiterLayout({
  title = 'ForgeTomorrow — Recruiter',
  header,
  right,
  children,
  headerCard = true,
  role: roleProp = 'recruiter',
  variant: variantProp = 'smb',
  counts,
  initialOpen,
  activeNav = 'dashboard',
}) {
  const router = useRouter();
  const hasRight = Boolean(right);

  const { isLoaded: planLoaded, plan, role: planRole } = usePlan();

  // --- Mobile detection ---
  const [isMobile, setIsMobile] = useState(true);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- DB-first recruiter chrome: enterprise users must be recruiter-ent ---
  const chromeMode = useMemo(() => {
    const urlChrome = normalizeChrome(router?.query?.chrome);

    // DB truth
    const dbPlan = String(plan || '').toLowerCase();
    const isEnterprise = dbPlan === 'enterprise';

    // If URL asked for recruiter chrome, we will canonicalize in an effect.
    if (urlChrome) return urlChrome;

    // No URL chrome: use DB preference once loaded, else safe default
    if (planLoaded) return isEnterprise ? 'recruiter-ent' : 'recruiter-smb';
    return 'recruiter-smb';
  }, [router?.query?.chrome, planLoaded, plan]);

  // Canonicalize URL based on DB once loaded (kills SMB reinfection)
  useEffect(() => {
    if (!router?.isReady) return;
    if (!planLoaded) return;

    const urlChrome = normalizeChrome(router.query?.chrome);

    const dbPlan = String(plan || '').toLowerCase();
    const isEnterprise = dbPlan === 'enterprise';

    const canonical = isEnterprise ? 'recruiter-ent' : 'recruiter-smb';

    // Only force-correct recruiter chrome values (don’t stomp other pages’ modes)
    if (urlChrome === 'recruiter-smb' || urlChrome === 'recruiter-ent') {
      setQueryChrome(router, canonical);
    } else if (!urlChrome) {
      // Stamp chrome for recruiter pages to keep internal nav consistent
      setQueryChrome(router, canonical);
    }
  }, [router?.isReady, router?.query?.chrome, planLoaded, plan]);

  // Variant: allow DB chrome to control unless explicitly passed enterprise
  const resolvedVariant = useMemo(() => {
    const inferred = chromeToVariant(chromeMode);
    if (!inferred) return variantProp;
    if (variantProp === 'enterprise') return 'enterprise';
    if (variantProp === 'smb') return inferred;
    return variantProp;
  }, [chromeMode, variantProp]);

  // Optional: prefer PlanContext role if present (prevents passing stale role props)
  const resolvedRole = planRole || roleProp;

  // --- Desktop vs mobile grid configs ---
  const GAP = 12;
  const PAD = 16;
  const LEFT_W = 240;
  const RIGHT_W = 240;

  const desktopGrid = {
    display: 'grid',
    gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr) ${hasRight ? `${RIGHT_W}px` : '0px'}`,
    gridTemplateRows: 'auto 1fr',
    gridTemplateAreas: hasRight
      ? `"left header right"
         "left content right"`
      : `"left header header"
         "left content content"`,
  };

  const mobileGrid = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: hasRight ? 'auto auto auto' : 'auto auto',
    gridTemplateAreas: hasRight
      ? `"header"
         "content"
         "right"`
      : `"header"
         "content"`,
  };

  const gridStyles = isMobile ? mobileGrid : desktopGrid;

  const rightRailStyle = {
    gridArea: 'right',
    alignSelf: 'start',
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    minHeight: 120,
    boxSizing: 'border-box',
    width: isMobile ? '100%' : RIGHT_W,
    minWidth: isMobile ? 0 : RIGHT_W,
    maxWidth: isMobile ? '100%' : RIGHT_W,
    minInlineSize: 0,
    color: 'white',
  };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <RecruiterHeader />

      <div
        style={{
          ...gridStyles,
          gap: GAP,
          paddingTop: PAD,
          paddingBottom: isMobile ? PAD + 84 : PAD,
          paddingLeft: PAD,
          paddingRight: hasRight ? Math.max(8, PAD - 4) : PAD,
          alignItems: 'start',
          boxSizing: 'border-box',

          // ✅ FIX (mobile overflow): hard clamp layout to viewport
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
          minWidth: 0,
        }}
      >
        <aside
          style={{
            gridArea: 'left',
            alignSelf: 'start',
            minWidth: 0,
            display: isMobile ? 'none' : 'block',
          }}
        >
          <RecruiterSidebar
            active={activeNav}
            role={resolvedRole}
            variant={resolvedVariant}
            counts={counts}
            initialOpen={initialOpen}
          />
        </aside>

        {headerCard ? (
          <section
            style={{
              gridArea: 'header',
              borderRadius: 14,
              padding: '8px 12px',
              minWidth: 0,
              boxSizing: 'border-box',
              ...GLASS,
            }}
          >
            {header}
          </section>
        ) : (
          <header style={{ gridArea: 'header', alignSelf: 'start', minWidth: 0 }}>
            {header}
          </header>
        )}

        {hasRight && <aside style={rightRailStyle}>{right}</aside>}

        <main
          style={{
            gridArea: 'content',
            minWidth: 0,

            // ✅ Safety net: prevent child rows from forcing horizontal scroll
            width: '100%',
            maxWidth: '100%',
            overflowX: 'hidden',
          }}
        >
          <div style={{ display: 'grid', gap: GAP, width: '100%', minWidth: 0, maxWidth: '100%' }}>
            {children}
          </div>
        </main>
      </div>

      <SupportFloatingButton />

      <MobileBottomBar isMobile={isMobile} chromeMode={chromeMode} onOpenTools={() => setMobileToolsOpen(true)} />

      {isMobile && mobileToolsOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={() => setMobileToolsOpen(false)}
            aria-label="Dismiss Tools"
            style={{
              position: 'absolute',
              inset: 0,
              border: 'none',
              background: 'rgba(0,0,0,0.55)',
              cursor: 'pointer',
            }}
          />

          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: 'min(760px, 100%)',
              maxHeight: '82vh',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              border: '1px solid rgba(255,255,255,0.22)',
              background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              padding: 16,
              boxSizing: 'border-box',
              overflowY: 'auto',
              boxShadow: '0 -10px 26px rgba(0,0,0,0.22)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800, color: '#112033' }}>Tools</div>
              <button
                type="button"
                onClick={() => setMobileToolsOpen(false)}
                aria-label="Close Tools"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 22,
                  lineHeight: 1,
                  color: '#546E7A',
                }}
              >
                ×
              </button>
            </div>

            <RecruiterSidebar
              active={activeNav}
              role={resolvedRole}
              variant={resolvedVariant}
              counts={counts}
              initialOpen={initialOpen}
            />
          </div>
        </div>
      )}
    </>
  );
}
