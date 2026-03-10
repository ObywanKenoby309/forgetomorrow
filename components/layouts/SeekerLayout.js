// components/layouts/SeekerLayout.js
import React, { useEffect, useLayoutEffect, useMemo, useState, useCallback } from 'react';
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

// ✅ Match RecruiterLayout: use useLayoutEffect on client, useEffect on server
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function SeekerLayout({
  title = 'ForgeTomorrow - Seeker',
  left,
  header,
  right,
  children,
  activeNav,
  forceChrome,
  rightVariant = 'dark',
  rightWidth = 260,
  leftWidth = 240,
  gap = 12,
  pad = 16,
  rightTopOnly = false,
  contentFullBleed = false,
  employee = false,
  department = '',
}) {
  const router = useRouter();
  const { isLoaded: planLoaded, plan, role } = usePlan();

  // ✅ Normalize legacy nav key: roadmap -> anvil
  const normalizedActiveNav = activeNav === 'roadmap' ? 'anvil' : activeNav;

  // ---- CHROME MODE ----
  const [chromeMode, setChromeMode] = useState(() => {
    return normalizeChrome(forceChrome) || 'seeker';
  });

  useEffect(() => {
    if (!router?.isReady) return;

    const forced = normalizeChrome(forceChrome);
    if (forced) {
      setChromeMode(forced);
      return;
    }

    const urlChrome = normalizeChrome(router.query?.chrome);
    const dbRole = String(role || '').toLowerCase();
    const dbPlan = String(plan || '').toLowerCase();
    const isRecruiterAccount =
      dbRole === 'recruiter' ||
      dbRole === 'site_admin' ||
      dbRole === 'owner' ||
      dbRole === 'admin' ||
      dbRole === 'billing';
    const isCoachAccount = dbRole === 'coach';
    const isEnterpriseAccount = dbPlan === 'enterprise';

    const dbPreferred =
      planLoaded && isRecruiterAccount
        ? isEnterpriseAccount
          ? 'recruiter-ent'
          : 'recruiter-smb'
        : planLoaded && isCoachAccount
        ? 'coach'
        : 'seeker';

    if (urlChrome === 'recruiter-smb' || urlChrome === 'recruiter-ent') {
      if (planLoaded && isRecruiterAccount) {
        const canonical = isEnterpriseAccount ? 'recruiter-ent' : 'recruiter-smb';
        setChromeMode(canonical);
        setQueryChrome(router, canonical);
        return;
      }
      setChromeMode(urlChrome);
      return;
    }

    if (urlChrome === 'coach' || urlChrome === 'seeker') {
      setChromeMode(urlChrome);
      return;
    }

    if (planLoaded) {
      setChromeMode(dbPreferred);
      if (dbPreferred === 'recruiter-ent' || dbPreferred === 'recruiter-smb') {
        setQueryChrome(router, dbPreferred);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router?.isReady, router?.query?.chrome, forceChrome, planLoaded, plan, role]);

  // Always call hook; only Seeker uses the counts
  const seekerCounts = useSidebarCounts();

  // ✅ NEW: resolve the logged-in user's profile slug for sidebar Profile routing
  const [profileSlug, setProfileSlug] = useState(() => {
    return typeof router.query?.slug === 'string' ? router.query.slug : '';
  });

  useEffect(() => {
    if (typeof router.query?.slug === 'string' && router.query.slug) {
      setProfileSlug(router.query.slug);
      return;
    }

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
  }, [router.query?.slug]);

  // ---- HEADER + SIDEBAR SELECTION ----
  const { HeaderComp, SidebarComp, sidebarProps } = useMemo(() => {
    switch (chromeMode) {
      case 'coach':
        return {
          HeaderComp: CoachingHeader,
          SidebarComp: CoachingSidebar,
          sidebarProps: { active: normalizedActiveNav, employee, department, profileSlug },
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
            profileSlug,
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
            profileSlug,
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
            profileSlug,
          },
        };
    }
  }, [chromeMode, normalizedActiveNav, seekerCounts, employee, department, profileSlug]);

  // ---- MOBILE DETECTION ----
  // ✅ Match RecruiterLayout exactly: sync init from window so correct grid is used on first paint.
  // No null guard needed — no more "240px column ghost" pushing content off screen on mobile.
  const hasRight = Boolean(right);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false; // SSR: assume desktop
    return window.innerWidth < 1024;
  });

  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const handleOpenTools = useCallback(() => setMobileToolsOpen(true), []);

  // ✅ useLayoutEffect fires before paint — grid is always correct from frame 1
  useIsomorphicLayoutEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ---- WALLPAPER / BACKGROUND ----
  const { wallpaperUrl } = useUserWallpaper();

  const backgroundStyle = wallpaperUrl
    ? {
        minHeight: '100vh',
        backgroundImage: `url(${wallpaperUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: isMobile ? 'scroll' : 'fixed',
      }
    : {
        minHeight: '100vh',
        backgroundColor: '#ECEFF1',
      };

  // ---- RIGHT RAIL STYLES ----
  const rightBase = {
    gridArea: 'right',
    alignSelf: 'start',
    borderRadius: 14,
    boxSizing: 'border-box',
    width: hasRight && !isMobile ? rightWidth : '100%',
    minWidth: hasRight && !isMobile ? rightWidth : 0,
    maxWidth: hasRight && !isMobile ? rightWidth : '100%',
    minInlineSize: 0,
  };

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
    paddingBottom: isMobile ? pad + 84 : pad,
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

  const gridStyles = isMobile ? mobileGrid : desktopGrid;

  const mainOverrides =
    !isMobile && contentFullBleed
      ? { gridColumn: '1 / -1', position: 'relative', zIndex: 1 }
      : { position: 'relative', zIndex: 1 };

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
              display: isMobile ? 'none' : 'block',
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

          <main
            style={{
              gridArea: 'content',
              minWidth: 0,
              width: '100%',
              maxWidth: '100%',
              overflowX: 'hidden',
              ...mainOverrides,
            }}
          >
            <div style={{ display: 'grid', gap, width: '100%', minWidth: 0 }}>{children}</div>
          </main>
        </div>
      </div>

      <MobileBottomBar isMobile={isMobile} chromeMode={chromeMode} onOpenTools={handleOpenTools} />

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

            {left ? left : <SidebarComp {...sidebarProps} />}
          </div>
        </div>
      )}
    </>
  );
}