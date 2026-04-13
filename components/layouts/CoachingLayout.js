// components/layouts/CoachingLayout.js
import React, { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';

import MobileBottomBar from '@/components/mobile/MobileBottomBar';
import SupportFloatingButton from '@/components/SupportFloatingButton';

const UI = {
  GAP: 12,
  PAD: 16,
  LEFT_W: 240,
  RIGHT_W: 240,
  CARD_PAD: 14,
};

const GLASS = {
  border: '1px solid rgba(255,255,255,0.22)',
  background: 'rgba(255,255,255,0.58)',
  boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

export default function CoachingLayout({
  title = 'ForgeTomorrow — Coaching',
  header,
  headerTitle = '',
  headerDescription = '',
  left,
  right,
  children,
  activeNav = 'overview',
  sidebarInitialOpen,
  employee = false,
  department = '',
  rightVariant = 'dark',
  contentFullBleed = false,
}) {
  const defaultFromNav =
    {
      overview: 'Your Coaching Dashboard',
      dashboard: 'Your Coaching Dashboard',
      clients: 'Clients',
      sessions: 'Sessions',
      resources: 'Resources',
      feedback: 'Feedback',
      jobs: 'To The Pipeline',
      calendar: 'Calendar',
    }[activeNav] || 'Coaching';

  const pageTitle = headerTitle || defaultFromNav;
  const hasRight = Boolean(right);
  const hasHeader = Boolean(header);

  const [isMobile, setIsMobile] = useState(null);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [profileSlug, setProfileSlug] = useState('');

  const handleOpenTools = useCallback(() => setMobileToolsOpen(true), []);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let alive = true;

    const loadProfileSlug = async () => {
      try {
        const res = await fetch('/api/profile/details', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!res.ok) return;

        const data = await res.json();
        if (!alive) return;

        const nextSlug =
          data?.user?.slug ||
          data?.details?.slug ||
          data?.slug ||
          '';

        if (nextSlug) {
          setProfileSlug(String(nextSlug));
        }
      } catch {
        // no-op
      }
    };

    loadProfileSlug();

    return () => {
      alive = false;
    };
  }, []);

  const isMobileReady = isMobile !== null;
  const isMobileBool = isMobile === true;

  const desktopGrid = (!hasHeader && !hasRight)
    ? {
        display: 'grid',
        gridTemplateColumns: `${UI.LEFT_W}px minmax(0, 1fr)`,
        gridTemplateRows: '1fr',
        gridTemplateAreas: `"left content"`,
      }
    : {
        display: 'grid',
        gridTemplateColumns: `${UI.LEFT_W}px minmax(0, 1fr) ${hasRight ? `${UI.RIGHT_W}px` : '0px'}`,
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
      ? `"header" "content" "right"`
      : `"header" "content"`,
  };

  const gridStyles = isMobileBool ? mobileGrid : desktopGrid;
  const chromeMode = 'coach';

  const leftRailLayer = { position: 'relative', zIndex: 10 };
  const mainOverrides = { position: 'relative', zIndex: 1 };

  const rightRailStyle = {
    gridArea: 'right',
    alignSelf: 'start',
    ...(rightVariant === 'light'
      ? {
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          padding: 0,
          borderRadius: 0,
        }
      : {
          border: GLASS.border,
          background: GLASS.background,
          boxShadow: GLASS.boxShadow,
          backdropFilter: GLASS.backdropFilter,
          WebkitBackdropFilter: GLASS.WebkitBackdropFilter,
          borderRadius: 14,
          padding: 16,
        }),
    minHeight: 120,
    boxSizing: 'border-box',
    width: isMobileBool ? '100%' : UI.RIGHT_W,
    minWidth: isMobileBool ? 0 : UI.RIGHT_W,
    maxWidth: isMobileBool ? '100%' : UI.RIGHT_W,
    minInlineSize: 0,
    color: '#112033',
  };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <CoachingHeader />

      {isMobileReady ? (
        <div
          style={{
            ...gridStyles,
            gap: UI.GAP,
            paddingTop: UI.PAD,
            paddingBottom: isMobileBool ? UI.PAD + 84 : UI.PAD,
            paddingLeft: UI.PAD,
            paddingRight: hasRight ? Math.max(8, UI.PAD - 4) : UI.PAD,
            alignItems: 'start',
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '100vw',
            overflowX: 'hidden',
            minWidth: 0,
          }}
        >
          <aside
            style={{
              ...leftRailLayer,
              gridArea: 'left',
              alignSelf: 'start',
              display: isMobileBool ? 'none' : 'block',
              minWidth: 0,
            }}
          >
            {left || (
              <CoachingSidebar
                initialOpen={sidebarInitialOpen}
                active={activeNav}
                employee={employee}
                department={department}
                profileSlug={profileSlug}
              />
            )}
          </aside>

          {hasHeader ? (
            <header style={{ gridArea: 'header', alignSelf: 'start', marginTop: 0, paddingTop: 0, minWidth: 0 }}>
              {header ?? (
                <section
                  style={{ borderRadius: 14, padding: UI.CARD_PAD, textAlign: 'center', minWidth: 0, boxSizing: 'border-box', ...GLASS }}
                  aria-label="Coaching overview"
                >
                  <h1 style={{ margin: 0, color: '#FF7043', fontSize: 22, fontWeight: 900 }}>{pageTitle}</h1>
                  {headerDescription && (
                    <p style={{ margin: '6px auto 0', color: '#455A64', maxWidth: 760, fontWeight: 600 }}>
                      {headerDescription}
                    </p>
                  )}
                </section>
              )}
            </header>
          ) : null}

          {hasRight && (
            <aside style={rightRailStyle}>
              {right}
            </aside>
          )}

          <main
            style={{
              gridArea: 'content',
              minWidth: 0,
              width: '100%',
              maxWidth: '100%',
              ...(!contentFullBleed ? { overflowX: 'hidden' } : {}),
              ...mainOverrides,
            }}
          >
            <div style={{ display: 'grid', gap: UI.GAP, width: '100%', minWidth: 0, maxWidth: '100%' }}>
              {children}
            </div>
          </main>
        </div>
      ) : (
        <div style={{ paddingTop: UI.PAD, paddingLeft: UI.PAD, paddingRight: UI.PAD, paddingBottom: UI.PAD }}>
          <div style={{ height: 180 }} />
        </div>
      )}

      <SupportFloatingButton />
      <MobileBottomBar isMobile={isMobileBool} chromeMode={chromeMode} onOpenTools={handleOpenTools} />

      {isMobileBool && mobileToolsOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setMobileToolsOpen(false)}
            aria-label="Dismiss Tools"
            style={{ position: 'absolute', inset: 0, border: 'none', background: 'rgba(0,0,0,0.55)', cursor: 'pointer' }}
          />
          <div
            style={{
              position: 'relative', zIndex: 1, width: 'min(760px, 100%)', maxHeight: '82vh',
              borderTopLeftRadius: 18, borderTopRightRadius: 18,
              border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              padding: 16, boxSizing: 'border-box', overflowY: 'auto',
              boxShadow: '0 -10px 26px rgba(0,0,0,0.22)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#112033' }}>Tools</div>
              <button
                type="button"
                onClick={() => setMobileToolsOpen(false)}
                aria-label="Close Tools"
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, lineHeight: 1, color: '#546E7A' }}
              >×</button>
            </div>
            {left || (
              <CoachingSidebar
                initialOpen={sidebarInitialOpen}
                active={activeNav}
                employee={employee}
                department={department}
                profileSlug={profileSlug}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}