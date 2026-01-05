// components/layouts/SeekerLayout.js
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';

// Seeker / Coach chrome
import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';

// Recruiter chrome
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

const ALLOWED_MODES = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);
const LAST_CHROME_KEY = 'ft_last_chrome';

function normalizeChrome(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return '';

  // ✅ canonical values pass through
  if (ALLOWED_MODES.has(raw)) return raw;

  // ✅ accept common aliases
  if (raw === 'recruiter') return 'recruiter-smb';
  if (raw === 'recruiter_smb' || raw === 'recruiter-smb' || raw === 'smb') return 'recruiter-smb';

  if (
    raw === 'recruiter-ent' ||
    raw === 'recruiter_enterprise' ||
    raw === 'recruiter-enterprise' ||
    raw === 'enterprise' ||
    raw === 'ent'
  ) {
    return 'recruiter-ent';
  }

  // ✅ tolerate broader recruiter strings
  if (raw.startsWith('recruiter')) {
    if (raw.includes('ent') || raw.includes('enterprise')) return 'recruiter-ent';
    return 'recruiter-smb';
  }

  if (raw === 'coach') return 'coach';
  if (raw === 'seeker') return 'seeker';

  return '';
}

function readLastChrome() {
  try {
    if (typeof window === 'undefined') return '';
    const saved = window.sessionStorage.getItem(LAST_CHROME_KEY) || '';
    return normalizeChrome(saved);
  } catch {
    return '';
  }
}

function persistLastChrome(mode) {
  try {
    if (typeof window === 'undefined') return;
    const m = normalizeChrome(mode);
    if (!m) return;
    window.sessionStorage.setItem(LAST_CHROME_KEY, m);
  } catch {
    // ignore
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
  leftWidth = 240, // ✅ allows per-page override without changing defaults
  gap = 12,
  pad = 16,
}) {
  const router = useRouter();

  // ---- CHROME MODE (determine once, then keep in state) ----
  const initialChrome = (() => {
    // 1) forceChrome (only if valid)
    const forced = normalizeChrome(forceChrome);
    if (forced) return forced;

    // 2) URL chrome (normalize aliases)
    const urlChrome = normalizeChrome(router?.query?.chrome);
    if (urlChrome) return urlChrome;

    // 3) last known chrome (sessionStorage)
    const last = readLastChrome();
    if (last) return last;

    // 4) default
    return 'seeker';
  })();

  const [chromeMode, setChromeMode] = useState(initialChrome);

  // Keep chromeMode in sync with forceChrome / URL chrome (URL wins unless forceChrome explicitly provided)
  useEffect(() => {
    const forced = normalizeChrome(forceChrome);
    if (forced) {
      setChromeMode(forced);
      persistLastChrome(forced);
      return;
    }

    const urlChrome = normalizeChrome(router?.query?.chrome);

    // If URL explicitly has a recognized chrome (including aliases), honor it.
    if (urlChrome) {
      setChromeMode(urlChrome);
      persistLastChrome(urlChrome);
      return;
    }

    // If URL chrome missing/invalid, do NOT reset to seeker.
    // Keep current, but ensure we have a persisted fallback.
    const last = readLastChrome();
    if (last && last !== chromeMode) {
      setChromeMode(last);
      persistLastChrome(last);
    } else {
      persistLastChrome(chromeMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router?.query?.chrome, forceChrome]);

  // Always call hook; only Seeker uses the counts
  const seekerCounts = useSidebarCounts();

  // ---- HEADER + SIDEBAR SELECTION ----
  const { HeaderComp, SidebarComp, sidebarProps } = useMemo(() => {
    switch (chromeMode) {
      case 'coach':
        return {
          HeaderComp: CoachingHeader,
          SidebarComp: CoachingSidebar,
          sidebarProps: { active: activeNav },
        };

      case 'recruiter-smb':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: {
            variant: 'smb',
            active: activeNav,
            counts: {},
          },
        };

      case 'recruiter-ent':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: {
            variant: 'enterprise',
            active: activeNav,
            counts: {},
          },
        };

      case 'seeker':
      default:
        return {
          HeaderComp: SeekerHeader,
          SidebarComp: SeekerSidebar,
          sidebarProps: {
            active: activeNav,
            counts: seekerCounts,
          },
        };
    }
  }, [chromeMode, activeNav, seekerCounts]);

  // ---- WALLPAPER / BACKGROUND ----
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

  // ---- MOBILE DETECTION + SIDEBAR OVERLAY ----
  const hasRight = Boolean(right);
  const [isMobile, setIsMobile] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  // ---- RIGHT RAIL STYLES ----
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
  };

  const rightLight = {
    background: 'transparent',
    border: 'none',
    padding: 0,
    boxShadow: 'none',
  };

  // Asymmetric padding to keep right edge tight when a rail exists
  const containerPadding = {
    paddingTop: pad,
    paddingBottom: pad,
    paddingLeft: pad,
    paddingRight: hasRight ? Math.max(8, pad - 4) : pad,
  };

  // ---- DESKTOP VS MOBILE GRID ----
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

      {/* Wallpaper wrapper (NO frosting/overlay) */}
      <div style={backgroundStyle}>
        {/* Top chrome header ALWAYS matches chromeMode */}
        <HeaderComp />

        {/* Main layout shell */}
        <div
          style={{
            ...gridStyles,
            gap,
            ...containerPadding,
            alignItems: 'start',
          }}
        >
          {/* LEFT — Sidebar (hidden on mobile, moved into overlay) */}
          <aside
            style={{
              gridArea: 'left',
              alignSelf: 'start',
              minWidth: 0,
              display: isMobile ? 'none' : 'block',
            }}
          >
            {left ? left : <SidebarComp {...sidebarProps} />}
          </aside>

          {/* PAGE HEADER (center) */}
          <header
            style={{
              gridArea: 'header',
              alignSelf: 'start',
              minWidth: 0,
            }}
          >
            {header}
            {/* ✅ Removed mobile "Open Sidebar" hamburger button.
                Mobile navigation now lives in the bottom toolbar. */}
          </header>

          {/* RIGHT — Variant-controlled rail */}
          {hasRight ? (
            <aside
              style={{
                ...rightBase,
                ...(rightVariant === 'light' ? rightLight : rightDark),
              }}
            >
              {right}
            </aside>
          ) : null}

          {/* CONTENT (center) */}
          <main style={{ gridArea: 'content', minWidth: 0 }}>
            <div style={{ display: 'grid', gap, width: '100%', minWidth: 0 }}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobile && mobileSidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              width: '80%',
              maxWidth: 320,
              background: '#FFFFFF',
              padding: 16,
              boxSizing: 'border-box',
              overflowY: 'auto',
              boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header row inside sidebar overlay */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#263238',
                }}
              >
                Navigation
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close sidebar"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 20,
                  lineHeight: 1,
                  color: '#546E7A',
                }}
              >
                ×
              </button>
            </div>

            {/* Reuse whichever sidebar chromeMode selected */}
            {left ? left : <SidebarComp {...sidebarProps} />}
          </div>

          {/* Clickable area to close overlay when tapping outside panel */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Dismiss sidebar"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
          />
        </div>
      )}
    </>
  );
}
