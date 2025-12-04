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
  title = 'ForgeTomorrow — Seeker',
  left,
  header,
  right,
  children,
  activeNav,
  forceChrome,
  rightVariant = 'dark',
  rightWidth = 260,
  gap = 12,
  pad = 16,
}) {
  const router = useRouter();

  // 🔥 FIX 1 — Determine chrome BEFORE any render
  const initialChrome = (() => {
    if (forceChrome && ALLOWED_MODES.has(forceChrome)) return forceChrome;

    const q = String(router?.query?.chrome || '').toLowerCase();
    if (ALLOWED_MODES.has(q)) return q;

    return 'seeker';
  })();

  const [chromeMode, setChromeMode] = useState(initialChrome);

  // 🔥 FIX 2 — Update if chrome query changes AFTER mount
  useEffect(() => {
    const q = String(router?.query?.chrome || '').toLowerCase();
    if (ALLOWED_MODES.has(q)) setChromeMode(q);
    else if (forceChrome && ALLOWED_MODES.has(forceChrome)) setChromeMode(forceChrome);
    else setChromeMode('seeker');
  }, [router?.query?.chrome, forceChrome]);

  // 🔥 FIX 3 — Only seekers use Seeker counts (this prevented recruiter redirects)
  const isSeekerChrome = chromeMode === 'seeker';
  const counts = isSeekerChrome ? useSidebarCounts() : {};

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
    sidebarProps: { variant: 'smb', counts, active: activeNav },
  };
case 'recruiter-ent':
  return {
    HeaderComp: RecruiterHeader,
    SidebarComp: RecruiterSidebar,
    sidebarProps: { variant: 'enterprise', counts, active: activeNav },
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

  // Wallpaper logic
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

  // Right-rail style presets
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

  const containerPadding = {
    paddingTop: pad,
    paddingBottom: pad,
    paddingLeft: pad,
    paddingRight: right ? Math.max(8, pad - 4) : pad,
  };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div style={backgroundStyle}>
        {/* 🔥 FIX 4 — Header ALWAYS matches chromeMode */}
        <HeaderComp />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `240px minmax(0, 1fr) ${
              right ? `${rightWidth}px` : '0px'
            }`,
            gridTemplateRows: 'auto 1fr',
            gridTemplateAreas: right
              ? `"left header right"
                 "left content right"`
              : `"left header header"
                 "left content content"`,
            gap,
            ...containerPadding,
            alignItems: 'start',
          }}
        >
          {/* LEFT SIDEBAR */}
          <aside style={{ gridArea: 'left', alignSelf: 'start', minWidth: 0 }}>
            {left ? left : <SidebarComp {...sidebarProps} />}
          </aside>

          {/* PAGE HEADER */}
          <header style={{ gridArea: 'header', minWidth: 0 }}>{header}</header>

          {/* RIGHT RAIL */}
          {right && (
            <aside
              style={{
                ...rightBase,
                ...(rightVariant === 'light' ? rightLight : rightDark),
              }}
            >
              {right}
            </aside>
          )}

          {/* PAGE CONTENT */}
          <main style={{ gridArea: 'content', minWidth: 0 }}>
            <div style={{ display: 'grid', gap }}>{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
