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
  const hasWallpaper = Boolean(wallpaperUrl);

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

  // ---- OVERLAY + FROSTED FRAME (applies to all SeekerLayout pages) ----
  const wallpaperOverlayStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    // Calms busy wallpapers without hiding them
    background:
      'radial-gradient(1200px 700px at 20% 0%, rgba(255,255,255,0.20), rgba(255,255,255,0.00) 55%), ' +
      'linear-gradient(180deg, rgba(17,32,51,0.40) 0%, rgba(17,32,51,0.18) 40%, rgba(17,32,51,0.38) 100%)',
  };

  const frostedFrameStyle = hasWallpaper
    ? {
        borderRadius: 18,
        background: 'rgba(255,255,255,0.74)',
        border: '1px solid rgba(255,255,255,0.30)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
        backdropFilter: isMobile ? 'blur(10px)' : 'blur(14px)',
        WebkitBackdropFilter: isMobile ? 'blur(10px)' : 'blur(14px)',
      }
    : {
        // If no wallpaper, keep the existing clean look (no blur frame needed)
        borderRadius: 0,
        background: 'transparent',
        border: 'none',
        boxShadow: 'none',
      };

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

      {/* Wallpaper wrapper */}
      <div style={{ ...backgroundStyle, position: 'relative' }}>
        {/* Wallpaper overlay (only when wallpaper exists) */}
        {hasWallpaper && <div aria-hidden="true" style={wallpaperOverlayStyle} />}

        {/* Content layer above overlay */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top chrome header ALWAYS matches chromeMode */}
          <HeaderComp />

          {/* Frosted frame wraps the full layout shell */}
          <div style={{ ...containerPadding }}>
            <div style={frostedFrameStyle}>
              {/* Main layout shell */}
              <div
                style={{
                  ...gridStyles,
                  gap,
                  padding: pad,
                  alignItems: 'start',
                }}
              >
                {/* LEFT - Sidebar (hidden on mobile, moved into overlay) */}
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

                  {/* Mobile-only "Open Sidebar" button */}
                  {isMobile && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => setMobileSidebarOpen(true)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          borderRadius: 999,
                          padding: '8px 14px',
                          fontSize: 13,
                          fontWeight: 600,
                          border: '1px solid #CFD8DC',
                          background: '#ECEFF1',
                          color: '#263238',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>☰</span>
                        <span>Open Sidebar</span>
                      </button>
                    </div>
                  )}
                </header>

                {/* RIGHT - Variant-controlled rail */}
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
          </div>
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
