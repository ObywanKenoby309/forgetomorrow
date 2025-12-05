// components/layouts/SeekerLayout.js
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useUserWallpaper } from '@/hooks/useUserWallpaper';

import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

import useSidebarCounts from '@/components/hooks/useSidebarCounts';

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
  const seekerCounts = useSidebarCounts();

  // --- Determine chrome type ---
  const initialChrome = (() => {
    if (forceChrome && ALLOWED_MODES.has(forceChrome)) return forceChrome;
    const raw = String(router?.query?.chrome || '').toLowerCase();
    return ALLOWED_MODES.has(raw) ? raw : 'seeker';
  })();

  const [chromeMode, setChromeMode] = useState(initialChrome);
  useEffect(() => {
    if (forceChrome && ALLOWED_MODES.has(forceChrome)) {
      setChromeMode(forceChrome);
      return;
    }
    const raw = String(router?.query?.chrome || '').toLowerCase();
    setChromeMode(ALLOWED_MODES.has(raw) ? raw : 'seeker');
  }, [router?.query?.chrome, forceChrome]);

  // Map chrome → UI components
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
          sidebarProps: { variant: 'smb', active: activeNav, counts: {} },
        };
      case 'recruiter-ent':
        return {
          HeaderComp: RecruiterHeader,
          SidebarComp: RecruiterSidebar,
          sidebarProps: { variant: 'enterprise', active: activeNav, counts: {} },
        };
      case 'seeker':
      default:
        return {
          HeaderComp: SeekerHeader,
          SidebarComp: SeekerSidebar,
          sidebarProps: { active: activeNav, counts: seekerCounts },
        };
    }
  }, [chromeMode, activeNav, seekerCounts]);

  // Wallpaper
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

  // Right rail styling
  const rightShared = {
    gridArea: 'right',
    alignSelf: 'start',
    borderRadius: 12,
    boxSizing: 'border-box',
    width: rightWidth,
    minWidth: rightWidth,
    maxWidth: rightWidth,
  };

  const rightDark = {
    background: '#2a2a2a',
    border: '1px solid #3a3a3a',
    padding: 16,
  };

  const rightLight = { background: 'transparent', padding: 0 };

  // MOBILE WRAPPER (this is the magic)
  const containerStyle = {
    display: 'grid',
    gap,
    padding: pad,
    alignItems: 'start',

    /* ⬇️ MOBILE: collapse to a single column */
    gridTemplateColumns: '1fr',
    gridTemplateAreas: `
      "left"
      "header"
      "content"
      ${right ? `"right"` : ""}
    `,

    /* ⬆️ DESKTOP OVERRIDE */
    ...(typeof window !== 'undefined' && window.innerWidth >= 900
      ? {
          gridTemplateColumns: `240px minmax(0,1fr) ${right ? rightWidth + 'px' : '0px'}`,
          gridTemplateAreas: right
            ? `"left header right" "left content right"`
            : `"left header header" "left content content"`,
        }
      : {}),
  };

  return (
    <>
      <Head><title>{title}</title></Head>

      <div style={backgroundStyle}>
        <HeaderComp />

        {/* MAIN GRID */}
        <div style={containerStyle}>
          {/* LEFT SIDEBAR */}
          <aside style={{ gridArea: 'left', minWidth: 0 }}>
            {left ?? <SidebarComp {...sidebarProps} />}
          </aside>

          {/* PAGE HEADER */}
          <header style={{ gridArea: 'header', minWidth: 0 }}>
            {header}
          </header>

          {/* RIGHT RAIL (moved under content on mobile) */}
          {right && (
            <aside
              style={{
                ...rightShared,
                ...(rightVariant === 'light' ? rightLight : rightDark),
                gridArea: 'right',
              }}
            >
              {right}
            </aside>
          )}

          {/* MAIN CONTENT */}
          <main style={{ gridArea: 'content', minWidth: 0 }}>
            <div style={{ display: 'grid', gap }}>{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
