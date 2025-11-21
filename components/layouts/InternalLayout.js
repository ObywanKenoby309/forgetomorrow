// components/layouts/InternalLayout.js  ← PATCHED VERSION
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';

// Import all chrome components (same as SeekerLayout)
import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';
import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';

const ALLOWED_MODES = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);

export default function InternalLayout({
  title = 'ForgeTomorrow',
  left,
  header,
  right,
  children,
  activeNav,
  forceChrome,                 // ← new prop
  rightVariant = 'dark',
  rightWidth = 260,
  gap = 12,
  pad = 16,
}) {
  const router = useRouter();
  const counts = useSidebarCounts();

  // Exact same chrome detection logic as SeekerLayout
  const [chromeMode, setChromeMode] = useState('seeker');
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
        return { HeaderComp: CoachingHeader, SidebarComp: CoachingSidebar, sidebarProps: { active: activeNav, counts } };
      case 'recruiter-smb':
      case 'recruiter-ent':
        return { HeaderComp: RecruiterHeader, SidebarComp: RecruiterSidebar, sidebarProps: { variant: chromeMode === 'recruiter-ent' ? 'enterprise' : 'smb' } };
      case 'seeker':
      default:
        return { HeaderComp: SeekerHeader, SidebarComp: SeekerSidebar, sidebarProps: { active: activeNav, counts } };
    }
  }, [chromeMode, activeNav, counts]);

  // Only render right rail if explicitly passed (fixes double-rail bug)
  const showRight = right != null;

  // Rest of your styling stays 100% identical
  const rightBase = { /* ... your existing styles ... */ };
  const rightDark = { /* ... */ };
  const rightLight = { /* ... */ };
  const containerPadding = { /* ... */ };

  return (
    <>
      <Head><title>{title}</title></Head>
      <HeaderComp />
      <div style={{
        display: 'grid',
        gridTemplateColumns: `240px minmax(0, 1fr) ${showRight ? `${rightWidth}px` : '0px'}`,
        gridTemplateAreas: showRight
          ? `"left header right" "left content right"`
          : `"left header header" "left content content"`,
        gap,
        ...containerPadding,
        alignItems: 'start',
      }}>
        <aside style={{ gridArea: 'left', alignSelf: 'start' }}>
          {left ?? <SidebarComp {...sidebarProps} />}
        </aside>
        <header style={{ gridArea: 'header' }}>{header}</header>
        {showRight && (
          <aside style={{ ...rightBase, ...(rightVariant === 'light' ? rightLight : rightDark) }}>
            {right}
          </aside>
        )}
        <main style={{ gridArea: 'content' }}>
          <div style={{ display: 'grid', gap }}>{children}</div>
        </main>
      </div>
    </>
  );
}