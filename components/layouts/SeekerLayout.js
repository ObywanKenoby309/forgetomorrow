// components/layouts/SeekerLayout.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';
import { usePlan } from '@/context/PlanContext';

// Seeker / Coach chrome
import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';

// Recruiter chrome
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

// ✅ Mobile bottom bar (Tools opens sidebar sheet on mobile)
import MobileBottomBar from '@/components/mobile/MobileBottomBar';

const ALLOWED_MODES = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);

function normalizeChrome(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return '';

  if (ALLOWED_MODES.has(raw)) return raw;

  // aliases
  if (raw === 'recruiter') return 'recruiter-smb';
  if (raw === 'recruiter_smb' || raw === 'smb') return 'recruiter-smb';

  if (
    raw === 'recruiter-ent' ||
    raw === 'recruiter_enterprise' ||
    raw === 'recruiter-enterprise' ||
    raw === 'enterprise' ||
    raw === 'ent'
  ) {
    return 'recruiter-ent';
  }

  if (raw.startsWith('recruiter')) {
    if (raw.includes('ent') || raw.includes('enterprise')) return 'recruiter-ent';
    return 'recruiter-smb';
  }

  if (raw === 'coach') return 'coach';
  if (raw === 'seeker') return 'seeker';

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

export default function SeekerLayout({
  title = 'ForgeTomorrow - Seeker',
  left,
  header,
  right,
  children,
  activeNav,
  forceChrome, // 'seeker' | 'coach' | 'recruiter-smb' | 'recruiter-ent'
  rightVariant = 'dark', // 'dark' | 'light'
  rightWidth = 260,
  leftWidth = 240,
  gap = 12,
  pad = 16,

  // ✅ allow right rail to appear only on top row, while content spans full width below.
  // Default false keeps existing layout behavior everywhere.
  rightTopOnly = false,

  // ✅ PAGE-ONLY OPT-IN:
  // When true (desktop only), main content can span UNDER the left rail too.
  // Default false keeps existing layout behavior everywhere.
  contentFullBleed = false,

  // ✅ NEW (optional): DB-backed staff fields to pass through to sidebars
  // If not provided yet, safe defaults keep Staff Tools hidden.
  employee = false,
  department = '',
}) {
  const router = useRouter();
  const { isLoaded: planLoaded, plan, role } = usePlan();

  // ✅ Normalize legacy nav key: roadmap -> anvil
  const normalizedActiveNav = activeNav === 'roadmap' ? 'anvil' : activeNav;

  // ---- CHROME MODE (DB-first; URL may request chrome but DB can canonicalize recruiter ent/smb) ----
  const [chromeMode, setChromeMode] = useState(() => {
    // IMPORTANT: deterministic initial value avoids hydration mismatch.
    // We’ll resolve properly in effects once router + plan are ready.
    return normalizeChrome(forceChrome) || 'seeker';
  });

  useEffect(() => {
    if (!router?.isReady) return;

    const forced = normalizeChrome(forceChrome);
    if (forced) {
      setChromeMode(forced);
      return;
    }

    // URL request (what user is “trying” to view)
    const urlChrome = normalizeChrome(router.query?.chrome);

    // DB truth (what the account *is*)
    const dbRole = String(role || '').toLowerCase(); // seeker|coach|recruiter|site_admin|...
    const dbPlan = String(plan || '').toLowerCase(); // small|enterprise|null
    const isRecruiterAccount =
      dbRole === 'recruiter' ||
      dbRole === 'site_admin' ||
      dbRole === 'owner' ||
      dbRole === 'admin' ||
      dbRole === 'billing';
    const isCoachAccount = dbRole === 'coach';
    const isEnterpriseAccount = dbPlan === 'enterprise';

    // Determine DB-preferred chrome when loaded
    const dbPreferred =
      planLoaded && isRecruiterAccount
        ? isEnterpriseAccount
          ? 'recruiter-ent'
          : 'recruiter-smb'
        : planLoaded && isCoachAccount
        ? 'coach'
        : 'seeker';

    // If URL specifies recruiter chrome, canonicalize based on DB when loaded.
    if (urlChrome === 'recruiter-smb' || urlChrome === 'recruiter-ent') {
      if (planLoaded && isRecruiterAccount) {
        const canonical = isEnterpriseAccount ? 'recruiter-ent' : 'recruiter-smb';
        setChromeMode(canonical);
        setQueryChrome(router, canonical);
        return;
      }
      // If not loaded yet, honor URL for now (prevents flicker loops)
      setChromeMode(urlChrome);
      return;
    }

    // If URL specifies coach/seeker explicitly, honor it.
    if (urlChrome === 'coach' || urlChrome === 'seeker') {
      setChromeMode(urlChrome);
      return;
    }

    // No chrome requested: use DB preference once loaded, else keep current.
    if (planLoaded) {
      setChromeMode(dbPreferred);
      if (dbPreferred === 'recruiter-ent' || dbPreferred === 'recruiter-smb') {
        // Optional: stamp chrome into URL for consistency on shared pages
        setQueryChrome(router, dbPreferred);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router?.isReady, router?.query?.chrome, forceChrome, planLoaded, plan, role]);

  // Always call hook; only Seeker uses the counts
  const seekerCounts = useSidebarCounts();

  // ---- HEADER + SIDEBAR SELECTION ----
  const { HeaderComp, SidebarComp, sidebarProps } = useMemo(() => {
    switch (chromeMode) {
      case 'coach':
        return {
          HeaderComp: CoachingHeader,
          SidebarComp: CoachingSidebar,
          sidebarProps: {
            active: normalizedActiveNav,
            employee,
            department,
          },
        };

      case 'recruiter-smb':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: {
            variant: 'smb',
            active: normalizedActiveNav,
            counts: {},
            employee,
            department,
          },
        };

      case 'recruiter-ent':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: {
            variant: 'enterprise',
            active: normalizedActiveNav,
            counts: {},
            employee,
            department,
          },
        };

      case 'seeker':
      default:
        return {
          HeaderComp: SeekerHeader,
          SidebarComp: SeekerSidebar,
          sidebarProps: {
            active: normalizedActiveNav,
            counts: seekerCounts,
            employee,
            department,
          },
        };
    }
  }, [chromeMode, normalizedActiveNav, seekerCounts, employee, department]);

  // ---- MOBILE DETECTION + TOOLS SHEET ----
  const hasRight = Boolean(right);

  // ✅ FIX: null until client decides (prevents “mobile first” paint)
  const [isMobile, setIsMobile] = useState(null);

  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  // ✅ Stable handler so MobileBottomBar doesn't re-render/blink
  const handleOpenTools = useCallback(() => setMobileToolsOpen(true), []);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth;
        setIsMobile(width < 1024);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileReady = isMobile !== null;
  const isMobileBool = isMobile === true;

  // ---- WALLPAPER / BACKGROUND ----
  const { wallpaperUrl } = useUserWallpaper();

  // ✅ FIX: on mobile, use 'scroll' to prevent wallpaper seam / repaint banding
  const backgroundStyle = wallpaperUrl
    ? {
        minHeight: '100vh',
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: isMobileBool ? 'scroll' : 'fixed',
      }
    : {
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      };

  // ---- RIGHT RAIL STYLES ----
  const rightBase = {
    gridArea: 'right',
    alignSelf: 'start',
    borderRadius: 14, // ✅ MIN CHANGE: match glass standard (was 12)
    boxSizing: 'border-box',
    width: hasRight && !isMobileBool ? rightWidth : '100%',
    minWidth: hasRight && !isMobileBool ? rightWidth : 0,
    maxWidth: hasRight && !isMobileBool ? rightWidth : '100%',
    minInlineSize: 0,
  };

  // ✅ MIN CHANGE: replace dark rail with frosted glass (uniform across site)
  const rightDark = {
    border: '1px solid rgba(255,255,255,0.22)',
    background: 'rgba(255,255,255,0.58)',
    padding: 16,
    boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  const rightLight = {
    background: 'transparent',
    border: 'none',
    padding: 0,
    boxShadow: 'none',
  };

  const containerPadding = {
    paddingTop: pad,
    paddingBottom: isMobileBool ? pad + 84 : pad,
    paddingLeft: pad,
    paddingRight: hasRight ? Math.max(8, pad - 4) : pad,
  };

  // ---- DESKTOP VS MOBILE GRID ----
  const desktopGrid = {
    display: 'grid',
    gridTemplateColumns: `${leftWidth}px minmax(0, 1fr) ${hasRight ? `${rightWidth}px` : '0px'}`,
    gridTemplateRows: 'auto 1fr',
    gridTemplateAreas: hasRight
      ? rightTopOnly
        ? `"left header right"
           "left content content"`
        : `"left header right"
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

  const gridStyles = isMobileBool ? mobileGrid : desktopGrid;

  // ✅ PAGE-ONLY: allow content to span under left rail (desktop only)
  const mainOverrides =
    !isMobileBool && contentFullBleed
      ? {
          gridColumn: '1 / -1',
          position: 'relative',
          zIndex: 1,
        }
      : {
          position: 'relative',
          zIndex: 1,
        };

  // ✅ Ensure side rails stay above full-bleed content
  const leftRailLayer = { position: 'relative', zIndex: 10 };
  const headerLayer = { position: 'relative', zIndex: 9 };
  const rightRailLayer = { position: 'relative', zIndex: 10 };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div style={backgroundStyle}>
        <HeaderComp />

        {/* ✅ FIX: don’t render grid until isMobile is known (prevents “mobile first → desktop” blink) */}
        {isMobileReady ? (
          <div
            style={{
              ...gridStyles,
              gap,
              ...containerPadding,
              alignItems: 'start',
              overflowX: 'hidden',
              boxSizing: 'border-box',
              width: '100%',
              maxWidth: '100vw',
              minWidth: 0,
            }}
          >
            <aside
              style={{
                ...leftRailLayer,
                gridArea: 'left',
                alignSelf: 'start',
                minWidth: 0,
                display: isMobileBool ? 'none' : 'block',
              }}
            >
              {left ? left : <SidebarComp {...sidebarProps} />}
            </aside>

            <header
              style={{
                ...headerLayer,
                gridArea: 'header',
                alignSelf: 'start',
                minWidth: 0,
              }}
            >
              {header}
            </header>

            {hasRight ? (
              <aside
                style={{
                  ...rightRailLayer,
                  ...rightBase,
                  ...(rightVariant === 'light' ? rightLight : rightDark),
                }}
              >
                {right}
              </aside>
            ) : null}

            <main style={{ gridArea: 'content', minWidth: 0, ...mainOverrides }}>
              <div style={{ display: 'grid', gap, width: '100%', minWidth: 0 }}>{children}</div>
            </main>
          </div>
        ) : (
          // Minimal stable shell (no blink / no layout jump)
          <div style={{ paddingTop: pad, paddingLeft: pad, paddingRight: pad, paddingBottom: pad }}>
            <div style={{ height: 180 }} />
          </div>
        )}
      </div>

      {/* ✅ Only render bottom bar on actual mobile */}
      <MobileBottomBar isMobile={isMobileBool} chromeMode={chromeMode} onOpenTools={handleOpenTools} />

      {isMobileBool && mobileToolsOpen && (
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

            {left ? left : <SidebarComp {...sidebarProps} />}
          </div>
        </div>
      )}
    </>
  );
}