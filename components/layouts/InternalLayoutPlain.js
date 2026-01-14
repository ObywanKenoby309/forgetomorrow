// components/layouts/InternalLayoutPlain.js
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import InternalSidebar from '@/components/internal/InternalSidebar';
import EmployeeHeader from '@/components/employee/EmployeeHeader';

// ✅ Plain background (presentation-safe)
const BG = '#F6F7F9';

const ALLOWED_HATS = new Set(['seeker', 'coach', 'recruiter-smb', 'recruiter-ent']);
function normalizeHat(input) {
  const raw = String(input || '').toLowerCase().trim();
  if (ALLOWED_HATS.has(raw)) return raw;
  if (raw === 'recruiter') return 'recruiter-smb';
  if (raw === 'enterprise' || raw === 'ent') return 'recruiter-ent';
  if (raw === 'smb') return 'recruiter-smb';
  return 'seeker';
}

export default function InternalLayoutPlain({
  title = 'ForgeTomorrow — Employee Suite',
  activeNav = 'dashboard',
  headerTitle = 'Employee Suite',
  headerSubtitle = 'ServiceNow-lite for ForgeTomorrow (UI preview)',
  children,

  // Staff identity (UI-first; DB enforcement via getServerSideProps on pages)
  employee = false,
  department = '',

  // Optional: allow pages to pass initial hat
  initialHat = 'seeker',
}) {
  const [isMobile, setIsMobile] = useState(true);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [hat, setHat] = useState(() => normalizeHat(initialHat));

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const GRID_GAP = 12;
  const PAD = 16;
  const LEFT_W = 260;

  // ✅ Grid is ONLY for sidebar + page content (header is now edge-to-edge above)
  const desktopGrid = {
    display: 'grid',
    gridTemplateColumns: `${LEFT_W}px minmax(0, 1fr)`,
    gridTemplateRows: '1fr',
    gridTemplateAreas: `"left content"`,
  };

  const mobileGrid = {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr',
    gridTemplateAreas: `"content"`,
  };

  const gridStyles = isMobile ? mobileGrid : desktopGrid;

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <div style={{ minHeight: '100vh', background: BG }}>
        {/* ✅ EDGE-TO-EDGE HEADER (outside the padded grid) */}
        <EmployeeHeader
          headerTitle={headerTitle}
          headerSubtitle={headerSubtitle}
          employee={employee}
          department={department}
          hat={hat}
          onHatChange={setHat}
          isMobile={isMobile}
          onOpenTools={() => setMobileToolsOpen(true)}
          active={activeNav}
        />

        {/* ✅ MAIN AREA (sidebar + content), padded like the site */}
        <div
          style={{
            ...gridStyles,
            gap: GRID_GAP,
            padding: PAD,
            alignItems: 'start',
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '100vw',
            overflowX: 'hidden',
          }}
        >
          {/* LEFT */}
          {!isMobile ? (
            <aside style={{ gridArea: 'left', alignSelf: 'start', minWidth: 0 }}>
              <InternalSidebar active={activeNav} hat={hat} />
            </aside>
          ) : null}

          {/* CONTENT */}
          <main style={{ gridArea: 'content', minWidth: 0 }}>
            <div style={{ display: 'grid', gap: GRID_GAP, minWidth: 0 }}>{children}</div>
          </main>
        </div>

        {/* MOBILE TOOLS SHEET */}
        {isMobile && mobileToolsOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={() => setMobileToolsOpen(false)}
              aria-label="Dismiss Tools"
              style={{
                position: 'absolute',
                inset: 0,
                border: 'none',
                background: 'rgba(0,0,0,0.55)',
                cursor: 'pointer',
              }}
            />

            <div
              style={{
                position: 'relative',
                zIndex: 1,
                width: 'min(760px, 100%)',
                maxHeight: '82vh',
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                border: '1px solid rgba(17,24,39,0.12)',
                background: '#FFFFFF',
                padding: 16,
                boxSizing: 'border-box',
                overflowY: 'auto',
                boxShadow: '0 -10px 26px rgba(0,0,0,0.22)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#111827' }}>Employee Tools</div>
                <button
                  type="button"
                  onClick={() => setMobileToolsOpen(false)}
                  aria-label="Close Tools"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 22,
                    lineHeight: 1,
                    color: '#6B7280',
                  }}
                >
                  ×
                </button>
              </div>

              <InternalSidebar active={activeNav} hat={hat} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
