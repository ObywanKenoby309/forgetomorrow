// components/layouts/CoachingLayout.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import CoachingHeader from '@/components/coaching/CoachingHeader';
import CoachingSidebar from '@/components/coaching/CoachingSidebar';

export default function CoachingLayout({
  title = 'ForgeTomorrow — Coaching',
  header,
  headerTitle = '',
  headerDescription = '',
  left,
  right,
  children,
  activeNav = 'overview',     // ← keep receiving this
  sidebarInitialOpen,         // ← and this
}) {
  const defaultFromNav = {
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

  const desktopGrid = {
    display: 'grid',
    gridTemplateColumns: '240px minmax(640px, 1fr) 240px',
    gridTemplateRows: 'min-content 1fr',
    gridTemplateAreas: `
      "left header right"
      "left content right"
    `,
  };

  const mobileGrid = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: hasRight ? 'auto auto auto' : 'auto auto',
    gridTemplateAreas: hasRight
      ? `
        "header"
        "content"
        "right"
      `
      : `
        "header"
        "content"
      `,
  };

  const gridStyles = isMobile ? mobileGrid : desktopGrid;

  return (
    <>
      <Head><title>{title}</title></Head>
      <CoachingHeader />

      <div
        style={{
          ...gridStyles,
          gap: 20,
          padding: isMobile ? '16px' : '30px',
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
          }}
        >
          {left || (
            <CoachingSidebar
              initialOpen={sidebarInitialOpen}  // ← force sections open/closed
              active={activeNav}                // ← ensures correct highlight on all routes
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
                background: 'white',
                border: '1px solid #eee',
                borderRadius: 12,
                padding: 16,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                textAlign: 'center',
              }}
            >
              <h1 style={{ color: '#FF7043', fontSize: 24, fontWeight: 800, margin: 0 }}>
                {pageTitle}
              </h1>
              {headerDescription && (
                <p style={{ margin: '6px auto 0', color: '#607D8B', maxWidth: 720 }}>
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

        {/* RIGHT — dark rail */}
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
              width: isMobile ? '100%' : 240,
              minWidth: isMobile ? 0 : 240,
              maxWidth: isMobile ? '100%' : 240,
              minInlineSize: 0,
              color: 'white',
            }}
          >
            {right}
          </aside>
        )}

        {/* CONTENT */}
        <main style={{ gridArea: 'content', minWidth: 0 }}>
          <div style={{ display: 'grid', gap: 20, width: '100%', minWidth: 0 }}>
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
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#263238',
                }}
              >
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

            {/* Coaching sidebar in overlay */}
            {left || (
              <CoachingSidebar
                initialOpen={sidebarInitialOpen}
                active={activeNav}
              />
            )}
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
