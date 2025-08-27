// components/layouts/SeekerLayout.js
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// Seeker / Coach chrome
import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';

// Recruiter chrome
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

/**
 * Unified chrome layout with gates:
 * Modes: 'seeker' | 'coach' | 'recruiter-smb' | 'recruiter-ent'
 *
 * Precedence: prop (forceChrome) > query (?chrome=) > default 'seeker'
 * Example:
 *   <SeekerLayout forceChrome="coach" ... />
 *   /some-shared-page?chrome=recruiter-smb
 *
 * NOTE: This lets us reuse shared pages (jobs/profile/feed) without duplication.
 */
const ALLOWED_MODES = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);

export default function SeekerLayout({
  title = 'ForgeTomorrow — Seeker',
  left,
  header,      // page-level header band (title/controls), not the top chrome header
  right,
  children,
  activeNav,
  forceChrome, // optional: 'seeker' | 'coach' | 'recruiter-smb' | 'recruiter-ent'
}) {
  const counts = useSidebarCounts();
  const router = useRouter();

  // Initial SSR-safe mode: fall back to 'seeker' to avoid mismatches.
  const [chromeMode, setChromeMode] = useState(
    forceChrome && ALLOWED_MODES.has(forceChrome) ? forceChrome : 'seeker'
  );

  useEffect(() => {
    // 1) Explicit prop wins
    if (forceChrome && ALLOWED_MODES.has(forceChrome)) {
      setChromeMode(forceChrome);
      return;
    }
    // 2) Else honor ?chrome=
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

  return (
    <>
      <Head><title>{title}</title></Head>

      {/* Top chrome header */}
      <HeaderComp />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(640px, 1fr) 240px',
          gridTemplateRows: 'auto 1fr',
          gridTemplateAreas: `
            "left header right"
            "left content right"
          `,
          gap: 20,
          padding: '30px', // site-wide standardized top padding
          alignItems: 'start',
        }}
      >
        {/* LEFT — Sidebar (overridable) */}
        <aside style={{ gridArea: 'left', alignSelf: 'start' }}>
          {left ? left : <SidebarComp {...sidebarProps} />}
        </aside>

        {/* PAGE-LEVEL HEADER SLOT (title band / filters / actions) */}
        <header
          style={{
            gridArea: 'header',
            alignSelf: 'start',
            marginTop: 0,
            paddingTop: 0,
            minWidth: 0,
          }}
        >
          {header}
        </header>

        {/* RIGHT — Dark Rail (uniform across apps) */}
        <aside
          style={{
            gridArea: 'right',
            alignSelf: 'start',
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            minHeight: 120,
            boxSizing: 'border-box',
            width: 240,
            minWidth: 240,
            maxWidth: 240,
            minInlineSize: 0,
          }}
        >
          {right}
        </aside>

        {/* CONTENT */}
        <main style={{ gridArea: 'content', minWidth: 0 }}>
          <div style={{ display: 'grid', gap: 20, width: '100%', minWidth: 0 }}>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
