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

export default function SeekerLayout({
  title = 'ForgeTomorrow — Seeker',
  left,
  header,
  right,
  children,
  activeNav,
  forceChrome,           // 'seeker' | 'coach' | 'recruiter-smb' | 'recruiter-ent'
  rightVariant = 'dark', // 'dark' | 'light'
  rightWidth = 260,
  gap = 12,
  pad = 16,
}) {
  const router = useRouter();

  // ---- CHROME MODE (determine once, then keep in state) ----
  const initialChrome = (() => {
    if (forceChrome && ALLOWED_MODES.has(forceChrome)) return forceChrome;

    const raw = String(router?.query?.chrome || '').toLowerCase();
    if (ALLOWED_MODES.has(raw)) return raw;

    return 'seeker';
  })();

  const [chromeMode, setChromeMode] = useState(initialChrome);

  useEffect(() => {
    const raw = String(router?.query?.chrome || '').toLowerCase();

    if (forceChrome && ALLOWED_MODES.has(forceChrome)) {
      setChromeMode(forceChrome);
      return;
    }

    if (ALLOWED_MODES.has(raw)) {
      setChromeMode(raw);
    } else {
      setChromeMode('seeker');
    }
  }, [router?.query?.chrome, forceChrome]);

  // Mobile layout flag
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // mobile breakpoint
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Always call hook; only Seeker uses the counts
  const seekerCounts = useSidebarCounts();
  const isSeekerChrome = chromeMode === 'seeker';

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
            counts: {}, // recruiter sidebar doesn’t need seeker counts
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

  // ---- RIGHT RAIL STYLES ----
  const rightBase = {
    gridArea: 'right',
    alignSelf: 'start',
    borderRadius: 12,
    boxSizing: 'border-box',
    width: rightWidth,
    minWidth: rightWidth,
    maxWidth: rightWidth,
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
    paddingRight: right ? Math.max(8, pad - 4) : pad,
  };

  const hasRight = Boolean(right);

  const desktopGrid = {
    display: 'grid',
    gridTemplateColumns: `240px minmax(0, 1fr) ${hasRight ? `${rightWidth}px` : '0px'}`,
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
    gridTemplateRows: 'auto auto auto auto',
    gridTemplateAreas: hasRight
      ? `"header"
         "content"
         "right"
         "left"`
      : `"header"
         "content"
         "left"`,
  };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      {/* Wallpaper wrapper */}
      <div style={backgroundStyle}>
        {/* Top chrome header ALWAYS matches chromeMode */}
        <HeaderComp />

        {/* Main layout shell */}
        <div
          style={{
            ...(isMobile ? mobileGrid : desktopGrid),
            gap,
            ...containerPadding,
            alignItems: 'start',
          }}
        >
          {/* LEFT — Sidebar */}
          <aside style={{ gridArea: 'left', alignSelf: 'start', minWidth: 0 }}>
            {left ? left : <SidebarComp {...sidebarProps} />}
          </aside>

          {/* PAGE HEADER (center) */}
          <header style={{ gridArea: 'header', alignSelf: 'start', minWidth: 0 }}>
            {header}
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
    </>
  );
}
