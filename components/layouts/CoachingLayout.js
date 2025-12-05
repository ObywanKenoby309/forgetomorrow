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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    gridTemplateRows: 'auto auto auto auto',
    gridTemplateAreas: hasRight
      ? `
        "header"
        "content"
        "right"
        "left"
      `
      : `
        "header"
        "content"
        "left"
      `,
  };

  return (
    <>
      <Head><title>{title}</title></Head>
      <CoachingHeader />

      <div
        style={{
          ...(isMobile ? mobileGrid : desktopGrid),
          gap: 20,
          padding: '30px 16px',
          alignItems: 'start',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT — Sidebar */}
        <aside style={{ gridArea: 'left', alignSelf: 'start', minWidth: 0 }}>
          {left || (
            <CoachingSidebar
              initialOpen={sidebarInitialOpen}  // ← force sections open/closed
              active={activeNav}                // ← ensures correct highlight on all routes
            />
          )}
        </aside>

        {/* HEADER */}
        <header
          style={{ gridArea: 'header', alignSelf: 'start', marginTop: 0, paddingTop: 0, minWidth: 0 }}
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
              width: 240,
              minWidth: 240,
              maxWidth: 240,
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
    </>
  );
}
