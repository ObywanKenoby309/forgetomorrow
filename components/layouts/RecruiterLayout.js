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
  const hasRight = Boolean(right);

  // --- Mobile detection (same pattern we used for Seeker/Coach) ---
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };

    handleResize(); // run once at mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Desktop vs mobile grid configs ---
  const desktopGrid = {
    display: 'grid',
    gridTemplateColumns: '240px minmax(640px, 1fr) 240px',
    gridTemplateRows: 'auto 1fr',
    gridTemplateAreas: `
      "left header right"
      "left content right"
    `,
  };

  // On mobile, stack: header → content → right; sidebar goes into overlay
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
      <Head>
        <title>{title}</title>
      </Head>

      <RecruiterHeader />

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
            minWidth: 0,
            display: isMobile ? 'none' : 'block',
          }}
        >
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
              boxSizing: 'border-box',
            }}
          >
            {header}

            {/* Mobile-only "Open Sidebar" button under header content */}
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

            {/* Mobile-only "Open Sidebar" button (non-card header mode) */}
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

            {/* Existing RecruiterSidebar reused inside overlay */}
            <RecruiterSidebar
              active={activeNav}
              role={role}
              variant={variant}
              counts={counts}
              initialOpen={initialOpen}
            />
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
