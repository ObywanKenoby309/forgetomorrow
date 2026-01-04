// components/layouts/CoachingLayout.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';

const UI = {
  GAP: 12,
  PAD: 16,
  LEFT_W: 240,
  RIGHT_W: 240,
  CARD_PAD: 14,
};

// Profile-standard glass (definitive)
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
  activeNav = 'overview', // ← keep receiving this
  sidebarInitialOpen, // ← and this
}) {
  const defaultFromNav =
    {
      overview: 'Your Coaching Dashboard',
      clients: 'Clients',
      sessions: 'Sessions',
      resources: 'Resources',
      feedback: 'Feedback',
      jobs: 'To The Pipeline',
      calendar: 'Calendar',
    }[activeNav] || 'Coaching';

  const pageTitle = headerTitle || defaultFromNav;
  const hasRight = Boolean(right);

  // --- Mobile detection (match Seeker/Recruiter behavior) ---
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

  // --- Desktop vs mobile grid configs (match SeekerLayout structure) ---
  const desktopGrid = {
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
      ? `"header"
         "content"
         "right"`
      : `"header"
         "content"`,
  };

  const gridStyles = isMobile ? mobileGrid : desktopGrid;

  // Asymmetric padding (match SeekerLayout: keep right edge tighter when rail exists)
  const containerPadding = {
    paddingTop: UI.PAD,
    paddingBottom: UI.PAD,
    paddingLeft: UI.PAD,
    paddingRight: hasRight ? Math.max(8, UI.PAD - 4) : UI.PAD,
  };

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <CoachingHeader />

      <div
        style={{
          ...gridStyles,
          gap: UI.GAP,
          ...containerPadding,
          alignItems: 'start',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT — Sidebar (hidden on mobile, moved into overlay) */}
        <aside
          style={{
            gridArea: 'left',
            alignSelf: 'start',
            display: isMobile ? 'none' : 'block',
            minWidth: 0,
          }}
        >
          {left || (
            <CoachingSidebar
              initialOpen={sidebarInitialOpen}
              active={activeNav}
            />
          )}
        </aside>

        {/* HEADER */}
        <header
          style={{
            gridArea: 'header',
            alignSelf: 'start',
            marginTop: 0,
            paddingTop: 0,
            minWidth: 0,
          }}
        >
          {header ?? (
            <section
              style={{
                borderRadius: 14,
                padding: UI.CARD_PAD,
                textAlign: 'center',
                minWidth: 0,
                boxSizing: 'border-box',
                ...GLASS,
              }}
              aria-label="Coaching overview"
            >
              <h1 style={{ margin: 0, color: '#FF7043', fontSize: 22, fontWeight: 900 }}>
                {pageTitle}
              </h1>
              {headerDescription && (
                <p style={{ margin: '6px auto 0', color: '#455A64', maxWidth: 760, fontWeight: 600 }}>
                  {headerDescription}
                </p>
              )}
            </section>
          )}

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

        {/* RIGHT — dark rail (unchanged styling, just kept uniform sizing) */}
        {hasRight && (
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
              width: isMobile ? '100%' : UI.RIGHT_W,
              minWidth: isMobile ? 0 : UI.RIGHT_W,
              maxWidth: isMobile ? '100%' : UI.RIGHT_W,
              minInlineSize: 0,
              color: 'white',
            }}
          >
            {right}
          </aside>
        )}

        {/* CONTENT */}
        <main style={{ gridArea: 'content', minWidth: 0 }}>
          <div style={{ display: 'grid', gap: UI.GAP, width: '100%', minWidth: 0 }}>
            {children}
          </div>
        </main>
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
              <div style={{ fontSize: 14, fontWeight: 700, color: '#263238' }}>Navigation</div>
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

            {left || (
              <CoachingSidebar
                initialOpen={sidebarInitialOpen}
                active={activeNav}
              />
            )}
          </div>

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
