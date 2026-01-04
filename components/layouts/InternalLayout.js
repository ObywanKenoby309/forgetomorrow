// components/layouts/InternalLayout.js
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';

// Chrome-specific headers + sidebars
import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';

const ALLOWED_MODES = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);

function normalizeChrome(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (!raw) return '';

  // Backward-compatible aliases
  if (raw === 'recruiter') return 'recruiter-smb';
  if (raw === 'enterprise') return 'recruiter-ent';

  return raw;
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

export default function InternalLayout({
  title = 'ForgeTomorrow',
  left,
  header,
  right,
  children,
  activeNav,

  // ✅ canonical override
  forceChrome,

  // ✅ backwards compat (some pages pass `chrome=...`)
  chrome,

  rightVariant = 'dark', // 'dark' | 'light'
  rightWidth = 260,
  leftWidth = 240, // ✅ match SeekerLayout flexibility
  gap = 12,
  pad = 16,
}) {
  const router = useRouter();
  const counts = useSidebarCounts();

  const [chromeMode, setChromeMode] = useState('seeker');

  useEffect(() => {
    // 1) Explicit override wins (forceChrome OR chrome prop)
    const override = normalizeChrome(forceChrome || chrome);
    if (override && ALLOWED_MODES.has(override)) {
      setChromeMode(override);
      return;
    }

    // 2) router.query.chrome
    const q = normalizeChrome(router?.query?.chrome);
    if (q && ALLOWED_MODES.has(q)) {
      setChromeMode(q);
      return;
    }

    // 3) router.asPath (covers first load / query not ready)
    const fromPath = extractChromeFromAsPath(router?.asPath);
    if (fromPath && ALLOWED_MODES.has(fromPath)) {
      setChromeMode(fromPath);
      return;
    }

    // 4) default
    setChromeMode('seeker');
  }, [forceChrome, chrome, router?.query?.chrome, router?.asPath]);

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

  // ---- WALLPAPER / BACKGROUND (match SeekerLayout) ----
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

  // ---- MOBILE DETECTION + SIDEBAR OVERLAY (match SeekerLayout behavior) ----
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

  // ---- RIGHT RAIL STYLES (match SeekerLayout) ----
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

  // Asymmetric padding to keep right edge tight when a rail exists (match SeekerLayout)
  const containerPadding = {
    paddingTop: pad,
    paddingBottom: pad,
    paddingLeft: pad,
    paddingRight: hasRight ? Math.max(8, pad - 4) : pad,
  };

  // ---- DESKTOP VS MOBILE GRID (match SeekerLayout structure) ----
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
            {left ?? <SidebarComp {...sidebarProps} />}
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
              <div style={{ fontSize: 14, fontWeight: 700, color: '#263238' }}>
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
            {left ?? <SidebarComp {...sidebarProps} />}
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
