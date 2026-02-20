// components/layouts/InternalLayout.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';
import { usePlan } from '@/context/PlanContext';

// Chrome-specific headers + sidebars
import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';

// ✅ mobile bottom bar + support floating button
import MobileBottomBar from '@/components/mobile/MobileBottomBar';
import SupportFloatingButton from '@/components/SupportFloatingButton';

const ALLOWED_MODES = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);

function normalizeChrome(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return '';

  if (raw === 'recruiter') return 'recruiter-smb';
  if (raw === 'enterprise') return 'recruiter-ent';

  if (ALLOWED_MODES.has(raw)) return raw;

  if (raw.startsWith('recruiter')) {
    if (raw.includes('ent') || raw.includes('enterprise')) return 'recruiter-ent';
    return 'recruiter-smb';
  }

  return '';
}

function extractChromeFromAsPath(asPath) {
  try {
    const s = String(asPath || '');
    if (!s.includes('chrome=')) return '';
    const qIndex = s.indexOf('?');
    if (qIndex === -1) return '';
    const query = s.slice(qIndex + 1);
    const params = new URLSearchParams(query);
    return normalizeChrome(params.get('chrome'));
  } catch {
    return '';
  }
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

export default function InternalLayout({
  title = 'ForgeTomorrow',
  left,
  header,
  right,
  children,
  activeNav,

  forceChrome,
  chrome,

  rightVariant = 'dark',
  rightWidth = 260,
  leftWidth = 240,
  gap = 12,
  pad = 16,
}) {
  const router = useRouter();
  const counts = useSidebarCounts();
  const { isLoaded: planLoaded, plan, role } = usePlan();

  const [chromeMode, setChromeMode] = useState(() => normalizeChrome(forceChrome || chrome) || 'seeker');

  useEffect(() => {
    if (!router?.isReady) return;

    // 1) Explicit override wins
    const override = normalizeChrome(forceChrome || chrome);
    if (override && ALLOWED_MODES.has(override)) {
      setChromeMode(override);
      return;
    }

    // 2) URL query
    const q = normalizeChrome(router?.query?.chrome);
    if (q && ALLOWED_MODES.has(q)) {
      // If recruiter chrome requested, canonicalize once DB is loaded
      if ((q === 'recruiter-smb' || q === 'recruiter-ent') && planLoaded) {
        const isEnterprise = String(plan || '').toLowerCase() === 'enterprise';
        const canonical = isEnterprise ? 'recruiter-ent' : 'recruiter-smb';
        setChromeMode(canonical);
        setQueryChrome(router, canonical);
        return;
      }

      setChromeMode(q);
      return;
    }

    // 3) router.asPath fallback
    const fromPath = extractChromeFromAsPath(router?.asPath);
    if (fromPath && ALLOWED_MODES.has(fromPath)) {
      if ((fromPath === 'recruiter-smb' || fromPath === 'recruiter-ent') && planLoaded) {
        const isEnterprise = String(plan || '').toLowerCase() === 'enterprise';
        const canonical = isEnterprise ? 'recruiter-ent' : 'recruiter-smb';
        setChromeMode(canonical);
        setQueryChrome(router, canonical);
        return;
      }

      setChromeMode(fromPath);
      return;
    }

    // 4) DB default when loaded (prevents “random SMB”)
    if (planLoaded) {
      const dbRole = String(role || '').toLowerCase();
      const isRecruiterAccount =
        dbRole === 'recruiter' ||
        dbRole === 'site_admin' ||
        dbRole === 'owner' ||
        dbRole === 'admin' ||
        dbRole === 'billing';
      const isCoachAccount = dbRole === 'coach';
      const isEnterprise = String(plan || '').toLowerCase() === 'enterprise';

      const dbPreferred = isRecruiterAccount
        ? isEnterprise
          ? 'recruiter-ent'
          : 'recruiter-smb'
        : isCoachAccount
        ? 'coach'
        : 'seeker';
      setChromeMode(dbPreferred);

      if (dbPreferred === 'recruiter-ent' || dbPreferred === 'recruiter-smb') {
        setQueryChrome(router, dbPreferred);
      }
      return;
    }

    setChromeMode('seeker');
  }, [forceChrome, chrome, router?.isReady, router?.query?.chrome, router?.asPath, planLoaded, plan, role]);

  const { HeaderComp, SidebarComp, sidebarProps } = useMemo(() => {
    switch (chromeMode) {
      case 'coach':
        return {
          HeaderComp: CoachingHeader,
          SidebarComp: CoachingSidebar,
          sidebarProps: { active: activeNav, counts },
        };

      case 'recruiter-smb':
      case 'recruiter-ent':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: {
            active: activeNav,
            variant: chromeMode === 'recruiter-ent' ? 'enterprise' : 'smb',
            counts,
          },
        };

      case 'seeker':
      default:
        return {
          HeaderComp: SeekerHeader,
          SidebarComp: SeekerSidebar,
          sidebarProps: { active: activeNav, counts },
        };
    }
  }, [chromeMode, activeNav, counts]);

  const { wallpaperUrl } = useUserWallpaper();

  const backgroundStyle = wallpaperUrl
    ? {
        minHeight: '100vh',
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }
    : {
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      };

  const hasRight = Boolean(right);
  const [isMobile, setIsMobile] = useState(true);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  // ✅ Stable handler so MobileBottomBar doesn't re-render/blink
  const handleOpenTools = useCallback(() => setMobileToolsOpen(true), []);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const rightBase = {
    gridArea: 'right',
    alignSelf: 'start',
    borderRadius: 12,
    boxSizing: 'border-box',
    width: hasRight && !isMobile ? rightWidth : '100%',
    minWidth: hasRight && !isMobile ? rightWidth : 0,
    maxWidth: hasRight && !isMobile ? rightWidth : '100%',
    minInlineSize: 0,
  };

  const rightDark = {
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    padding: 16,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    color: 'white',
  };

  const rightLight = {
    background: 'transparent',
    border: 'none',
    padding: 0,
    boxShadow: 'none',
  };

  const containerPadding = {
    paddingTop: pad,
    paddingBottom: isMobile ? pad + 84 : pad,
    paddingLeft: pad,
    paddingRight: hasRight ? Math.max(8, pad - 4) : pad,
  };

  const desktopGrid = {
    display: 'grid',
    gridTemplateColumns: `${leftWidth}px minmax(0, 1fr) ${hasRight ? `${rightWidth}px` : '0px'}`,
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

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div style={backgroundStyle}>
        <HeaderComp />

        <div style={{ ...gridStyles, gap, ...containerPadding, alignItems: 'start' }}>
          <aside
            style={{
              gridArea: 'left',
              alignSelf: 'start',
              minWidth: 0,
              display: isMobile ? 'none' : 'block',
            }}
          >
            {left ?? <SidebarComp {...sidebarProps} />}
          </aside>

          <header style={{ gridArea: 'header', alignSelf: 'start', minWidth: 0 }}>
            {header}
          </header>

          {hasRight ? (
            <aside style={{ ...rightBase, ...(rightVariant === 'light' ? rightLight : rightDark) }}>
              {right}
            </aside>
          ) : null}

          <main style={{ gridArea: 'content', minWidth: 0 }}>
            <div style={{ display: 'grid', gap, width: '100%', minWidth: 0 }}>{children}</div>
          </main>
        </div>

        <SupportFloatingButton />

        <MobileBottomBar isMobile={isMobile} chromeMode={chromeMode} onOpenTools={handleOpenTools} />
      </div>

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

            {left ?? <SidebarComp {...sidebarProps} />}
          </div>
        </div>
      )}
    </>
  );
}