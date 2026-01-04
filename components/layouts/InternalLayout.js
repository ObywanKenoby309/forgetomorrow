// components/layouts/InternalLayout.js
import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSidebarCounts from '@/components/hooks/useSidebarCounts';

// Chrome-specific headers + sidebars
import SeekerSidebar from '@/components/SeekerSidebar';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

import SeekerHeader from '@/components/seeker/SeekerHeader';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';

const ALLOWED_MODES = new Set([
  'seeker',
  'coach',
  'recruiter-smb',
  'recruiter-ent',
]);

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

  const showRight = right != null;

  const containerPadding = {
    padding: pad,
    paddingTop: pad + 8,
  };

  const rightBase = {
    gridArea: 'right',
    alignSelf: 'start',
    borderRadius: 16,
    padding: 12,
    boxSizing: 'border-box',
    maxWidth: rightWidth,
  };

  const rightDark = {
    background: 'linear-gradient(135deg, #0B1724, #112033)',
    border: '1px solid rgba(148, 163, 184, 0.5)',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.45)',
    color: '#E2E8F0',
  };

  const rightLight = {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
    color: '#111827',
  };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <HeaderComp />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showRight
            ? `240px minmax(0, 1fr) ${rightWidth}px`
            : '240px minmax(0, 1fr)',
          gridTemplateAreas: showRight
            ? `"left header right" "left content right"`
            : `"left header header" "left content content"`,
          columnGap: gap,
          rowGap: gap,
          alignItems: 'start',
          maxWidth: 1440,
          margin: '0 auto',
          ...containerPadding,
        }}
      >
        <aside style={{ gridArea: 'left', alignSelf: 'start' }}>
          {left ?? <SidebarComp {...sidebarProps} />}
        </aside>

        <header style={{ gridArea: 'header' }}>{header}</header>

        {showRight && (
          <aside
            style={{
              ...rightBase,
              ...(rightVariant === 'light' ? rightLight : rightDark),
            }}
          >
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
