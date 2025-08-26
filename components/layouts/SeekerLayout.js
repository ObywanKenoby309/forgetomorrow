// components/layouts/SeekerLayout.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';

/**
 * Chrome control (coach | seeker) for Seeker routes:
 * - query param: ?chrome=coach | seeker
 * - optional prop: forceChrome='coach' | 'seeker' (future use)
 * Precedence: prop > query > default 'seeker'
 *
 * Hydration-safe: SSR + first client render = 'seeker'. We only swap after mount.
 */
export default function SeekerLayout({
  title = 'ForgeTomorrow — Seeker',
  left,
  header,      // page-level header band (title/controls), not the top chrome header
  right,
  children,
  activeNav,
  forceChrome, // optional: 'coach' | 'seeker' (not required today)
}) {
  const counts = useSidebarCounts();
  const router = useRouter();

  // SSR/first render = seeker to avoid mismatches.
  const [chromeMode, setChromeMode] = useState(
    forceChrome === 'coach' || forceChrome === 'seeker' ? forceChrome : 'seeker'
  );

  useEffect(() => {
    // Honor explicit prop if provided
    if (forceChrome === 'coach' || forceChrome === 'seeker') {
      setChromeMode(forceChrome);
      return;
    }
    // Otherwise, look for ?chrome=coach|seeker
    const q = router?.query?.chrome;
    if (q === 'coach' || q === 'seeker') setChromeMode(q);
    else setChromeMode('seeker');
  }, [forceChrome, router?.query?.chrome]);

  const useCoachChrome = chromeMode === 'coach';

  return (
    <>
      <Head><title>{title}</title></Head>

      {/* Top chrome header (never replaced by the page `header` prop) */}
      {useCoachChrome ? <CoachingHeader /> : <SeekerHeader />}

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
          padding: '30px',
          alignItems: 'start',
        }}
      >
        {/* LEFT — Sidebar (coach vs seeker chrome) */}
        <aside style={{ gridArea: 'left', alignSelf: 'start' }}>
          {left
            ? left
            : useCoachChrome
              ? <CoachingSidebar active={activeNav} counts={counts} />
              : <SeekerSidebar active={activeNav} counts={counts} />
          }
        </aside>

        {/* PAGE-LEVEL HEADER SLOT (title band / filters for the current page) */}
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

        {/* RIGHT — Dark Rail */}
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
