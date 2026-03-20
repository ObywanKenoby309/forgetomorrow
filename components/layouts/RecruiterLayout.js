// components/layouts/RecruiterLayout.js
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePlan } from '@/context/PlanContext';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';

import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

import MobileBottomBar from '@/components/mobile/MobileBottomBar';
import SupportFloatingButton from '@/components/SupportFloatingButton';

// ─── Design system tokens ─────────────────────────────────────────────────────
// GLASS:      primary cards
// GLASS_SOFT: nested / chip elements
// Radii:      22px page-level | 18px section cards | 12px chips/mini
const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.68)',
  boxShadow: '0 10px 28px rgba(15,23,42,0.12)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
};

function normalizeChrome(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return '';
  if (
    raw === 'recruiter-ent' ||
    raw === 'recruiter_enterprise' ||
    raw === 'enterprise' ||
    raw === 'ent'
  )
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

  employee = false,
  department = '',

  contentFullBleed = false,
}) {
  const router = useRouter();
  const hasHeader = Boolean(header);
  const hasRight = Boolean(right);

  const { isLoaded: planLoaded, plan, role: planRole } = usePlan();

  const [profileSlug, setProfileSlug] = useState('');

  // HYDRATION FIX: always render desktop-safe markup on server + first paint
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 1024);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let alive = true;

    const loadProfileSlug = async () => {
      try {
        const res = await fetch('/api/profile/details', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!res.ok) return;

        const data = await res.json();
        if (!alive) return;

        const nextSlug =
          data?.user?.slug ||
          data?.details?.slug ||
          data?.slug ||
          '';

        if (nextSlug) {
          setProfileSlug(String(nextSlug));
        }
      } catch {
        // no-op
      }
    };

    loadProfileSlug();

    return () => {
      alive = false;
    };
  }, []);

  const { wallpaperUrl } = useUserWallpaper();

  // Avoid background-attachment: fixed on mobile (causes seam artifacts)
  const backgroundStyle = wallpaperUrl
    ? {
        minHeight: '100vh',
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: hasMounted && isMobile ? 'scroll' : 'fixed',
      }
    : {
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      };

  const chromeMode = useMemo(() => {
    const urlChrome = normalizeChrome(router?.query?.chrome);
    const dbPlan = String(plan || '').toLowerCase();
    const isEnterprise = dbPlan === 'enterprise';

    if (urlChrome) return urlChrome;
    if (planLoaded) return isEnterprise ? 'recruiter-ent' : 'recruiter-smb';
    return 'recruiter-smb';
  }, [router?.query?.chrome, planLoaded, plan]);

  useEffect(() => {
    if (!router?.isReady) return;
    if (!planLoaded) return;

    const urlChrome = normalizeChrome(router.query?.chrome);
    const dbPlan = String(plan || '').toLowerCase();
    const isEnterprise = dbPlan === 'enterprise';
    const canonical = isEnterprise ? 'recruiter-ent' : 'recruiter-smb';

    if (urlChrome === 'recruiter-smb' || urlChrome === 'recruiter-ent') {
      setQueryChrome(router, canonical);
    } else if (!urlChrome) {
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

  const GAP    = 12;
  const PAD    = 16;
  const LEFT_W = 240;
  const RIGHT_W = 240;

  const desktopGrid = useMemo(() => {
    if (!hasHeader && !hasRight) {
      return {
        display: 'grid',
        gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr)`,
        gridTemplateRows: '1fr',
        gridTemplateAreas: `"left content"`,
      };
    }

    if (!hasHeader && hasRight) {
      return {
        display: 'grid',
        gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr) ${RIGHT_W}px`,
        gridTemplateRows: '1fr',
        gridTemplateAreas: `"left content right"`,
      };
    }

    return {
      display: 'grid',
      gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr) ${hasRight ? `${RIGHT_W}px` : '0px'}`,
      gridTemplateRows: 'auto 1fr',
      gridTemplateAreas: hasRight
        ? `"left header right"
           "left content right"`
        : `"left header header"
           "left content content"`,
    };
  }, [hasHeader, hasRight]);

  const mobileGrid = useMemo(() => {
    if (!hasHeader && !hasRight) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto',
        gridTemplateAreas: `"content"`,
      };
    }

    if (!hasHeader && hasRight) {
      return {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto auto',
        gridTemplateAreas: `"content" "right"`,
      };
    }

    return {
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
  }, [hasHeader, hasRight]);

  const gridStyles = hasMounted && isMobile ? mobileGrid : desktopGrid;

  const rightRailStyle = {
    gridArea: 'right',
    alignSelf: 'start',

    // Canonical GLASS token
    ...GLASS,

    // Section-card radius (18px)
    borderRadius: 18,
    padding: 16,
    minHeight: 120,
    boxSizing: 'border-box',
    width: hasMounted && isMobile ? '100%' : RIGHT_W,
    minWidth: hasMounted && isMobile ? 0 : RIGHT_W,
    maxWidth: hasMounted && isMobile ? '100%' : RIGHT_W,
    minInlineSize: 0,

    color: '#112033',
  };

  const handleOpenTools = useCallback(() => setMobileToolsOpen(true), []);

  const mainOverrides = {
    position: 'relative',
    zIndex: 1,
  };

  const leftRailLayer = { position: 'relative', zIndex: 1 };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div style={backgroundStyle}>
        <RecruiterHeader />

        <div
          style={{
            ...gridStyles,
            gap: GAP,
            paddingTop: PAD,
            paddingBottom: hasMounted && isMobile ? PAD + 84 : PAD,
            paddingLeft: PAD,
            paddingRight: hasRight ? Math.max(8, PAD - 4) : PAD,
            alignItems: 'start',
            boxSizing: 'border-box',

            width: '100%',
            maxWidth: '100vw',
            overflowX: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Left rail */}
          <aside
            style={{
              ...leftRailLayer,
              gridArea: 'left',
              alignSelf: 'start',
              minWidth: 0,
              display: hasMounted && isMobile ? 'none' : 'block',
            }}
          >
            <RecruiterSidebar
              active={activeNav}
              role={resolvedRole}
              variant={resolvedVariant}
              counts={counts}
              initialOpen={initialOpen}
              employee={employee}
              department={department}
              profileSlug={profileSlug}
            />
          </aside>

          {/* Header (ONLY if provided) */}
          {hasHeader ? (
            headerCard ? (
              <section
                style={{
                  gridArea: 'header',
                  // Section-card radius (18px)
                  borderRadius: 18,
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
            )
          ) : null}

          {/* Right rail (ONLY if provided) */}
          {hasRight ? <aside style={rightRailStyle}>{right}</aside> : null}

          {/* Main content */}
          <main
            style={{
              gridArea: 'content',
              minWidth: 0,
              width: '100%',
              maxWidth: '100%',
              ...(!contentFullBleed ? { overflowX: 'hidden' } : {}),
              ...mainOverrides,
            }}
          >
            <div style={{ display: 'grid', gap: GAP, width: '100%', minWidth: 0, maxWidth: '100%' }}>
              {children}
            </div>
          </main>
        </div>
      </div>

      <SupportFloatingButton />

      <MobileBottomBar
        isMobile={hasMounted ? isMobile : false}
        chromeMode={chromeMode}
        onOpenTools={handleOpenTools}
      />

      {hasMounted && isMobile && mobileToolsOpen && (
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
              // Page-level container radius (22px) for bottom sheet
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
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
              employee={employee}
              department={department}
              profileSlug={profileSlug}
            />
          </div>
        </div>
      )}
    </>
  );
}