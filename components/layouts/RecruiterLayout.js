// components/layouts/RecruiterLayout.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import RecruiterHeader from '@/components/recruiter/RecruiterHeader';
import RecruiterSidebar from '@/components/recruiter/RecruiterSidebar';

/**
 * Recruiter-only layout.
 * - Grid/padding/right-rail match SeekerLayout for uniformity.
 * - `headerCard` (default true) wraps the header slot in a white card.
 * - `role` (org-level permission) and `variant` (smb|enterprise) pass to sidebar.
 * - `activeNav` tells the sidebar which item should be highlighted.
 */
export default function RecruiterLayout({
  title = 'ForgeTomorrow — Recruiter',
  header,
  right,
  children,
  headerCard = true,
  role = 'recruiter',        // 'owner' | 'admin' | 'billing' | 'recruiter' | 'hiringManager'
  variant = 'smb',           // 'smb' | 'enterprise'
  counts,                    // optional badges
  initialOpen,               // optional section defaults
  activeNav = 'dashboard',   // default active nav item
}) {
  // Simple mobile flag based on viewport width
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };

    handleResize(); // run once on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasRight = Boolean(right);

  // Desktop: 3-column grid (sidebar | content | right rail)
  const desktopGrid = {
    display: 'grid',
    gridTemplateColumns: '240px minmax(640px, 1fr) 240px',
    gridTemplateRows: 'auto 1fr',
    gridTemplateAreas: `
      "left header right"
      "left content right"
    `,
  };

  // Mobile: single column, stacked
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
      <Head>
        <title>{title}</title>
      </Head>

      <RecruiterHeader />

      <div
        style={{
          ...(isMobile ? mobileGrid : desktopGrid),
          gap: 20,
          // slightly reduced horizontal padding for smaller screens
          padding: isMobile ? '16px' : '30px 16px',
          alignItems: 'start',
          boxSizing: 'border-box',
        }}
      >
        {/* LEFT — Sidebar */}
        <aside style={{ gridArea: 'left', alignSelf: 'start', minWidth: 0 }}>
          <RecruiterSidebar
            active={activeNav}
            role={role}
            variant={variant}
            counts={counts}
            initialOpen={initialOpen}
          />
        </aside>

        {/* PAGE-LEVEL HEADER SLOT (boxed by default) */}
        {headerCard ? (
          <section
            style={{
              gridArea: 'header',
              background: 'white',
              borderRadius: 12,
              padding: '8px 16px',
              border: '1px solid #eee',
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              minWidth: 0,
            }}
          >
            {header}
          </section>
        ) : (
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
        )}

        {/* RIGHT — Dark Rail */}
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
            }}
          >
            {right}
          </aside>
        )}

        {/* CONTENT */}
        <main style={{ gridArea: 'content', minWidth: 0 }}>
          <div
            style={{
              display: 'grid',
              gap: 20,
              width: '100%',
              minWidth: 0,
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
