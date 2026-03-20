// components/layouts/RecruiterLayout.js
//
// Layout switching is handled entirely by CSS media queries (breakpoint: 1024px).
// JavaScript state (isMobile) is kept ONLY for:
//   - MobileBottomBar prop (behavioral, not layout)
//   - mobileToolsOpen overlay (behavioral, not layout)
//   - background-attachment (no layout impact)
// This eliminates the hasMounted race condition that caused the desktop layout
// to flash on mobile before JS could correct it.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePlan } from '@/context/PlanContext';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';

import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

import MobileBottomBar from '@/components/mobile/MobileBottomBar';
import SupportFloatingButton from '@/components/SupportFloatingButton';

const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.68)',
  boxShadow: '0 10px 28px rgba(15,23,42,0.12)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

// ─── All layout breakpoint logic lives here — fires before JS runs ────────────
const LAYOUT_CSS = `
  @media (max-width: 1023px) {
    .ft-rl-grid {
      grid-template-columns: 1fr !important;
      grid-template-rows: auto !important;
      grid-template-areas: "content" !important;
      padding-bottom: 100px !important;
      padding-right: 16px !important;
    }
    .ft-rl-left  { display: none !important; }
    .ft-rl-right { display: none !important; }
    .ft-rl-main  { overflow-x: hidden !important; grid-area: content !important; }
    .ft-bg-fixed { background-attachment: scroll !important; }

    .ft-filter-row   { flex-direction: column !important; align-items: flex-start !important; }
    .ft-filter-strip { flex-wrap: nowrap !important; overflow-x: auto !important;
                       -webkit-overflow-scrolling: touch !important; scrollbar-width: none !important; }
    .ft-filter-strip::-webkit-scrollbar { display: none !important; }
    .ft-filter-stack { flex-direction: column !important; align-items: stretch !important; }
    .ft-filter-full  { width: 100% !important; box-sizing: border-box !important; }
    .ft-refresh-desktop { display: none !important; }
    .ft-refresh-mobile  { display: block !important; }

    .ft-desktop-charts { display: none !important; }
    .ft-mobile-charts  { display: block !important; }
    .ft-kpi-row   { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    .ft-stat-tiles { grid-template-columns: 1fr !important; }
    .ft-bleed-ts  { margin-right: 0 !important; }
  }

  @media (min-width: 1024px) {
    .ft-refresh-desktop { display: flex !important; }
    .ft-refresh-mobile  { display: none !important; }
    .ft-desktop-charts  { display: block !important; }
    .ft-mobile-charts   { display: none !important; }
    .ft-filter-strip    { flex-wrap: wrap !important; overflow-x: visible !important; }
  }
`;

function normalizeChrome(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return '';
  if (raw === 'recruiter-ent' || raw === 'recruiter_enterprise' || raw === 'enterprise' || raw === 'ent') return 'recruiter-ent';
  if (raw === 'recruiter-smb' || raw === 'recruiter_smb' || raw === 'smb' || raw === 'recruiter') return 'recruiter-smb';
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
    router.replace({ pathname: router.pathname, query: { ...router.query, chrome: nextChrome } }, undefined, { shallow: true, scroll: false });
  } catch { }
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
  employee = false,
  department = '',
  contentFullBleed = false,
}) {
  const router    = useRouter();
  const hasHeader = Boolean(header);
  const hasRight  = Boolean(right);

  const { isLoaded: planLoaded, plan, role: planRole } = usePlan();
  const [profileSlug, setProfileSlug] = useState('');

  // JS state only for behavioral (non-layout) features
  const [isMobile, setIsMobile]               = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res  = await fetch('/api/profile/details', { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
        if (!res.ok || !alive) return;
        const data = await res.json();
        const slug = data?.user?.slug || data?.details?.slug || data?.slug || '';
        if (slug) setProfileSlug(String(slug));
      } catch { }
    })();
    return () => { alive = false; };
  }, []);

  const { wallpaperUrl } = useUserWallpaper();

  const backgroundStyle = wallpaperUrl
    ? { minHeight: '100vh', backgroundImage: `url(${wallpaperUrl})`, backgroundSize: 'cover', backgroundPosition: 'center top', backgroundRepeat: 'no-repeat', backgroundAttachment: isMobile ? 'scroll' : 'fixed' }
    : { minHeight: '100vh', backgroundColor: '#ECEFF1' };

  const chromeMode = useMemo(() => {
    const urlChrome    = normalizeChrome(router?.query?.chrome);
    const isEnterprise = String(plan || '').toLowerCase() === 'enterprise';
    if (urlChrome) return urlChrome;
    if (planLoaded) return isEnterprise ? 'recruiter-ent' : 'recruiter-smb';
    return 'recruiter-smb';
  }, [router?.query?.chrome, planLoaded, plan]);

  useEffect(() => {
    if (!router?.isReady || !planLoaded) return;
    const urlChrome    = normalizeChrome(router.query?.chrome);
    const isEnterprise = String(plan || '').toLowerCase() === 'enterprise';
    const canonical    = isEnterprise ? 'recruiter-ent' : 'recruiter-smb';
    if (urlChrome === 'recruiter-smb' || urlChrome === 'recruiter-ent' || !urlChrome) {
      setQueryChrome(router, canonical);
    }
  }, [router?.isReady, router?.query?.chrome, planLoaded, plan]);

  const resolvedVariant = useMemo(() => {
    const inferred = chromeToVariant(chromeMode);
    if (!inferred) return variantProp;
    if (variantProp === 'enterprise') return 'enterprise';
    if (variantProp === 'smb') return inferred;
    return variantProp;
  }, [chromeMode, variantProp]);

  const resolvedRole = planRole || roleProp;

  const GAP     = 12;
  const PAD     = 16;
  const LEFT_W  = 240;
  const RIGHT_W = 240;

  // Desktop grid — always rendered as inline style.
  // CSS class ft-rl-grid overrides this on mobile via media query.
  const desktopGrid = useMemo(() => {
    if (!hasHeader && !hasRight) return {
      display: 'grid', gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr)`,
      gridTemplateRows: '1fr', gridTemplateAreas: '"left content"',
    };
    if (!hasHeader && hasRight) return {
      display: 'grid', gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr) ${RIGHT_W}px`,
      gridTemplateRows: '1fr', gridTemplateAreas: '"left content right"',
    };
    return {
      display: 'grid',
      gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr) ${hasRight ? `${RIGHT_W}px` : '0px'}`,
      gridTemplateRows: 'auto 1fr',
      gridTemplateAreas: hasRight
        ? '"left header right" "left content right"'
        : '"left header header" "left content content"',
    };
  }, [hasHeader, hasRight]);

  const handleOpenTools = useCallback(() => setMobileToolsOpen(true), []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <style>{LAYOUT_CSS}</style>
      </Head>

      <div className="ft-bg-fixed" style={backgroundStyle}>
        <RecruiterHeader />

        <div
          className="ft-rl-grid"
          style={{
            ...desktopGrid,
            gap: GAP,
            paddingTop: PAD,
            paddingBottom: PAD,
            paddingLeft: PAD,
            paddingRight: hasRight ? Math.max(8, PAD - 4) : PAD,
            alignItems: 'start',
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '100vw',
            minWidth: 0,
          }}
        >
          {/* Left sidebar — CSS hides on mobile */}
          <aside
            className="ft-rl-left"
            style={{ gridArea: 'left', alignSelf: 'start', minWidth: 0, position: 'relative', zIndex: 1 }}
          >
            <RecruiterSidebar
              active={activeNav} role={resolvedRole} variant={resolvedVariant}
              counts={counts} initialOpen={initialOpen}
              employee={employee} department={department} profileSlug={profileSlug}
            />
          </aside>

          {hasHeader ? (
            headerCard ? (
              <section style={{ gridArea: 'header', borderRadius: 18, padding: '8px 12px', minWidth: 0, boxSizing: 'border-box', ...GLASS }}>
                {header}
              </section>
            ) : (
              <header style={{ gridArea: 'header', alignSelf: 'start', minWidth: 0 }}>{header}</header>
            )
          ) : null}

          {/* Right rail — CSS hides on mobile */}
          {hasRight ? (
            <aside
              className="ft-rl-right"
              style={{
                gridArea: 'right', alignSelf: 'start', ...GLASS,
                borderRadius: 18, padding: 16, minHeight: 120,
                boxSizing: 'border-box', width: RIGHT_W, minWidth: RIGHT_W,
                maxWidth: RIGHT_W, minInlineSize: 0, color: '#112033',
                position: 'relative', zIndex: 1,
              }}
            >
              {right}
            </aside>
          ) : null}

          {/* Main content — CSS adds overflow:hidden on mobile */}
          <main
            className="ft-rl-main"
            style={{
              gridArea: 'content', minWidth: 0, width: '100%', maxWidth: '100%',
              position: 'relative', zIndex: 1,
              // contentFullBleed removes clipping on desktop for bleed rows.
              // CSS re-adds overflow:hidden on mobile regardless.
              ...(!contentFullBleed ? { overflowX: 'hidden' } : {}),
            }}
          >
            <div style={{ display: 'grid', gap: GAP, width: '100%', minWidth: 0, maxWidth: '100%' }}>
              {children}
            </div>
          </main>
        </div>
      </div>

      <SupportFloatingButton />

      <MobileBottomBar isMobile={isMobile} chromeMode={chromeMode} onOpenTools={handleOpenTools} />

      {isMobile && mobileToolsOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <button type="button" onClick={() => setMobileToolsOpen(false)} aria-label="Dismiss Tools"
            style={{ position: 'absolute', inset: 0, border: 'none', background: 'rgba(0,0,0,0.55)', cursor: 'pointer' }} />
          <div style={{
            position: 'relative', zIndex: 1, width: 'min(760px, 100%)', maxHeight: '82vh',
            borderTopLeftRadius: 22, borderTopRightRadius: 22,
            border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            padding: 16, boxSizing: 'border-box', overflowY: 'auto',
            boxShadow: '0 -10px 26px rgba(0,0,0,0.22)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#112033' }}>Tools</div>
              <button type="button" onClick={() => setMobileToolsOpen(false)} aria-label="Close Tools"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, lineHeight: 1, color: '#546E7A' }}>
                ×
              </button>
            </div>
            <RecruiterSidebar
              active={activeNav} role={resolvedRole} variant={resolvedVariant}
              counts={counts} initialOpen={initialOpen}
              employee={employee} department={department} profileSlug={profileSlug}
            />
          </div>
        </div>
      )}
    </>
  );
}