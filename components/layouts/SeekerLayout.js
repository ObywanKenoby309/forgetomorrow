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
  forceChrome,                 // 'seeker' | 'coach' | 'recruiter-smb' | 'recruiter-ent'
  rightVariant = 'dark',       // 'dark' | 'light'
  rightWidth = 260,            // width for right rail (px)
  gap = 12,
  pad = 16,                    // base padding
}) {
  const counts = useSidebarCounts();
  const router = useRouter();

  const [chromeMode, setChromeMode] = useState(
    forceChrome && ALLOWED_MODES.has(forceChrome) ? forceChrome : 'seeker'
  );

  useEffect(() => {
    if (forceChrome && ALLOWED_MODES.has(forceChrome)) {
      setChromeMode(forceChrome);
      return;
    }
    const q = String(router?.query?.chrome || '').toLowerCase();
    if (ALLOWED_MODES.has(q)) setChromeMode(q);
    else setChromeMode('seeker');
  }, [forceChrome, router?.query?.chrome]);

  const { HeaderComp, SidebarComp, sidebarProps } = useMemo(() => {
    switch (chromeMode) {
      case 'coach':
        return {
          HeaderComp: CoachingHeader,
          SidebarComp: CoachingSidebar,
          sidebarProps: { active: activeNav, counts },
        };
      case 'recruiter-smb':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: { variant: 'smb' },
        };
      case 'recruiter-ent':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: { variant: 'enterprise' },
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

  // --- Wallpaper background (applies to seeker / coach / recruiter) ---
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

  // --- Right rail styles ---
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

  // Compute asymmetric page padding:
  // - Keep normal left/top/bottom padding
  // - Slightly reduce the RIGHT padding when a right rail is present to “tighten the edge”
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

      {/* Wallpaper wrapper */}
      <div style={backgroundStyle}>
        {/* Top chrome header */}
        <HeaderComp />

        {/* Main layout shell */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `240px minmax(0, 1fr) ${right ? `${rightWidth}px` : '0px'}`,
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
          {/* LEFT — Sidebar */}
          <aside style={{ gridArea: 'left', alignSelf: 'start', minWidth: 0 }}>
            {left ? left : <SidebarComp {...sidebarProps} />}
          </aside>

          {/* PAGE HEADER (center) */}
          <header style={{ gridArea: 'header', alignSelf: 'start', minWidth: 0 }}>
            {header}
          </header>

          {/* RIGHT — Variant-controlled rail (render only if provided) */}
          {right ? (
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
